import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'website',
  location: 'us-east4'
};

export const listMoviesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMovies');
}
listMoviesRef.operationName = 'ListMovies';

/**
 * Execute the ListMovies operation and return its result.
 *
 * @param {object} dc - Data connector instance or context used to run the query.
 * @returns {any} The result of the ListMovies operation.
 */
export function listMovies(dc) {
  return executeQuery(listMoviesRef(dc));
}

export const listUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUsers');
}
listUsersRef.operationName = 'ListUsers';

/**
 * Fetches the list of users for the website service.
 * @returns The response from the `ListUsers` operation.
 */
export function listUsers(dc) {
  return executeQuery(listUsersRef(dc));
}

export const listUserReviewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUserReviews');
}
listUserReviewsRef.operationName = 'ListUserReviews';

/**
 * Retrieve reviews made by users.
 * @returns {any} The result of the ListUserReviews operation.
 */
export function listUserReviews(dc) {
  return executeQuery(listUserReviewsRef(dc));
}

export const getMovieByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMovieById', inputVars);
}
getMovieByIdRef.operationName = 'GetMovieById';

/**
 * Execute the GetMovieById operation against the website service.
 * @param {object|any} dcOrVars - Either a data connector instance or the variables object for the operation.
 * @param {object} [vars] - Variables for the operation when the first argument is a data connector.
 * @returns {any} The result of the GetMovieById operation.
 */
export function getMovieById(dcOrVars, vars) {
  return executeQuery(getMovieByIdRef(dcOrVars, vars));
}

export const searchMovieRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchMovie', inputVars);
}
searchMovieRef.operationName = 'SearchMovie';

/**
 * Execute the SearchMovie operation using a DataConnect instance or explicit variables.
 * @param {object|undefined} dcOrVars - Either a DataConnect instance to run the operation with, or the variables object for the operation when calling without a DataConnect instance.
 * @param {object} [vars] - Variables for the SearchMovie operation when a DataConnect instance is provided as the first argument.
 * @returns {any} The result of the SearchMovie operation.
 */
export function searchMovie(dcOrVars, vars) {
  return executeQuery(searchMovieRef(dcOrVars, vars));
}

export const createMovieRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMovie', inputVars);
}
createMovieRef.operationName = 'CreateMovie';

/**
 * Execute the CreateMovie mutation.
 *
 * @param {any} dcOrVars - Data-connect instance or an object of variables for the mutation. If a data-connect instance is provided, `vars` should be passed as the second argument.
 * @param {object} [vars] - Variables for the CreateMovie mutation when `dcOrVars` is a data-connect instance.
 * @returns {any} The result of executing the CreateMovie mutation.
 */
export function createMovie(dcOrVars, vars) {
  return executeMutation(createMovieRef(dcOrVars, vars));
}

export const upsertUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertUser', inputVars);
}
upsertUserRef.operationName = 'UpsertUser';

/**
 * Execute the UpsertUser mutation.
 * @param {object|Record<string, any>} dcOrVars - Either a data-connector instance or the variables object for the mutation.
 * @param {Record<string, any>} [vars] - Variables for the mutation when the first argument is a data-connector instance.
 * @returns {any} The response returned by the UpsertUser mutation.
 */
export function upsertUser(dcOrVars, vars) {
  return executeMutation(upsertUserRef(dcOrVars, vars));
}

export const addReviewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddReview', inputVars);
}
addReviewRef.operationName = 'AddReview';

/**
 * Creates a new review by executing the `AddReview` mutation.
 *
 * @param {object|undefined} dcOrVars - Either a data connector instance or the variables object for the mutation.
 * @param {object} [vars] - Variables for the mutation when `dcOrVars` is a data connector instance.
 * @returns {any} The mutation response value.
 */
export function addReview(dcOrVars, vars) {
  return executeMutation(addReviewRef(dcOrVars, vars));
}

export const deleteReviewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteReview', inputVars);
}
deleteReviewRef.operationName = 'DeleteReview';

/**
 * Execute the DeleteReview mutation.
 * @param {*} dcOrVars - Data connector instance or, when a connector is not provided, the mutation variables.
 * @param {Object} [vars] - Mutation variables when `dcOrVars` is a data connector instance.
 * @returns {any} The result of the DeleteReview mutation.
 */
export function deleteReview(dcOrVars, vars) {
  return executeMutation(deleteReviewRef(dcOrVars, vars));
}
