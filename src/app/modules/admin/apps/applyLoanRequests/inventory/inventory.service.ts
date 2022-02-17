/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { ApplyLoanRequestsPagination, ApplyLoanRequestModel } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.types';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Private
  private _pagination: BehaviorSubject<ApplyLoanRequestsPagination | null> = new BehaviorSubject(null);
  private _applyLoanRequest: BehaviorSubject<ApplyLoanRequestModel | null> = new BehaviorSubject(null);
  private _applyLoanRequests: BehaviorSubject<ApplyLoanRequestModel[] | null> = new BehaviorSubject(null);

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
  get pagination$(): Observable<ApplyLoanRequestsPagination> {
    return this._pagination.asObservable();
  }

  /**
   * Getter for applyLoanRequest
   */
  get applyLoanRequest$(): Observable<ApplyLoanRequestModel> {
    return this._applyLoanRequest.asObservable();
  }

  /**
   * Getter for applyLoanRequests
   */
  get applyLoanRequests$(): Observable<ApplyLoanRequestModel[]> {
    return this._applyLoanRequests.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get applyLoanRequests
   *
   *
   * @param page
   * @param size
   * @param sort
   * @param order
   * @param search
   */
  getApplyLoanRequests(
    page: number = 1,
    size: number = 10,
    sort: string = 'name',
    order: 'asc' | 'desc' | '' = 'asc',
    search: string = ''
  ): Observable<{ pagination: ApplyLoanRequestsPagination; applyLoanRequests: ApplyLoanRequestModel[] }> {
    return this._httpClient
      .get<{ pagination: ApplyLoanRequestsPagination; applyLoanRequests: ApplyLoanRequestModel[] }>(
        environment.baseURL + '/api/loan-eligibility',
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
          this._applyLoanRequests.next((response as any));
        })
      );
  }

  /**
   * Get applyLoanRequest by id
   */
  getApplyLoanRequestById(id: string): Observable<ApplyLoanRequestModel> {
    return this._applyLoanRequests.pipe(
      take(1),
      map((applyLoanRequests) => {
        // Find the applyLoanRequest
        const applyLoanRequest = applyLoanRequests.find((item) => item.productId === id) || null;

        // Update the applyLoanRequest
        this._applyLoanRequest.next(applyLoanRequest);

        // Return the applyLoanRequest
        return applyLoanRequest;
      }),
      switchMap((applyLoanRequest) => {
        if (!applyLoanRequest) {
          return throwError('Could not found applyLoanRequest with id of ' + id + '!');
        }

        return of(applyLoanRequest);
      })
    );
  }

  /**
   * Create applyLoanRequest
   */
  createApplyLoanRequest(): Observable<ApplyLoanRequestModel> {
    return this.applyLoanRequests$.pipe(
      take(1),
      switchMap((applyLoanRequests) =>
        this._httpClient.post<ApplyLoanRequestModel>('api/applyLoans', {}).pipe(
          map((newApplyLoanRequest) => {
            // Update the applyLoanRequests with the new applyLoanRequest
            this._applyLoanRequests.next([newApplyLoanRequest, ...applyLoanRequests]);

            // Return the new applyLoanRequest
            return newApplyLoanRequest;
          })
        )
      )
    );
  }

  /**
   * Update applyLoanRequest
   *
   * @param id
   * @param applyLoanRequest
   */
  updateApplyLoanRequest(id: string, applyLoanRequest: any): Observable<ApplyLoanRequestModel> {

    console.log(applyLoanRequest);
    const baseURL = environment.baseURL;
    let url = `${baseURL}/api/loans`;
    const tempApplyLoanRequest = applyLoanRequest;
      return this.applyLoanRequests$.pipe(
        take(1),
        switchMap((applyLoanRequests) =>
          this._httpClient.post<ApplyLoanRequestModel>(url, tempApplyLoanRequest).pipe(
            map((updatedApplyLoanRequest) => {
              // Find the index of the deleted applyLoanRequest
              const index = applyLoanRequests.findIndex((item) => item.productId === id);

              // Delete the applyLoanRequest
              applyLoanRequests.splice(index, 1);

              // Update the applyLoanRequests
              this._applyLoanRequests.next(applyLoanRequests);

              // Return the updated applyLoanRequest
              return (updatedApplyLoanRequest as any);
            }),
          )
        )
      );
  }

  /**
   * Delete the applyLoanRequest
   *
   * @param id
   */
  deleteApplyLoanRequest(id: string): Observable<boolean> {
    const url = id.toString() === '-1' ? 'api/apps/applyLoanRequest/inventory/applyLoanRequest' : `${environment.baseURL}/api/pick-drop/${id}`;
    console.log('url: ', url);
    return this.applyLoanRequests$.pipe(
      take(1),
      switchMap((applyLoanRequests) =>
        this._httpClient.delete(url, { params: { id } }).pipe(
          map((isDeleted: boolean) => {
            // Find the index of the deleted applyLoanRequest
            const index = applyLoanRequests.findIndex((item) => item.productId === id);

            // Delete the applyLoanRequest
            applyLoanRequests.splice(index, 1);

            // Update the applyLoanRequests
            this._applyLoanRequests.next(applyLoanRequests);

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
                    const index = contacts.findIndex(item => item.productId === id);

                    // Update the contact
                    contacts[index] = updatedContact;

                    // Update the contacts
                    this._contacts.next(contacts);

                    // Return the updated contact
                    return updatedContact;
                }),
                switchMap(updatedContact => this.contact$.pipe(
                    take(1),
                    filter(item => item && item.productId === id),
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
