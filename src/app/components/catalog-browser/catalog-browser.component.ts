import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Catalog } from '../../models/catalog';
import { CatalogService } from '../../services/catalog/catalog.service';
import { ProxyService } from '../../services/proxy/proxy.service';

@Component({
    selector: 'app-catalog-browser',
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatInputModule,
        MatToolbarModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        NgxSkeletonLoaderModule,
        MatTooltipModule,
    ],
    providers: [CatalogService],
    templateUrl: './catalog-browser.component.html',
    styleUrls: ['./catalog-browser.component.css']
})
export class CatalogBrowserComponent implements OnInit {
  loading: boolean = false;

  catalogData: Catalog[] = [];
  searchControl = new FormControl('');
  urlControl = new FormControl('');

  filteredCatalogsData: Catalog[] = [];

  constructor(private router: Router, private proxyService: ProxyService) {}

  /**
   * Initializes the component by fetching all catalogs from the server.
   * Subscribes to the search control value changes to filter the catalogs.
   * */
  ngOnInit(): void {
    // this.loading = true;
    // this.catalogService.getCatalog().subscribe({
    //   next: (data) => {
    //     console.log('Catalog data:', data);
    //     this.catalogData.push(data);
    //     this.filteredCatalogsData = this.catalogData;
    //     console.log(this.filteredCatalogsData);
    //     this.loading = false;
    //   },
    //   error: (error) => {
    //     console.error('Error fetching catalogs:', error);
    //     this.loading = false;
    //   },
    // });
    // this.searchControl.valueChanges.subscribe((searchTerm) => {
    //   this.filteredCatalogsData = this.catalogData.filter((catalog) =>
    //     catalog.title.toLowerCase().includes(searchTerm!.toLowerCase())
    //   );
    // });
  }

  /**
   * Navigates to the catalog details page.
   * Passes the selected catalog as state to the details page.
   */
  navigateToCatalogDetails(catalog: Catalog) {
    this.router.navigate(['/catalog-browser/details'], {
      state: { catalog: catalog },
    });
  }

  onFetch() {
    console.log('Fetching catalog');
    const url = this.urlControl.value;
    if (!url) {
      return;
    } else {
      this.proxyService.getRemoteCatalog(url!).subscribe({
        next: (data) => {
          console.log('Catalog data fetched');

          this.catalogData.push(data);
          this.filteredCatalogsData = this.catalogData;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        },
      });
    }
  }
}
