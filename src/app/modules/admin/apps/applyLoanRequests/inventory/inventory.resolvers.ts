import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { InventoryService } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.service';
import { ApplyLoanRequestsPagination, ApplyLoanRequestModel } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.types';
@Injectable({
    providedIn: 'root'
})
export class InventoryApplyLoanRequestResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _inventoryService: InventoryService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ApplyLoanRequestModel>
    {
        return this._inventoryService.getApplyLoanRequestById(route.paramMap.get('id'))
                   .pipe(
                       // Error here means the requested applyLoanRequest is not available
                       catchError((error) => {

                           // Log the error
                           console.error(error);

                           // Get the parent url
                           const parentUrl = state.url.split('/').slice(0, -1).join('/');

                           // Navigate to there
                           this._router.navigateByUrl(parentUrl);

                           // Throw an error
                           return throwError(error);
                       })
                   );
    }
}

@Injectable({
    providedIn: 'root'
})
export class InventoryApplyLoanRequestsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ApplyLoanRequestsPagination; applyLoanRequests: ApplyLoanRequestModel[] }>
    {
        return this._inventoryService.getApplyLoanRequests();
    }
}

