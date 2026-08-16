import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot find ${req.method} ${req.originalUrl}`,
      requestId
    }
  });
};
