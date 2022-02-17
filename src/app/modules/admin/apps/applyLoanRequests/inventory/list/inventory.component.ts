import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, map, merge, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApplyLoanRequestsPagination, ApplyLoanRequestModel } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.types';
import { InventoryService } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.service';
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
          grid-template-columns: 14% 14% 14% 14% 14% 14% 14%;
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

  applyLoanRequests$: Observable<ApplyLoanRequestModel[]>;

  flashMessage: 'success' | 'error' | null = null;
  isLoading: boolean = false;
  pagination: ApplyLoanRequestsPagination;
  searchInputControl: FormControl = new FormControl();
  selectedApplyLoanRequest: ApplyLoanRequestModel | null = null;
  selectedApplyLoanRequestForm: FormGroup;
  tagsEditMode: boolean = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  baseURL: string;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  statusList: string[];

  loanAmountValidator: ValidatorFn = (fg: FormGroup) => {
    const maxAmount = fg.get('maxAmount').value;
    const amount = fg.get('amount').value;

    return amount <= maxAmount ? null : { range: true };
  };

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
    // Create the selected applyLoanRequest form
    this.selectedApplyLoanRequestForm = this._formBuilder.group({
      productId: [''],
      serviceName: [''],
      serviceDescription: [''],
      duration: [''],
      interestRate: [''],
      gracePeriod: [''],
      catId: [''],
      maxAmount: [''],
      amount:[0, [Validators.min(1)]]
    }, {validators: this.loanAmountValidator});


    this.statusList = ['Completed', 'Rejected', 'InProgress'];
    this.baseURL = `${environment.baseURL}/api/picture/download/`;

    // Get the pagination
    this._inventoryService.pagination$.pipe(takeUntil(this._unsubscribeAll)).subscribe((pagination: ApplyLoanRequestsPagination) => {
      // Update the pagination
      this.pagination = pagination;

      // Mark for check
      this._changeDetectorRef.markForCheck();
    });

    // Get the applyLoanRequests
    this.applyLoanRequests$ = this._inventoryService.applyLoanRequests$;

    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(300),
        switchMap((query) => {
          this.closeDetails();
          this.isLoading = true;
          return this._inventoryService.getApplyLoanRequests(0, 10, 'name', 'asc', query);
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

      // Get applyLoanRequests if sort or page changes
      merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          switchMap(() => {
            this.closeDetails();
            this.isLoading = true;
            return this._inventoryService.getApplyLoanRequests(
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
   * Toggle applyLoanRequest details
   *
   * @param applyLoanRequestId
   */
  toggleDetails(applyLoanRequestId: string): void {
    // If the applyLoanRequest is already selected...
    if (this.selectedApplyLoanRequest && this.selectedApplyLoanRequest.productId === applyLoanRequestId) {
      // Close the details
      this.closeDetails();
      return;
    }

    // Get the applyLoanRequest by id
    this._inventoryService.getApplyLoanRequestById(applyLoanRequestId).subscribe((applyLoanRequest) => {
      // Set the selected applyLoanRequest
      this.selectedApplyLoanRequest = applyLoanRequest;

      // Fill the form
      this.selectedApplyLoanRequestForm.patchValue(applyLoanRequest);

      // Mark for check
      this._changeDetectorRef.markForCheck();
    });
  }

  /**
   * Close the details
   */
  closeDetails(): void {
    this.selectedApplyLoanRequest = null;
  }

  /**
   * Cycle through images of selected applyLoanRequest
   */
  cycleImages(forward: boolean = true): void {
    // Get the image count and current image index
    const count = this.selectedApplyLoanRequestForm.get('images').value.length;
    const currentIndex = this.selectedApplyLoanRequestForm.get('currentImageIndex').value;

    // Calculate the next and previous index
    const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
    const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

    // If cycling forward...
    if (forward) {
      this.selectedApplyLoanRequestForm.get('currentImageIndex').setValue(nextIndex);
    }
    // If cycling backwards...
    else {
      this.selectedApplyLoanRequestForm.get('currentImageIndex').setValue(prevIndex);
    }
  }

  /**
   * Toggle the tags edit mode
   */
  toggleTagsEditMode(): void {
    this.tagsEditMode = !this.tagsEditMode;
  }

  /**
   * Create applyLoanRequest
   */
  createApplyLoanRequest(): void {
    // // Create the applyLoanRequest
    this._inventoryService.createApplyLoanRequest().subscribe((tempApplyLoanRequest) => {
      //     // Go to new applyLoanRequest
      this.selectedApplyLoanRequest = tempApplyLoanRequest;

      //     // Fill the form
      this.selectedApplyLoanRequestForm.patchValue(tempApplyLoanRequest);

      //     // Mark for check
      this._changeDetectorRef.markForCheck();
    });
  }

  /**
   * Update the selected applyLoanRequest using the form data
   */
  updateSelectedApplyLoanRequest(): void {
    if (!this.selectedApplyLoanRequestForm.valid) {
      this.showFlashMessage('error');
      // this.closeDetails();
      return;
    }

        // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: 'Apply Loan Request',
      message: 'Are you sure you want to apply for this Loan? This action cannot be undone!',
      actions: {
        confirm: {
          label: 'Apply'
        }
      }
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
      // If the confirm button pressed...
      if (result === 'confirmed') {
        // Get the applyLoanRequest object
        const applyLoanRequest = this.selectedApplyLoanRequestForm.getRawValue();

        let req = {
          amount: applyLoanRequest.amount,
          productId: applyLoanRequest.productId,
          catId: applyLoanRequest.catId
        }

        // Update the applyLoanRequest on the server
        this._inventoryService.updateApplyLoanRequest(applyLoanRequest.productId, req).subscribe(() => {
          // Show a success message
          this.showFlashMessage('success');
          this.closeDetails();
        });
      }
    });

  }

  /**
   * Delete the selected applyLoanRequest using the form data
   */
  deleteSelectedApplyLoanRequest(): void {
    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: 'Delete applyLoanRequest',
      message: 'Are you sure you want to remove this applyLoanRequest? This action cannot be undone!',
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
        // Get the applyLoanRequest object
        const applyLoanRequest = this.selectedApplyLoanRequestForm.getRawValue();

        // Delete the applyLoanRequest on the server
        this._inventoryService.deleteApplyLoanRequest(applyLoanRequest.productId).subscribe(() => {
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
}
