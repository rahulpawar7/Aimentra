import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        status: string;
      };
    }
  }
}

const attachUserFromToken = (token: string, expectedAudience?: 'user' | 'admin') => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
  const decoded = jwt.verify(token, secret, expectedAudience ? { audience: expectedAudience } : undefined) as any;
  return {
    id: decoded.id as string,
    email: decoded.email as string,
    role: decoded.role as string,
    status: (decoded.status as string) || 'active',
    aud: (decoded.aud as string) || 'user',
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }

    const token = authHeader.split(' ')[1];
    // User routes accept user audience; admin tokens also work for user content browsing
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret') as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status || 'active',
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } });
    }
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
};

/** Admin routes require admin role AND admin JWT audience when present */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as any;

    const adminRoles = ['super_admin', 'admin', 'content_manager', 'finance_manager', 'support_agent'];
    if (!adminRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }

    // Reject pure user-audience tokens on admin routes when aud claim is explicitly "user"
    if (decoded.aud === 'user' && decoded.role === 'student') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin token required' } });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status || 'active',
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } });
    }
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, secret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        status: decoded.status || 'active'
      };
    }
  } catch (error) {
    // Ignore error for optional auth
  }
  next();
};
