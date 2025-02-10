export const environment = {
  TC_ROOT_API_URL: 'TC_ROOT_API_URL_PLACEHOLDER',
  CATALOG_API_URL: () => `${environment.TC_ROOT_API_URL}/catalogs`,
  DATASET_API_URL: () => `${environment.TC_ROOT_API_URL}/datasets`,
  NEGOTIATION_API_URL: () => `${environment.TC_ROOT_API_URL}/negotiations`,
  DATASERVICE_API_URL: () => `${environment.TC_ROOT_API_URL}/dataservices`,
  DISTRIBUTION_API_URL: () => `${environment.TC_ROOT_API_URL}/distributions`,
  DATA_TRANSFER_API_URL: () => `${environment.TC_ROOT_API_URL}/transfers`,
  ARTIFACTS_API_URL: () => `${environment.TC_ROOT_API_URL}/artifacts`,
  CONTRACT_NEGOTIATION_FORWARD_TO: () => `negotiations`,
  PROXY_API_URL: () => `${environment.TC_ROOT_API_URL}/proxy`,
};
