/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { assign, cloneDeep } from 'lodash-es';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import {
  brands as brandsData,
  categories as categoriesData,
  pickAndDropRequests as pickAndDropRequestsData,
  tags as tagsData,
  vendors as vendorsData
} from 'app/mock-api/apps/pickAndDropRequests/inventory/data';

@Injectable({
  providedIn: 'root'
})
export class PickAndDropRequestsInventoryMockApi {
  private _categories: any[] = categoriesData;
  private _brands: any[] = brandsData;
  private _pickAndDropRequests: any[] = pickAndDropRequestsData;
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
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/categories').reply(() => [200, cloneDeep(this._categories)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Brands - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/brands').reply(() => [200, cloneDeep(this._brands)]);

    // -----------------------------------------------------------------------------------------------------
    // @ PickAndDropRequests - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/pickAndDropRequest', 300).reply(({ request }) => {
      // Get available queries
      const search = request.params.get('search');
      const sort = request.params.get('sort') || 'name';
      const order = request.params.get('order') || 'asc';
      const page = parseInt(request.params.get('page') ?? '1', 10);
      const size = parseInt(request.params.get('size') ?? '10', 10);

      // Clone the pickAndDropRequests
      let pickAndDropRequests: any[] | null = cloneDeep(this._pickAndDropRequests);

      // Sort the pickAndDropRequests
      if (sort === 'sku' || sort === 'name' || sort === 'active') {
        pickAndDropRequests.sort((a, b) => {
          const fieldA = a[sort].toString().toUpperCase();
          const fieldB = b[sort].toString().toUpperCase();
          return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        });
      } else {
        pickAndDropRequests.sort((a, b) => (order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]));
      }

      // If search exists...
      if (search) {
        // Filter the pickAndDropRequests
        pickAndDropRequests = pickAndDropRequests.filter((contact) => contact.name && contact.name.toLowerCase().includes(search.toLowerCase()));
      }

      // Paginate - Start
      const pickAndDropRequestsLength = pickAndDropRequests.length;

      // Calculate pagination details
      const begin = page * size;
      const end = Math.min(size * (page + 1), pickAndDropRequestsLength);
      const lastPage = Math.max(Math.ceil(pickAndDropRequestsLength / size), 1);

      // Prepare the pagination object
      let pagination = {};

      // If the requested page number is bigger than
      // the last possible page number, return null for
      // pickAndDropRequests but also send the last possible page so
      // the app can navigate to there
      if (page > lastPage) {
        pickAndDropRequests = null;
        pagination = {
          lastPage
        };
      } else {
        // Paginate the results by size
        pickAndDropRequests = pickAndDropRequests.slice(begin, end);

        // Prepare the pagination mock-api
        pagination = {
          length: pickAndDropRequestsLength,
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
          pickAndDropRequests,
          pagination
        }
      ];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ PickAndDropRequest - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/pickAndDropRequest').reply(({ request }) => {
      // Get the id from the params
      const id = request.params.get('id');

      // Clone the pickAndDropRequests
      const pickAndDropRequests = cloneDeep(this._pickAndDropRequests);

      // Find the pickAndDropRequest
      const pickAndDropRequest = pickAndDropRequests.find((item) => item.id === id);

      // Return the response
      return [200, pickAndDropRequest];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ PickAndDropRequest - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/pickAndDropRequest/inventory/pickAndDropRequest').reply(() => {
      // Generate a new pickAndDropRequest

      const newPickAndDropRequest = {
        _id: -1,
        name: 'A New PickAndDropRequest',
        description: '',
        country: '',
        city: '',
        isActive: false,
        priority: 0,
        picture: '2aab1204-e8f7-4da8-9813-23d35def9e70-25b61fa1dfeff4cf7c1691614ed9b38e.jpeg'
      };

      // Unshift the new pickAndDropRequest
      this._pickAndDropRequests.unshift(newPickAndDropRequest);

      // Return the response
      return [200, newPickAndDropRequest];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ PickAndDropRequest - PATCH
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPatch('api/apps/pickAndDropRequest/inventory/pickAndDropRequest').reply(({ request }) => {
      // Get the id and pickAndDropRequest
      const id = request.body.id;
      const pickAndDropRequest = cloneDeep(request.body.pickAndDropRequest);

      // Prepare the updated pickAndDropRequest
      let updatedPickAndDropRequest = null;

      // Find the pickAndDropRequest and update it
      this._pickAndDropRequests.forEach((item, index, pickAndDropRequests) => {
        if (item.id === id) {
          // Update the pickAndDropRequest
          pickAndDropRequests[index] = assign({}, pickAndDropRequests[index], pickAndDropRequest);

          // Store the updated pickAndDropRequest
          updatedPickAndDropRequest = pickAndDropRequests[index];
        }
      });

      // Return the response
      return [200, updatedPickAndDropRequest];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ PickAndDropRequest - DELETE
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onDelete('api/apps/pickAndDropRequest/inventory/pickAndDropRequest').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the pickAndDropRequest and delete it
      this._pickAndDropRequests.forEach((item, index) => {
        if (item.id === id) {
          this._pickAndDropRequests.splice(index, 1);
        }
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/tags').reply(() => [200, cloneDeep(this._tags)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/pickAndDropRequest/inventory/tag').reply(({ request }) => {
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
    this._fuseMockApiService.onPatch('api/apps/pickAndDropRequest/inventory/tag').reply(({ request }) => {
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
    this._fuseMockApiService.onDelete('api/apps/pickAndDropRequest/inventory/tag').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the tag and delete it
      this._tags.forEach((item, index) => {
        if (item.id === id) {
          this._tags.splice(index, 1);
        }
      });

      // Get the pickAndDropRequests that have the tag
      const pickAndDropRequestsWithTag = this._pickAndDropRequests.filter((pickAndDropRequest) => pickAndDropRequest.tags.indexOf(id) > -1);

      // Iterate through them and delete the tag
      pickAndDropRequestsWithTag.forEach((pickAndDropRequest) => {
        pickAndDropRequest.tags.splice(pickAndDropRequest.tags.indexOf(id), 1);
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Vendors - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/pickAndDropRequest/inventory/vendors').reply(() => [200, cloneDeep(this._vendors)]);
  }
}
