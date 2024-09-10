export const environment = {
  //NEW

  TC_ROOT_API_URL: 'http://localhost:8080/api',
  CATALOG_API_URL: () => `${environment.TC_ROOT_API_URL}/catalogs`,
  DATASET_API_URL: () => `${environment.TC_ROOT_API_URL}/datasets`,
  NEGOTIATION_API_URL: () => `${environment.TC_ROOT_API_URL}/negotiations`,
  DATASERVICE_API_URL: () => `${environment.TC_ROOT_API_URL}/dataservices`,
  DISTRIBUTION_API_URL: () => `${environment.TC_ROOT_API_URL}/distributions`,
  CONTRACT_NEGOTIATION_FORWARD_TO: () => `/negotiations`,
};
