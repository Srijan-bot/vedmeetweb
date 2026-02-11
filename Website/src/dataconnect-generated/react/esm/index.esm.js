import { listMoviesRef, listUsersRef, listUserReviewsRef, getMovieByIdRef, searchMovieRef, createMovieRef, upsertUserRef, addReviewRef, deleteReviewRef, connectorConfig } from '../../esm/index.esm.js';
import { validateArgs, CallerSdkTypeEnum } from 'firebase/data-connect';
import { useDataConnectQuery, useDataConnectMutation, validateReactArgs } from '@tanstack-query-firebase/react/data-connect';


/**
 * Create a React query hook that retrieves a list of movies.
 * @param {any} dcOrOptions - DataConnect instance or an options object that includes a `dc` property; validated via connectorConfig.
 * @param {object} [options] - Additional React query options passed to the underlying hook.
 * @returns {any} The query result object containing the list of movies and associated query state (data, status, error, etc.).
 */
export function useListMovies(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = listMoviesRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Subscribes to and returns the list of users using the generated Data Connect React hook.
 *
 * @param {object|undefined} dcOrOptions - Either a data-connect instance (dc) or an options object; validated by the connector configuration.
 * @param {object|undefined} options - Query options when the first argument is a data-connect instance.
 * @returns {object} The query result containing the list of users along with status and control fields (e.g., data, error, isLoading, refetch).
 */
export function useListUsers(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = listUsersRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Subscribes to and returns the list of user reviews.
 *
 * @param {any} dcOrOptions - Data Connect instance or query options when using the default instance.
 * @param {object} [options] - Query options to override when the first argument is a Data Connect instance.
 * @returns {object} The query result containing the list of user reviews and associated query metadata.
 */
export function useListUserReviews(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = listUserReviewsRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Execute the getMovieById data-connect query and expose its React Query result.
 *
 * @param {object|undefined} dcOrVars - Either a DataConnect instance/configuration or the query variables object.
 * @param {object|undefined} varsOrOptions - If the first argument is a DataConnect instance, this is the query variables; otherwise this is the React Query options.
 * @param {object|undefined} options - React Query options when the first two arguments are (dcInstance, vars).
 * @returns The React Query result for the getMovieById operation.
 */
export function useGetMovieById(dcOrVars, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateReactArgs(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  const ref = getMovieByIdRef(dcInstance, inputVars);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Runs a movie search using the provided variables and returns a React Query result for the matched movies.
 *
 * @param {import('../../esm/index.esm.js').DataConnect|Object} dcOrVars - Either a DataConnect instance or the query variables when the connector instance is implied.
 * @param {Object|import('@tanstack-query-firebase/react/data-connect').QueryOptions} varsOrOptions - Either the query variables (when `dcOrVars` is a DataConnect) or query options.
 * @param {import('@tanstack-query-firebase/react/data-connect').QueryOptions} [options] - Query options when `dcOrVars` is a DataConnect and `varsOrOptions` are the variables.
 * @returns {Object} The React Query result object containing query state and the matched movies data.
 */
export function useSearchMovie(dcOrVars, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateReactArgs(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  const ref = searchMovieRef(dcInstance, inputVars);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}
/**
 * Create a React mutation hook that executes the "createMovie" data-connect operation.
 *
 * @param {any} dcOrOptions - DataConnect instance or connector options to resolve the underlying reference.
 * @param {object} [options] - Optional hook configuration (e.g., mutation options).
 * @returns {any} A mutation result object for invoking the createMovie operation.
 */
export function useCreateMovie(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputOpts } = validateArgs(connectorConfig, dcOrOptions, options);
  function refFactory(vars) {
    return createMovieRef(dcInstance, vars);
  }
  return useDataConnectMutation(refFactory, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Hook that provides a mutation for creating or updating a user record.
 *
 * @param {import('firebase/data-connect').DataConnect|object} dcOrOptions - DataConnect instance or options object; passes through to validation.
 * @param {object} [options] - Optional mutation options (e.g., react-query options) applied to the returned mutation.
 * @returns {import('@tanstack/react-query').UseMutationResult} The mutation object for performing the upsertUser operation (methods to trigger the mutation and status/meta fields).
 */
export function useUpsertUser(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputOpts } = validateArgs(connectorConfig, dcOrOptions, options);
  function refFactory(vars) {
    return upsertUserRef(dcInstance, vars);
  }
  return useDataConnectMutation(refFactory, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Creates a React Query mutation hook configured to perform the addReview operation.
 *
 * @param {any} dcOrOptions - DataConnect instance or connector options (may include default variables) used to resolve the addReview reference.
 * @param {object} [options] - Optional configuration forwarded to the underlying mutation hook (e.g., React Query mutation options or connector overrides).
 * @returns {any} The mutation result object used to execute the addReview operation and track its status. 
 */
export function useAddReview(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputOpts } = validateArgs(connectorConfig, dcOrOptions, options);
  function refFactory(vars) {
    return addReviewRef(dcInstance, vars);
  }
  return useDataConnectMutation(refFactory, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

/**
 * Create a React mutation hook for invoking the `deleteReview` data-connect operation.
 *
 * @param {any} dcOrOptions - DataConnect instance or an options object used to resolve the connector and initial mutation options.
 * @param {object} [options] - Optional mutation hook configuration.
 * @returns {object} The mutation controller and state for executing the `deleteReview` operation (methods like `mutate`/`mutateAsync`, and status flags).
 */
export function useDeleteReview(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputOpts } = validateArgs(connectorConfig, dcOrOptions, options);
  function refFactory(vars) {
    return deleteReviewRef(dcInstance, vars);
  }
  return useDataConnectMutation(refFactory, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}