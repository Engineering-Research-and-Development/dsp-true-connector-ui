export const environment = {
  //NEW

  TC_ROOT_API_URL: 'http://localhost:8090/api/v1',
  CATALOG_API_URL: () => `${environment.TC_ROOT_API_URL}/catalogs`,
  DATASET_API_URL: () => `${environment.TC_ROOT_API_URL}/datasets`,
  DATASERVICE_API_URL: () => `${environment.TC_ROOT_API_URL}/dataservices`,
  NEGOTIATION_API_URL: () => `${environment.TC_ROOT_API_URL}/negotiations`,
  DISTRIBUTION_API_URL: () => `${environment.TC_ROOT_API_URL}/distributions`,
  CONTRACT_NEGOTIATION_FORWARD_TO: () => `/negotiations`,
};
