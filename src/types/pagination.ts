export enum PaginationOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: PaginationOrder;
}

/**
 * Interface for pagination metadata
 */
export interface Pagination {
  currentPage: number;
  recordsPerPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
