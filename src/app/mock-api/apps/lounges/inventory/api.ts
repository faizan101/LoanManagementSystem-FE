/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { assign, cloneDeep } from 'lodash-es';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import {
  brands as brandsData,
  categories as categoriesData,
  lounges as loungesData,
  tags as tagsData,
  vendors as vendorsData
} from 'app/mock-api/apps/lounges/inventory/data';

@Injectable({
  providedIn: 'root'
})
export class LoungesInventoryMockApi {
  private _categories: any[] = categoriesData;
  private _brands: any[] = brandsData;
  private _lounges: any[] = loungesData;
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
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/categories').reply(() => [200, cloneDeep(this._categories)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Brands - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/brands').reply(() => [200, cloneDeep(this._brands)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Lounges - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/lounge', 300).reply(({ request }) => {
      // Get available queries
      const search = request.params.get('search');
      const sort = request.params.get('sort') || 'name';
      const order = request.params.get('order') || 'asc';
      const page = parseInt(request.params.get('page') ?? '1', 10);
      const size = parseInt(request.params.get('size') ?? '10', 10);

      // Clone the lounges
      let lounges: any[] | null = cloneDeep(this._lounges);

      // Sort the lounges
      if (sort === 'sku' || sort === 'name' || sort === 'active') {
        lounges.sort((a, b) => {
          const fieldA = a[sort].toString().toUpperCase();
          const fieldB = b[sort].toString().toUpperCase();
          return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        });
      } else {
        lounges.sort((a, b) => (order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]));
      }

      // If search exists...
      if (search) {
        // Filter the lounges
        lounges = lounges.filter((contact) => contact.name && contact.name.toLowerCase().includes(search.toLowerCase()));
      }

      // Paginate - Start
      const loungesLength = lounges.length;

      // Calculate pagination details
      const begin = page * size;
      const end = Math.min(size * (page + 1), loungesLength);
      const lastPage = Math.max(Math.ceil(loungesLength / size), 1);

      // Prepare the pagination object
      let pagination = {};

      // If the requested page number is bigger than
      // the last possible page number, return null for
      // lounges but also send the last possible page so
      // the app can navigate to there
      if (page > lastPage) {
        lounges = null;
        pagination = {
          lastPage
        };
      } else {
        // Paginate the results by size
        lounges = lounges.slice(begin, end);

        // Prepare the pagination mock-api
        pagination = {
          length: loungesLength,
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
          lounges,
          pagination
        }
      ];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Lounge - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/lounge').reply(({ request }) => {
      // Get the id from the params
      const id = request.params.get('id');

      // Clone the lounges
      const lounges = cloneDeep(this._lounges);

      // Find the lounge
      const lounge = lounges.find((item) => item.id === id);

      // Return the response
      return [200, lounge];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Lounge - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/lounge/inventory/lounge').reply(() => {
      // Generate a new lounge

      const newLounge = {
        _id: -1,
        name: 'A New Lounge',
        description: '',
        country: '',
        city: '',
        isActive: false,
        priority: 0,
        picture: '2aab1204-e8f7-4da8-9813-23d35def9e70-25b61fa1dfeff4cf7c1691614ed9b38e.jpeg'
      };

      // Unshift the new lounge
      this._lounges.unshift(newLounge);

      // Return the response
      return [200, newLounge];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Lounge - PATCH
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPatch('api/apps/lounge/inventory/lounge').reply(({ request }) => {
      // Get the id and lounge
      const id = request.body.id;
      const lounge = cloneDeep(request.body.lounge);

      // Prepare the updated lounge
      let updatedLounge = null;

      // Find the lounge and update it
      this._lounges.forEach((item, index, lounges) => {
        if (item.id === id) {
          // Update the lounge
          lounges[index] = assign({}, lounges[index], lounge);

          // Store the updated lounge
          updatedLounge = lounges[index];
        }
      });

      // Return the response
      return [200, updatedLounge];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Lounge - DELETE
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onDelete('api/apps/lounge/inventory/lounge').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the lounge and delete it
      this._lounges.forEach((item, index) => {
        if (item.id === id) {
          this._lounges.splice(index, 1);
        }
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/tags').reply(() => [200, cloneDeep(this._tags)]);

    // -----------------------------------------------------------------------------------------------------
    // @ Tags - POST
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onPost('api/apps/lounge/inventory/tag').reply(({ request }) => {
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
    this._fuseMockApiService.onPatch('api/apps/lounge/inventory/tag').reply(({ request }) => {
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
    this._fuseMockApiService.onDelete('api/apps/lounge/inventory/tag').reply(({ request }) => {
      // Get the id
      const id = request.params.get('id');

      // Find the tag and delete it
      this._tags.forEach((item, index) => {
        if (item.id === id) {
          this._tags.splice(index, 1);
        }
      });

      // Get the lounges that have the tag
      const loungesWithTag = this._lounges.filter((lounge) => lounge.tags.indexOf(id) > -1);

      // Iterate through them and delete the tag
      loungesWithTag.forEach((lounge) => {
        lounge.tags.splice(lounge.tags.indexOf(id), 1);
      });

      // Return the response
      return [200, true];
    });

    // -----------------------------------------------------------------------------------------------------
    // @ Vendors - GET
    // -----------------------------------------------------------------------------------------------------
    this._fuseMockApiService.onGet('api/apps/lounge/inventory/vendors').reply(() => [200, cloneDeep(this._vendors)]);
  }
}
