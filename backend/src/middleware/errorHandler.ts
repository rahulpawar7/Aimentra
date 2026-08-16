import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = `Duplicate field value entered: ${Object.keys(err.keyValue).join(', ')}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    code = err.code || 'ERROR';
    message = err.message;
  }

  // Do not log in test env, but log in dev/prod
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${requestId} - ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId
    }
  });
};
