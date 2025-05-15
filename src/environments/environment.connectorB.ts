export const environment = {
  APP_VERSION: '0.1.2-dev',
  TC_ROOT_API_URL: 'http://localhost:8080/api/v1',
  CATALOG_API_URL: () => `${environment.TC_ROOT_API_URL}/catalogs`,
  DATASET_API_URL: () => `${environment.TC_ROOT_API_URL}/datasets`,
  DATASERVICE_API_URL: () => `${environment.TC_ROOT_API_URL}/dataservices`,
  NEGOTIATION_API_URL: () => `${environment.TC_ROOT_API_URL}/negotiations`,
  DISTRIBUTION_API_URL: () => `${environment.TC_ROOT_API_URL}/distributions`,
  DATA_TRANSFER_API_URL: () => `${environment.TC_ROOT_API_URL}/transfers`,
  ARTIFACTS_API_URL: () => `${environment.TC_ROOT_API_URL}/artifacts`,
  CONTRACT_NEGOTIATION_FORWARD_TO: () => `negotiations`,
  PROXY_API_URL: () => `${environment.TC_ROOT_API_URL}/proxy`,
};
