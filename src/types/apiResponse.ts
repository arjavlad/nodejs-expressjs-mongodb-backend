/// API Response Types

import { Response, NextFunction } from 'express';
import { Pagination } from './pagination';
import { isDevelopment } from '../config/vars';
import { ApiError, ErrorCode, ValidationErrorDetails } from './errors';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  code: number;
  data: T;
  pagination?: Pagination;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: number;
  data: null;
  errors?: Array<{
    field: string;
    message: string;
    received?: unknown;
    expected?: string;
    code?: string;
  }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponseHandler {
  static paginatedSuccess<T>(res: Response, data: T, pagination?: Pagination, message = 'Success'): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      message,
      code: 200,
      data,
      pagination,
    };
    res.status(200).json(response);
  }

  public static success<T>(res: Response, data: T, message = 'Success', code = 200): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      message,
      code,
      data,
    };
    res.status(code).json(response);
  }

  public static error(res: Response | NextFunction, message: string, statusCode = 400, details?: object): void {
    const response: ApiErrorResponse = {
      success: false,
      message,
      code: statusCode,
      data: null,
    };

    // Add validation errors if present
    if (details && 'errors' in details && Array.isArray((details as ValidationErrorDetails).errors)) {
      if (isDevelopment) {
        response.errors = (details as ValidationErrorDetails).errors;
      }
    }

    if (typeof res === 'function') {
      const error = new ApiError(message, statusCode, ErrorCode.VALIDATION_ERROR);
      res(error);
    } else {
      res.status(statusCode).json(response);
    }
  }
}
