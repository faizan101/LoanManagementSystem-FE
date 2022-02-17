/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { assign, cloneDeep } from 'lodash-es';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import {
  brands as brandsData,
  categories as categoriesData,
  wifiDetails as wifiDetailsData,
  tags as tagsData,
  vendors as vendorsData
} from 'app/mock-api/apps/wifiDetails/inventory/data';

@Injectable({
  providedIn: 'root'
})
export class WifiDetailsInventoryMockApi {
  private _categories: any[] = categoriesData;
  private _brands: any[] = brandsData;
  private _wifiDetails: any[] = wifiDetailsData;
  private _tags: any[] = tagsData;
  private _vendors: any[] = vendorsData;

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
    // @ Categories - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/categories').reply(() => [200, cloneDeep(this._categories)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Brands - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/brands').reply(() => [200, cloneDeep(this._brands)]);

    // -----------------------------------------------------------------------------------------------------
    // @ wifiDetails - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/wifiDetail', 300).reply(({ request }) => {
      // Get available queries
      const search = request.params.get('search');
      const sort = request.params.get('sort') || 'name';
      const order = request.params.get('order') || 'asc';
      const page = parseInt(request.params.get('page') ?? '1', 10);
      const size = parseInt(request.params.get('size') ?? '10', 10);

      // Clone the wifiDetails
      let wifiDetails: any[] | null = cloneDeep(this._wifiDetails);

      // Sort the wifiDetails
      if (sort === 'sku' || sort === 'name' || sort === 'active') {
        wifiDetails.sort((a, b) => {
          const fieldA = a[sort].toString().toUpperCase();
          const fieldB = b[sort].toString().toUpperCase();
          return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        });
      } else {
        wifiDetails.sort((a, b) => (order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]));
      }

      // If search exists...
      if (search) {
        // Filter the wifiDetails
        wifiDetails = wifiDetails.filter((contact) => contact.name && contact.name.toLowerCase().includes(search.toLowerCase()));
      }

      // Paginate - Start
      const wifiDetailsLength = wifiDetails.length;

      // Calculate pagination details
      const begin = page * size;
      const end = Math.min(size * (page + 1), wifiDetailsLength);
      const lastPage = Math.max(Math.ceil(wifiDetailsLength / size), 1);

      // Prepare the pagination object
      let pagination = {};

      // If the requested page number is bigger than
      // the last possible page number, return null for
      // wifiDetails but also send the last possible page so
      // the app can navigate to there
      if (page > lastPage) {
        wifiDetails = null;
        pagination = {
          lastPage
        };
      } else {
        // Paginate the results by size
        wifiDetails = wifiDetails.slice(begin, end);

        // Prepare the pagination mock-api
        pagination = {
          length: wifiDetailsLength,
          size: size,
          page: page,
          lastPage: lastPage,
          startIndex: begin,
          endIndex: end - 1
        };
      }

      // Return the response
      return [
        200,
        {
          wifiDetails,
          pagination
        }
      ];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ wifiDetail - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/wifiDetail').reply(({ request }) => {
      // Get the id from the params
      const id = request.params.get('id');

      // Clone the wifiDetails
      const wifiDetails = cloneDeep(this._wifiDetails);

      // Find the wifiDetail
      const wifiDetail = wifiDetails.find((item) => item.id === id);

      // Return the response
      return [200, wifiDetail];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ wifiDetail - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/wifiDetails/inventory/wifiDetail').reply(() => {
      // Generate a new wifiDetail

      const newWifiDetail = {
        _id: -1,
        username: 'A New wifiDetail',
        password: '',
        lounge: '',
        isActive: false,
        priority: 0,
      };

      // Unshift the new wifiDetail
      this._wifiDetails.unshift(newWifiDetail);

      // Return the response
      return [200, newWifiDetail];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ wifiDetail - PATCH
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPatch('api/apps/wifiDetails/inventory/wifiDetail').reply(({ request }) => {
      // Get the id and wifiDetail
      const id = request.body.id;
      const wifiDetail = cloneDeep(request.body.wifiDetail);

      // Prepare the updated wifiDetail
      let updatedWifiDetail = null;

      // Find the wifiDetail and update it
      this._wifiDetails.forEach((item, index, wifiDetails) => {
        if (item.id === id) {
          // Update the wifiDetail
          wifiDetails[index] = assign({}, wifiDetails[index], wifiDetail);

          // Store the updated wifiDetail
          updatedWifiDetail = wifiDetails[index];
        }
      });

      // Return the response
      return [200, updatedWifiDetail];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ wifiDetail - DELETE
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onDelete('api/apps/wifiDetails/inventory/wifiDetail').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the wifiDetail and delete it
      this._wifiDetails.forEach((item, index) => {
        if (item.id === id) {
          this._wifiDetails.splice(index, 1);
        }
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/tags').reply(() => [200, cloneDeep(this._tags)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/wifiDetails/inventory/tag').reply(({ request }) => {
      // Get the tag
      const newTag = cloneDeep(request.body.tag);

      // Generate a new GUID
      newTag.id = FuseMockApiUtils.guid();

      // Unshift the new tag
      this._tags.unshift(newTag);

      // Return the response
      return [200, newTag];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - PATCH
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPatch('api/apps/wifiDetails/inventory/tag').reply(({ request }) => {
      // Get the id and tag
      const id = request.body.id;
      const tag = cloneDeep(request.body.tag);

      // Prepare the updated tag
      let updatedTag = null;

      // Find the tag and update it
      this._tags.forEach((item, index, tags) => {
        if (item.id === id) {
          // Update the tag
          tags[index] = assign({}, tags[index], tag);

          // Store the updated tag
          updatedTag = tags[index];
        }
      });

      // Return the response
      return [200, updatedTag];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Tag - DELETE
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onDelete('api/apps/wifiDetails/inventory/tag').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the tag and delete it
      this._tags.forEach((item, index) => {
        if (item.id === id) {
          this._tags.splice(index, 1);
        }
      });

      // Get the wifiDetails that have the tag
      const wifiDetailsWithTag = this._wifiDetails.filter((wifiDetail) => wifiDetail.tags.indexOf(id) > -1);

      // Iterate through them and delete the tag
      wifiDetailsWithTag.forEach((wifiDetail) => {
        wifiDetail.tags.splice(wifiDetail.tags.indexOf(id), 1);
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Vendors - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/wifiDetails/inventory/vendors').reply(() => [200, cloneDeep(this._vendors)]);
  }
}
