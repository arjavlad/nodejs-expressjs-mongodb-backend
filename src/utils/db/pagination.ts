import { Model, PipelineStage } from 'mongoose';

import { DEFAULT_PAGINATION } from './constants';

import { PaginatedResponse, Pagination, PaginationParams } from '../../types/pagination';

/**
 * Creates a paginated response for MongoDB aggregation pipeline with count
 * @param model Mongoose model
 * @param filterStages Filter stages for the query
 * @param params Pagination parameters
 * @param additionalStages Additional stages to be added after pagination
 * @returns Paginated response
 *
 * **NOTE**: Use this for large and complex queries and data sets.
 *
 */
export const paginatedAgrregateSearchWithCount = async <T>(
  model: Model<T>,
  filterStages: PipelineStage[],
  params: PaginationParams = {},
  additionalStages: PipelineStage[] = [],
): Promise<PaginatedResponse<T>> => {
  const { skip, limit: queryLimit } = createPaginationQuery(params);

  const [countResults, dataResults] = await Promise.all([
    model.aggregate([{ $match: filterStages }, { $count: 'totalRecords' }]),
    model.aggregate([{ $match: filterStages }, { $skip: skip, $limit: queryLimit }, ...additionalStages]),
  ]);

  const totalRecords = countResults.length > 0 ? countResults[0].totalRecords : 0;

  return {
    data: dataResults,
    pagination: createPaginatedResponse(totalRecords, params),
  };
};

/**
 * Creates a paginated response for MongoDB aggregation pipeline
 * @param model Mongoose model
 * @param filterStages Filter stages for the query
 * @param params Pagination parameters
 * @param additionalStages Additional stages to be added after pagination, i.e. lookup, unwind, etc.
 * @param dataModelingStages Data modeling stages to be added after pagination, i.e. project, replaceRoot, etc.
 * @returns Paginated response
 *
 * **NOTE**: Use this for small and simple queries and data sets.
 *
 * **NOTE**: the dataModelStages will be applied after the data is fetched and pagination is applied.
 */
export const paginatedAgrregateSearch = async <T>(
  model: Model<T>,
  filterStages: PipelineStage.FacetPipelineStage[],
  params: PaginationParams = {},
  additionalStages: PipelineStage.FacetPipelineStage[] = [],
  dataModelingStages: PipelineStage[] = [],
): Promise<PaginatedResponse<T>> => {
  const { skip, limit: queryLimit } = createPaginationQuery(params);

  const dataStages: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $skip: skip },
    { $limit: queryLimit },
    ...additionalStages,
  ];

  const query: PipelineStage[] = [
    {
      $facet: {
        records: dataStages,
        count: [...filterStages, { $count: 'totalRecords' }],
      },
    },
  ];
  if (dataModelingStages.length > 0) {
    query.push(...dataModelingStages);
  }

  const result = await model.aggregate(query);

  const data = result.length > 0 ? result[0].records : [];
  const totalRecords = result.length > 0 && result[0].count.length > 0 ? result[0].count[0].totalRecords : 0;

  return {
    data,
    pagination: createPaginatedResponse(totalRecords, params),
  };
};

/**
 * Creates a paginated query for MongoDB find operations
 * @param params Pagination parameters
 * @returns Object with skip and limit values
 */
export const createPaginationQuery = (params: PaginationParams) => {
  const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit } = params;
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
  };
};

/**
 * Creates a paginated response for find operations
 * @param totalRecords Total number of records
 * @param params Pagination parameters
 * @returns Paginated response
 */
export const createPaginatedResponse = (totalRecords: number, params: PaginationParams): Pagination => {
  const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit } = params;
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    currentPage: page,
    recordsPerPage: limit,
    totalRecords,
    totalPages,
  };
};

/**
 * Creates an empty paginated response
 * @returns Empty paginated response
 */
export const createEmptyPaginatedResponse = (): Pagination => ({
  currentPage: 0,
  recordsPerPage: 0,
  totalRecords: 0,
  totalPages: 0,
});
