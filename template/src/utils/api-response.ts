import type { Response } from 'express';

/**
 * Standardized API response wrapper.
 * Every endpoint returns a consistent shape:
 * {
 *   success: boolean,
 *   data: T | null,
 *   message: string,
 *   timestamp: string
 * }
 */
interface ApiResponsePayload<T> {
  success: boolean;
  data: T | null;
  message: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'OK',
    statusCode = 200,
  ): Response<ApiResponsePayload<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Created',
  ): Response<ApiResponsePayload<T>> {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode = 500,
    errors?: unknown,
  ): Response<ApiResponsePayload<null>> {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message,
      ...(errors === undefined ? {} : { errors }),
      timestamp: new Date().toISOString(),
    });
  }
}
