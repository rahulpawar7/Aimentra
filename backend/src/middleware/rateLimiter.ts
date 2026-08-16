import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 100 : 2000,
  'Too many requests, please try again later.'
);

export const loginLimiter = createRateLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 10 : 200,
  'Too many login attempts, please try again later.'
);

export const registrationLimiter = createRateLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 5 : 100,
  'Too many registration attempts, please try again later.'
);

export const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 3 : 50,
  'Too many password reset requests, please try again later.'
);
