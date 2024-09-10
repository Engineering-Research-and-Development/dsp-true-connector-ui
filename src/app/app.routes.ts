import { Routes } from '@angular/router';
import { CatalogBrowserDetailsComponent } from './components/catalog-browser/catalog-browser-details/catalog-browser-details.component';
import { CatalogBrowserComponent } from './components/catalog-browser/catalog-browser.component';
import { CatalogManagementComponent } from './components/catalog-management/catalog-management.component';
import { ContractNegotiationComponent } from './components/contract-negotiation/contract-negotiation.component';
import { DatasetDetailsComponent } from './components/dataset-management/dataset-details/dataset-details.component';
import { DatasetManagementComponent } from './components/dataset-management/dataset-management.component';
import { DistributionDetailsComponent } from './components/distribution-management/distribution-details/distribution-details.component';
import { DistributionManagementComponent } from './components/distribution-management/distribution-management.component';
import { PolicyDetailsComponent } from './components/policy-details/policy-details.component';
import { ServiceDetailsComponent } from './components/service-management/service-details/service-details.component';
import { ServiceManagementComponent } from './components/service-management/service-management.component';
import { UnderConstructionComponent } from './components/under-construction/under-construction.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog-browser',
  },
  {
    path: 'under-construction',
    component: UnderConstructionComponent,
    title: 'Under Construction',
  },
  {
    path: 'catalog-browser',
    component: CatalogBrowserComponent,
    title: 'Catalog Browser',
  },
  {
    path: 'catalog-browser/details',
    component: CatalogBrowserDetailsComponent,
    title: 'Catalog Details',
  },
  {
    path: 'catalog-management',
    component: CatalogManagementComponent,
    title: 'Manage Catalog data',
  },
  {
    path: 'catalog-management/service-management',
    component: ServiceManagementComponent,
    title: 'Manage Services',
  },

  {
    path: 'catalog-management/service-management/details',
    component: ServiceDetailsComponent,
    title: 'Service Details',
  },
  {
    path: 'catalog-management/dataset-management',
    component: DatasetManagementComponent,
    title: 'Manage Datasets',
  },

  {
    path: 'catalog-management/dataset-management/details',
    component: DatasetDetailsComponent,
    title: 'Dataset Details',
  },
  {
    path: 'catalog-management/distribution-management',
    component: DistributionManagementComponent,
    title: 'Manage Distributions',
  },
  {
    path: 'catalog-management/distribution-management/details',
    component: DistributionDetailsComponent,
    title: 'Distribution Details',
  },
  {
    path: 'catalog-management/policy-management/details',
    component: PolicyDetailsComponent,
    title: 'Policy Details',
  },
  {
    path: 'contract-negotiation',
    component: ContractNegotiationComponent,
    title: 'Contract Negotiation',
  },
];
