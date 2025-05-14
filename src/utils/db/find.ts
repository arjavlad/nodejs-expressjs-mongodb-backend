import { Model, FilterQuery, QueryOptions, PopulateOptions, Query } from 'mongoose';
import { PaginatedResponse, PaginationOrder, PaginationParams } from '../../types/pagination';
import { createPaginationQuery, createPaginatedResponse } from './pagination';

/**
 * Wrapper for Mongoose find operations with pagination
 * @param model Mongoose model
 * @param query Find query
 * @param paginationParams Pagination parameters (page, limit, sortBy, order)
 * @param queryCallback Callback to modify the query, like populate
 * @returns Paginated response
 */
export const findWithPagination = async <T>(
  model: Model<T>,
  query: FilterQuery<T> = {},
  paginationParams: PaginationParams = {},
  queryCallback?: (query: Query<T[], T, Record<string, never>, T>) => Query<T[], T, Record<string, never>, T>,
): Promise<PaginatedResponse<T>> => {
  const { skip, limit: queryLimit } = createPaginationQuery(paginationParams);

  // Create base query
  let baseQuery = model.find(query) as Query<T[], T, Record<string, never>, T>;

  // Apply sort if provided in pagination params
  if (paginationParams.sortBy) {
    const order = paginationParams.order == PaginationOrder.ASC ? 1 : -1;
    baseQuery = baseQuery.sort({ [paginationParams.sortBy]: order });
  }

  // Allow caller to modify query with callback
  if (queryCallback) {
    baseQuery = queryCallback(baseQuery);
  }

  // Execute count and data queries in parallel
  const [data, totalRecords] = await Promise.all([
    baseQuery.skip(skip).limit(queryLimit).lean(),
    model.countDocuments(query),
  ]);

  // Create pagination metadata
  const pagination = createPaginatedResponse(totalRecords, paginationParams);

  // Return paginated response
  return { data: data as T[], pagination };
};

/**
 * Wrapper for Mongoose findOne operations with pagination
 * @param model Mongoose model
 * @param query Find query
 * @param paginationParams Pagination parameters
 * @param options Query options (sort, select, etc.)
 * @returns Paginated response
 */
export const findOneWithPagination = async <T>(
  model: Model<T>,
  query: FilterQuery<T> = {},
  paginationParams: PaginationParams = {},
  options: QueryOptions = {},
): Promise<PaginatedResponse<T>> => {
  const { skip, limit: queryLimit } = createPaginationQuery(paginationParams);

  // Create base query
  const baseQuery = model.findOne(query);

  // Apply query options (sort, select, etc.)
  if (options.sort) baseQuery.sort(options.sort);
  if (options['select']) baseQuery.select(options['select']);
  if (options.populate) {
    const populateOptions = options.populate as PopulateOptions | (string | PopulateOptions)[];
    baseQuery.populate(populateOptions);
  }

  // Execute count and data queries in parallel
  const [data, totalRecords] = await Promise.all([
    baseQuery.skip(skip).limit(queryLimit).lean(),
    model.countDocuments(query),
  ]);

  // Create pagination metadata
  const pagination = createPaginatedResponse(totalRecords, paginationParams);

  // Return paginated response
  return { data: data ? [data as T] : [], pagination };
};
