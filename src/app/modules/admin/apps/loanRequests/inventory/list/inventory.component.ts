import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, map, merge, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { LoanRequestsPagination, LoanRequestModel } from 'app/modules/admin/apps/loanRequests/inventory/inventory.types';
import { InventoryService } from 'app/modules/admin/apps/loanRequests/inventory/inventory.service';
import { FuseMockApiUtils } from '@fuse/lib/mock-api';
import { environment } from 'environments/environment';

@Component({
  selector: 'inventory-list',
  templateUrl: './inventory.component.html',
  styles: [
    /* language=SCSS */
    `
      .inventory-grid {
        grid-template-columns: auto auto auto;

        @screen sm {
          grid-template-columns: 48px auto 112px 72px;
        }

        @screen md {
          grid-template-columns: 10% 10% 10% 10% 10% 10% 10% 10% 10% 5%;
        }

        @screen lg {
          grid-template-columns: 16% 10% 10% 10% 10% 5% 5% 5% 15% 5%;
        }
      }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;

  loanRequests$: Observable<LoanRequestModel[]>;

  flashMessage: 'success' | 'error' | null = null;
  isLoading: boolean = false;
  pagination: LoanRequestsPagination;
  searchInputControl: FormControl = new FormControl();
  selectedLoanRequest: LoanRequestModel | null = null;
  selectedLoanRequestForm: FormGroup;
  tagsEditMode: boolean = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  baseURL: string;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  statusList: string[];

  /**
   * Constructor
   */
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseConfirmationService: FuseConfirmationService,
    private _formBuilder: FormBuilder,
    private _inventoryService: InventoryService
  ) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the selected loanRequest form
    this.selectedLoanRequestForm = this._formBuilder.group({
      id: [''],
      status: [''],
      fee: [''],
      amount: [''],
      dueDate: [''],
      createdDate: [''],
      paymentDTO: this._formBuilder.group({
        transactionId: [''],
        transactionAmount: [''],
        transactionStatus: [''],
        createdDate: ['']
      }),
      loanProductDTO: this._formBuilder.group({
        serviceName: [''],
        serviceDescription: [''],
        duration: [''],
        interestRate: [''],
        gracePeriod: ['']
      }),
      userProfileDTO: this._formBuilder.group({
        firstName: [''],
        lastName: [''],
        email: [''],
        phone: [''],
        taxID: [''],
        creditRating: ['']
      }),
    });
    this.statusList = ['Completed', 'Rejected', 'InProgress'];
    this.baseURL = `${environment.baseURL}/api/picture/download/`;

    // Get the pagination
    this._inventoryService.pagination$.pipe(takeUntil(this._unsubscribeAll)).subscribe((pagination: LoanRequestsPagination) => {
      // Update the pagination
      this.pagination = pagination;

      // Mark for check
      this._changeDetectorRef.markForCheck();
    });

    // Get the loanRequests
    this.loanRequests$ = this._inventoryService.loanRequests$;

    console.log("We are here");
    console.log(this.loanRequests$);

    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(300),
        switchMap((query) => {
          this.closeDetails();
          this.isLoading = true;
          return this._inventoryService.getLoanRequests(0, 10, 'name', 'asc', query);
        }),
        map(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * After view init
   */
  ngAfterViewInit(): void {
    if (this._sort && this._paginator) {
      // Set the initial sort
      this._sort.sort({
        id: 'name',
        start: 'asc',
        disableClear: true
      });

      // Mark for check
      this._changeDetectorRef.markForCheck();

      // If the user changes the sort order...
      this._sort.sortChange.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
        // Reset back to the first page
        this._paginator.pageIndex = 0;

        // Close the details
        this.closeDetails();
      });

      // Get loanRequests if sort or page changes
      merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          switchMap(() => {
            this.closeDetails();
            this.isLoading = true;
            return this._inventoryService.getLoanRequests(
              this._paginator.pageIndex,
              this._paginator.pageSize,
              this._sort.active,
              this._sort.direction
            );
          }),
          map(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle loanRequest details
   *
   * @param loanRequestId
   */
  toggleDetails(loanRequestId: string): void {

    // If the loanRequest is already selected...
    if (this.selectedLoanRequest && this.selectedLoanRequest.id === loanRequestId) {
      // Close the details
      this.closeDetails();
      return;
    }

    // Get the loanRequest by id
    this._inventoryService.getLoanRequestById(loanRequestId).subscribe((loanRequest) => {
      // Set the selected loanRequest
      this.selectedLoanRequest = loanRequest;

      // Fill the form
      this.selectedLoanRequestForm.patchValue(loanRequest);

      // Mark for check
      this._changeDetectorRef.markForCheck();
    });

  }

  /**
   * Close the details
   */
  closeDetails(): void {
    this.selectedLoanRequest = null;
  }

  /**
   * Cycle through images of selected loanRequest
   */
  cycleImages(forward: boolean = true): void {
    // Get the image count and current image index
    const count = this.selectedLoanRequestForm.get('images').value.length;
    const currentIndex = this.selectedLoanRequestForm.get('currentImageIndex').value;

    // Calculate the next and previous index
    const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
    const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

    // If cycling forward...
    if (forward) {
      this.selectedLoanRequestForm.get('currentImageIndex').setValue(nextIndex);
    }
    // If cycling backwards...
    else {
      this.selectedLoanRequestForm.get('currentImageIndex').setValue(prevIndex);
    }
  }

  /**
   * Toggle the tags edit mode
   */
  toggleTagsEditMode(): void {
    this.tagsEditMode = !this.tagsEditMode;
  }

  /**
   * Create loanRequest
   */
  createLoanRequest(): void {
    // // Create the loanRequest
    this._inventoryService.createLoanRequest().subscribe((tempLoanRequest) => {
      //     // Go to new loanRequest
      this.selectedLoanRequest = tempLoanRequest;

      //     // Fill the form
      this.selectedLoanRequestForm.patchValue(tempLoanRequest);

      //     // Mark for check
      this._changeDetectorRef.markForCheck();
    });
  }

  /**
   * Update the selected loanRequest using the form data
   */
  // updateSelectedLoanRequest(loanStatus: string): void {
  //   if (!this.selectedLoanRequestForm.valid) {
  //     this.showFlashMessage('error');
  //     // this.closeDetails();
  //     return;
  //   }
  //   // Get the loanRequest object
  //   const loanRequest = this.selectedLoanRequestForm.getRawValue();

  //   // Remove the currentImageIndex field
  //   delete loanRequest.currentImageIndex;

  //   loanRequest.status = loanStatus;

  //   // Update the loanRequest on the server
  //   this._inventoryService.updateLoanRequest(loanRequest.id, loanRequest).subscribe(() => {
  //     // Show a success message
  //     this.showFlashMessage('success');
  //     this.closeDetails();
  //   });
  // }


  updateSelectedLoanRequest(loanStatus: string): void {
    if (!this.selectedLoanRequestForm.valid) {
      this.showFlashMessage('error');
      // this.closeDetails();
      return;
    }


    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: 'Cancel Loan Request',
      message: 'Are you sure you want to cancel this loan Request? This action cannot be undone!',
      actions: {
        confirm: {
          label: 'Confirm'
        }
      }
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
      // If the confirm button pressed...
      console.log(result);
      if (result === 'confirmed') {

          // Get the loanRequest object
          const loanRequest = this.selectedLoanRequestForm.getRawValue();

          // Remove the currentImageIndex field

          let loanReq = {
            id: loanRequest.id,
            status: loanStatus
          }

          // Update the loanRequest on the server
          this._inventoryService.updateLoanRequest(loanRequest.id, loanReq).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
            this.closeDetails();
          });
      }
    });
  }

  /**
   * Delete the selected loanRequest using the form data
   */
  deleteSelectedLoanRequest(): void {
    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: 'Delete loanRequest',
      message: 'Are you sure you want to remove this loanRequest? This action cannot be undone!',
      actions: {
        confirm: {
          label: 'Delete'
        }
      }
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
      // If the confirm button pressed...
      if (result === 'confirmed') {
        // Get the loanRequest object
        const loanRequest = this.selectedLoanRequestForm.getRawValue();

        // Delete the loanRequest on the server
        this._inventoryService.deleteLoanRequest(loanRequest._id).subscribe(() => {
          // Close the details
          this.closeDetails();
        });
      }
    });
  }

  /**
   * Show flash message
   */
  showFlashMessage(type: 'success' | 'error'): void {
    // Show the message
    this.flashMessage = type;

    // Mark for check
    this._changeDetectorRef.markForCheck();

    // Hide it after 3 seconds
    setTimeout(() => {
      this.flashMessage = null;

      // Mark for check
      this._changeDetectorRef.markForCheck();
    }, 3000);
  }

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any {
    return item._id || index;
  }

  getRole(): any{
    const user = localStorage.getItem('user');
    let userType = '';
    if (user) {
      const userObj = JSON.parse(user);
      userType = userObj.role;
    }
    return userType;
  }
}
