import { ErrorCode } from '../types/errors';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code: ErrorCode;

  constructor(statusCode: number, message: string, code: ErrorCode = ErrorCode.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}
