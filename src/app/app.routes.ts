import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog-browser',
  },
  {
    path: 'under-construction',
    loadComponent: () =>
      import(
        './components/under-construction/under-construction.component'
      ).then((m) => m.UnderConstructionComponent),
    title: 'Under Construction',
  },
  {
    path: 'catalog-browser',
    loadComponent: () =>
      import('./components/catalog-browser/catalog-browser.component').then(
        (m) => m.CatalogBrowserComponent
      ),
    title: 'Catalog Browser',
  },
  {
    path: 'catalog-browser/details',
    loadComponent: () =>
      import(
        './components/catalog-browser/catalog-browser-details/catalog-browser-details.component'
      ).then((m) => m.CatalogBrowserDetailsComponent),
    title: 'Catalog Details',
  },
  {
    path: 'catalog-management',
    loadComponent: () =>
      import(
        './components/catalog-management/catalog-management.component'
      ).then((m) => m.CatalogManagementComponent),
    title: 'Manage Catalog data',
  },
  {
    path: 'catalog-management/service-management',
    loadComponent: () =>
      import(
        './components/service-management/service-management.component'
      ).then((m) => m.ServiceManagementComponent),
    title: 'Manage Services',
  },

  {
    path: 'catalog-management/service-management/details',
    loadComponent: () =>
      import(
        './components/service-management/service-details/service-details.component'
      ).then((m) => m.ServiceDetailsComponent),
    title: 'Service Details',
  },
  {
    path: 'catalog-management/dataset-management',
    loadComponent: () =>
      import(
        './components/dataset-management/dataset-management.component'
      ).then((m) => m.DatasetManagementComponent),
    title: 'Manage Datasets',
  },

  {
    path: 'catalog-management/dataset-management/details',
    loadComponent: () =>
      import(
        './components/dataset-management/dataset-details/dataset-details.component'
      ).then((m) => m.DatasetDetailsComponent),
    title: 'Dataset Details',
  },
  {
    path: 'catalog-management/distribution-management',
    loadComponent: () =>
      import(
        './components/distribution-management/distribution-management.component'
      ).then((m) => m.DistributionManagementComponent),
    title: 'Manage Distributions',
  },
  {
    path: 'catalog-management/distribution-management/details',
    loadComponent: () =>
      import(
        './components/distribution-management/distribution-details/distribution-details.component'
      ).then((m) => m.DistributionDetailsComponent),
    title: 'Distribution Details',
  },
  {
    path: 'catalog-management/policy-management/details',
    loadComponent: () =>
      import('./components/policy-details/policy-details.component').then(
        (m) => m.PolicyDetailsComponent
      ),
    title: 'Policy Details',
  },
  {
    path: 'contract-negotiation',
    loadComponent: () =>
      import(
        './components/contract-negotiation/contract-negotiation.component'
      ).then((m) => m.ContractNegotiationComponent),
    title: 'Contract Negotiation',
  },
  {
    path: 'data-transfer',
    loadComponent: () =>
      import('./components/data-transfers/data-transfers.component').then(
        (m) => m.DataTransfersComponent
      ),
    title: 'Data Transfer',
  },
  {
    path: 'data-consumption',
    loadComponent: () =>
      import('./components/data-consumption/data-consumption.component').then(
        (m) => m.DataConsumptionComponent
      ),
    title: 'Data Consumption',
  },
  {
    path: 'connector-configuration',
    loadComponent: () =>
      import(
        './components/connector-configuration/connector-configuration.component'
      ).then((m) => m.ConnectorConfigurationComponent),
    title: 'Connector Configuration',
  },
  {
    path: 'audit-trail',
    loadComponent: () =>
      import('./components/audit-trail/audit-trail.component').then(
        (m) => m.AuditTrailComponent
      ),
    title: 'Audit Trail',
  },
];
