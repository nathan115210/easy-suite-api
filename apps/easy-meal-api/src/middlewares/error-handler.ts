import type { NextFunction, Request, Response } from 'express';
import { AppError, type ApiError } from '@easy-suite/utils';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ApiError>,
  next: NextFunction,
) {
  void next;

  req.log?.error?.({ err }, 'request failed');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    },
  });
}
