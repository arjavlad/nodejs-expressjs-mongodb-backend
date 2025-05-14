// Error Types
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // User Related
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_USER_DATA = 'INVALID_USER_DATA',
  USER_DISABLED = 'USER_DISABLED',

  // Resource Related
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  INVALID_RESOURCE_DATA = 'INVALID_RESOURCE_DATA',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // File Upload
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Parse
  PARSE_ERROR = 'PARSE_ERROR',

  // Payment
  INVALID_PAYMENT_RECORD = 'INVALID_PAYMENT_RECORD',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_STRIPE_ERROR = 'PAYMENT_STRIPE_ERROR',
}

export class ApiError extends Error {
  public statusCode: number;
  public code: ErrorCode;

  constructor(message: string, statusCode = 400, code: ErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface FileUploadErrorDetails {
  field?: string;
  limit?: number;
}

export class FileUploadError extends ApiError {
  details: FileUploadErrorDetails;

  constructor(message: string, details: FileUploadErrorDetails, code: ErrorCode) {
    super(message, 400, code);
    this.details = details;
  }
}

export interface ParseErrorDetails {
  type: string;
}

export class ParseError extends ApiError {
  details: ParseErrorDetails;

  constructor(message: string, details: ParseErrorDetails, code: ErrorCode) {
    super(message, 400, code);
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  public details: ValidationErrorDetails;

  constructor(message: string, details: ValidationErrorDetails, code: ErrorCode) {
    super(message, 400, code);
    this.details = details;
  }
}

export class DatabaseError extends ApiError {
  public details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown>, code: ErrorCode) {
    super(message, 500, code);
    this.details = details;
  }
}

export class ExternalServiceError extends ApiError {
  public details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown>, code: ErrorCode) {
    super(message, 502, code);
    this.details = details;
  }
}

interface ValidationErrorItem {
  field: string;
  message: string;
  received?: unknown;
  expected?: string;
  code?: string;
}

export interface ValidationErrorDetails {
  errors: ValidationErrorItem[];
}

// Predefined API Errors
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized'): ApiError => new ApiError(message, 401, ErrorCode.UNAUTHORIZED),
  forbidden: (message = 'Forbidden'): ApiError => new ApiError(message, 403, ErrorCode.FORBIDDEN),
  invalidCredentials: (message = 'Invalid credentials'): ApiError =>
    new ApiError(message, 401, ErrorCode.INVALID_CREDENTIALS),
  tokenExpired: (message = 'Token has expired'): ApiError => new ApiError(message, 401, ErrorCode.TOKEN_EXPIRED),
  duplicate: (message: string): ApiError => new ApiError(message, 409, ErrorCode.RESOURCE_ALREADY_EXISTS),
  invalidToken: (message = 'Invalid token'): ApiError => new ApiError(message, 401, ErrorCode.INVALID_TOKEN),
  userNotFound: (message = 'User not found'): ApiError => new ApiError(message, 404, ErrorCode.USER_NOT_FOUND),
  invalidInput: (message = 'Invalid input'): ApiError => new ApiError(message, 400, ErrorCode.INVALID_INPUT),
  notFound: (message = 'Resource not found'): ApiError => new ApiError(message, 404, ErrorCode.RESOURCE_NOT_FOUND),
  conflict: (message = 'Resource already exists'): ApiError =>
    new ApiError(message, 409, ErrorCode.RESOURCE_ALREADY_EXISTS),
  internalServerError: (message = 'Internal server error'): ApiError =>
    new ApiError(message, 500, ErrorCode.INTERNAL_ERROR),
  badRequest: (message = 'Bad request'): ApiError => new ApiError(message, 400, ErrorCode.VALIDATION_ERROR),
  validationError: (message = 'Validation error', details: ValidationErrorDetails): ValidationError =>
    new ValidationError(message, details, ErrorCode.VALIDATION_ERROR),
  databaseError: (message = 'Database error', details: Record<string, unknown>): DatabaseError =>
    new DatabaseError(message, details, ErrorCode.DATABASE_ERROR),
  externalServiceError: (message = 'External service error', details: Record<string, unknown>): ExternalServiceError =>
    new ExternalServiceError(message, details, ErrorCode.EXTERNAL_SERVICE_ERROR),
  fileUploadError: (message = 'File upload error', details: FileUploadErrorDetails): FileUploadError =>
    new FileUploadError(message, details, ErrorCode.FILE_UPLOAD_ERROR),
  fileTooLarge: (message = 'File too large', details: FileUploadErrorDetails): FileUploadError =>
    new FileUploadError(message, details, ErrorCode.FILE_TOO_LARGE),
  fileInvalidType: (message = 'File invalid type', details: FileUploadErrorDetails): FileUploadError =>
    new FileUploadError(message, details, ErrorCode.INVALID_FILE_TYPE),
  parseError: (message = 'Parse error', details: ParseErrorDetails): ParseError =>
    new ParseError(message, details, ErrorCode.PARSE_ERROR),
} as const;
