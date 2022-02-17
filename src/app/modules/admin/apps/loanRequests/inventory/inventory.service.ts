/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { LoanRequestsPagination, LoanRequestModel } from 'app/modules/admin/apps/loanRequests/inventory/inventory.types';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Private
  private _pagination: BehaviorSubject<LoanRequestsPagination | null> = new BehaviorSubject(null);
  private _loanRequest: BehaviorSubject<LoanRequestModel | null> = new BehaviorSubject(null);
  private _loanRequests: BehaviorSubject<LoanRequestModel[] | null> = new BehaviorSubject(null);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for pagination
   */
  get pagination$(): Observable<LoanRequestsPagination> {
    return this._pagination.asObservable();
  }

  /**
   * Getter for loanRequest
   */
  get loanRequest$(): Observable<LoanRequestModel> {
    return this._loanRequest.asObservable();
  }

  /**
   * Getter for loanRequests
   */
  get loanRequests$(): Observable<LoanRequestModel[]> {
    return this._loanRequests.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get loanRequests
   *
   *
   * @param page
   * @param size
   * @param sort
   * @param order
   * @param search
   */

  getLoanRequests(
    page: number = 1,
    size: number = 10,
    sort: string = 'name',
    order: 'asc' | 'desc' | '' = 'asc',
    search: string = ''
  ): Observable<{ pagination: LoanRequestsPagination; loanRequests: LoanRequestModel[] }> {
    return this._httpClient
      .get<{ pagination: LoanRequestsPagination; loanRequests: LoanRequestModel[] }>(
        environment.baseURL + '/api/loans',
        {
          params: {
            // page: '' + page
            // size: '' + size,
            // sort,
            // order,
            // search
          }
        }
      )
      .pipe(
        tap((response) => {
          const tempPagination = {
            length: 100,
            size: 100,
            page: 1,
            lastPage: 0,
            startIndex: 0,
            endIndex: 100
          };

          this._pagination.next(tempPagination);
          this._loanRequests.next((response as any));
        })
      );
  }

  /**
   * Get loanRequest by id
   */
  getLoanRequestById(id: string): Observable<LoanRequestModel> {
    return this._loanRequests.pipe(
      take(1),
      map((loanRequests) => {
        // Find the loanRequest
        const loanRequest = loanRequests.find((item) => item.id === id) || null;

        // Update the loanRequest
        this._loanRequest.next(loanRequest);

        // Return the loanRequest
        return loanRequest;
      }),
      switchMap((loanRequest) => {
        if (!loanRequest) {
          return throwError('Could not found loanRequest with id of ' + id + '!');
        }

        return of(loanRequest);
      })
    );
  }

  /**
   * Create loanRequest
   */
  createLoanRequest(): Observable<LoanRequestModel> {
    return this.loanRequests$.pipe(
      take(1),
      switchMap((loanRequests) =>
        this._httpClient.post<LoanRequestModel>('api/loans', {}).pipe(
          map((newLoanRequest) => {
            // Update the loanRequests with the new loanRequest
            this._loanRequests.next([newLoanRequest, ...loanRequests]);

            // Return the new loanRequest
            return newLoanRequest;
          })
        )
      )
    );
  }

  /**
   * Update loanRequest
   *
   * @param id
   * @param loanRequest
   */
  updateLoanRequest(id: string, loanRequest: any): Observable<LoanRequestModel> {

    console.log(id +"  " + loanRequest);
    const baseURL = environment.baseURL;
    let url = `${baseURL}/api/loans/${id}`;
    const tempLoanRequest = loanRequest;
      return this.loanRequests$.pipe(
        take(1),
        switchMap((loanRequests) =>
          this._httpClient.patch<LoanRequestModel>(url, tempLoanRequest).pipe(
            map((updatedLoanRequest) => {
              // Find the index of the updated loanRequest
              const index = loanRequests.findIndex((item) => item.id === id);
              // Update the loanRequest
              loanRequests[index] = (updatedLoanRequest as any);
              // Update the loanRequests
              this._loanRequests.next(loanRequests);
              // Return the updated loanRequest
              return updatedLoanRequest;
            }),
            switchMap((updatedLoanRequest) =>
              this.loanRequest$.pipe(
                take(1),
                filter((item) => item && item.id === id),
                tap(() => {
                  // Update the loanRequest if it's selected
                  this._loanRequest.next((updatedLoanRequest as any));
                  // Return the updated loanRequest
                  return updatedLoanRequest;
                })
              )
            )
          )
        )
      );
  }

  /**
   * Delete the loanRequest
   *
   * @param id
   */
  deleteLoanRequest(id: string): Observable<boolean> {
    const url = id.toString() === '-1' ? 'api/apps/loanRequest/inventory/loanRequest' : `${environment.baseURL}/api/pick-drop/${id}`;
    console.log('url: ', url);
    return this.loanRequests$.pipe(
      take(1),
      switchMap((loanRequests) =>
        this._httpClient.delete(url, { params: { id } }).pipe(
          map((isDeleted: boolean) => {
            // Find the index of the deleted loanRequest
            const index = loanRequests.findIndex((item) => item.id === id);

            // Delete the loanRequest
            loanRequests.splice(index, 1);

            // Update the loanRequests
            this._loanRequests.next(loanRequests);

            // Return the deleted status
            return isDeleted;
          })
        )
      )
    );
  }

  /**
   * Update the avatar of the given contact
   *
   * @param id
   * @param avatar
   */
  /*uploadAvatar(id: string, avatar: File): Observable<Contact>
    {
        return this.contacts$.pipe(
            take(1),
            switchMap(contacts => this._httpClient.post<Contact>('api/apps/contacts/avatar', {
                id,
                avatar
            }, {
                headers: {
                    'Content-Type': avatar.type
                }
            }).pipe(
                map((updatedContact) => {

                    // Find the index of the updated contact
                    const index = contacts.findIndex(item => item._id === id);

                    // Update the contact
                    contacts[index] = updatedContact;

                    // Update the contacts
                    this._contacts.next(contacts);

                    // Return the updated contact
                    return updatedContact;
                }),
                switchMap(updatedContact => this.contact$.pipe(
                    take(1),
                    filter(item => item && item._id === id),
                    tap(() => {

                        // Update the contact if it's selected
                        this._contact.next(updatedContact);

                        // Return the updated contact
                        return updatedContact;
                    })
                ))
            ))
        );
    }*/
}
