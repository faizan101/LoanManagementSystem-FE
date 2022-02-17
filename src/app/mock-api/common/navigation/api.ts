import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import {
  compactNavigation,
  defaultNavigation,
  futuristicNavigation,
  horizontalNavigation,
  vendorNavigation
} from 'app/mock-api/common/navigation/data';

@Injectable({
  providedIn: 'root'
})
export class NavigationMockApi {
  private readonly _compactNavigation: FuseNavigationItem[] = compactNavigation;
  private readonly _defaultNavigation: FuseNavigationItem[] = defaultNavigation;
  private readonly _futuristicNavigation: FuseNavigationItem[] = futuristicNavigation;
  private readonly _horizontalNavigation: FuseNavigationItem[] = horizontalNavigation;
  private readonly _vendorNavigation: FuseNavigationItem[] = vendorNavigation;

  /**
   * Constructor
   */
  constructor(private _fuseMockApiService: FuseMockApiService) {
    // Register Mock API handlers
    this.registerHandlers();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Register Mock API handlers
   */
  registerHandlers(): void {
    // -----------------------------------------------------------------------------------------------------
    // @ Navigation - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/common/navigation').reply(({ request }) => {
      // Fill compact navigation children using the default navigation
      const userType = request.params.get('userType');

      this._compactNavigation.forEach((compactNavItem) => {
        this._defaultNavigation.forEach((defaultNavItem) => {
          if (defaultNavItem.id === compactNavItem.id) {
            compactNavItem.children = cloneDeep(defaultNavItem.children);
          }
        });
      });

      // Fill futuristic navigation children using the default navigation
      this._futuristicNavigation.forEach((futuristicNavItem) => {
        this._defaultNavigation.forEach((defaultNavItem) => {
          if (defaultNavItem.id === futuristicNavItem.id) {
            futuristicNavItem.children = cloneDeep(defaultNavItem.children);
          }
        });
      });

      // Fill horizontal navigation children using the default navigation
      this._horizontalNavigation.forEach((horizontalNavItem) => {
        this._defaultNavigation.forEach((defaultNavItem) => {
          if (defaultNavItem.id === horizontalNavItem.id) {
            horizontalNavItem.children = cloneDeep(defaultNavItem.children);
          }
        });
      });

      let tempDefaultNavItem = this._defaultNavigation;

      if (userType === 'ROLE_USER') {
        // eslint-disable-next-line arrow-parens
        //tempDefaultNavItem = tempDefaultNavItem.filter((res) => res.id === 'pickAndDropRequests');
        tempDefaultNavItem = this._vendorNavigation;
      }

      // Return the response
      return [
        200,
        {
          compact: cloneDeep(this._compactNavigation),
          default: cloneDeep(tempDefaultNavItem),
          futuristic: cloneDeep(this._futuristicNavigation),
          horizontal: cloneDeep(this._horizontalNavigation)
        }
      ];
    });
  }
}
