import { Route } from '@angular/router';
import { InventoryComponent } from 'app/modules/admin/apps/loanRequests/inventory/inventory.component';
import { InventoryListComponent } from 'app/modules/admin/apps/loanRequests/inventory/list/inventory.component';
import { InventoryLoanRequestsResolver } from 'app/modules/admin/apps/loanRequests/inventory/inventory.resolvers';

export const loanRequestsRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'loanRequests'
  },
  {
    path: '',
    component: InventoryComponent,
    children: [
      {
        path: '',
        component: InventoryListComponent,
        resolve: {
          loanRequests: InventoryLoanRequestsResolver
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
