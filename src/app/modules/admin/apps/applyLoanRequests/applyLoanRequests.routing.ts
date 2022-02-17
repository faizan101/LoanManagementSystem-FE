import { Route } from '@angular/router';
import { InventoryComponent } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.component';
import { InventoryListComponent } from 'app/modules/admin/apps/applyLoanRequests/inventory/list/inventory.component';
import { InventoryApplyLoanRequestsResolver } from 'app/modules/admin/apps/applyLoanRequests/inventory/inventory.resolvers';

export const applyLoanRequestsRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'applyLoanRequests'
  },
  {
    path: '',
    component: InventoryComponent,
    children: [
      {
        path: '',
        component: InventoryListComponent,
        resolve: {
          applyLoanRequests: InventoryApplyLoanRequestsResolver
        }
      }
    ]
    /*children : [
            {
                path     : '',
                component: ContactsListComponent,
                resolve  : {
                    tasks    : ContactsResolver,
                    countries: ContactsCountriesResolver
                },
                children : [
                    {
                        path         : ':id',
                        component    : ContactsDetailsComponent,
                        resolve      : {
                            task     : ContactsContactResolver,
                            countries: ContactsCountriesResolver
                        },
                        canDeactivate: [CanDeactivateContactsDetails]
                    }
                ]
            }
        ]*/
  }
];
