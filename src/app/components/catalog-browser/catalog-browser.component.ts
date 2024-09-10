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
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Catalog } from '../../models/catalog';
import { CatalogService } from '../../services/catalog/catalog.service';

@Component({
  selector: 'app-catalog-browser',
  standalone: true,
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
  ],
  providers: [CatalogService],
  templateUrl: './catalog-browser.component.html',
  styleUrls: ['./catalog-browser.component.css'],
})
export class CatalogBrowserComponent implements OnInit {
  loading: boolean = false;

  catalogData: Catalog[] = [];
  searchControl = new FormControl('');
  filteredCatalogsData: Catalog[] = [];

  constructor(private catalogService: CatalogService, private router: Router) {}

  /**
   * Initializes the component by fetching all catalogs from the server.
   * Subscribes to the search control value changes to filter the catalogs.
   * */
  ngOnInit(): void {
    this.loading = true;
    this.catalogService.getCatalog().subscribe({
      next: (data) => {
        console.log('Catalog data:', data);
        this.catalogData.push(data);
        this.filteredCatalogsData = this.catalogData;
        console.log(this.filteredCatalogsData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching catalogs:', error);
        this.loading = false;
      },
    });

    this.searchControl.valueChanges.subscribe((searchTerm) => {
      this.filteredCatalogsData = this.catalogData.filter((catalog) =>
        catalog.title.toLowerCase().includes(searchTerm!.toLowerCase())
      );
    });
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
}
