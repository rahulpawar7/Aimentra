import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

export type TokenAudience = 'user' | 'admin';

export const generateAccessToken = (
  userId: string,
  email: string,
  role: string,
  audience: TokenAudience = 'user'
): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
  const isAdminRole = ['super_admin', 'admin', 'content_manager', 'finance_manager'].includes(role);
  // Admin audience only when explicitly requested AND role is admin-capable
  const finalAud: TokenAudience = audience === 'admin' && isAdminRole ? 'admin' : 'user';
  // Put audience only in options (not also as payload.aud) — jsonwebtoken rejects both
  return jwt.sign({ id: userId, email, role }, secret, {
    expiresIn: '15m',
    audience: finalAud,
  });
};

export const generateAdminAccessToken = (userId: string, email: string, role: string): string => {
  return generateAccessToken(userId, email, role, 'admin');
};

export const generateRefreshToken = (
  userId: string,
  sessionId: string,
  rememberMe = false,
  audience: TokenAudience = 'user'
): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  return jwt.sign({ id: userId, sessionId }, secret, {
    expiresIn: rememberMe ? '30d' : '7d',
    audience,
  });
};

export const verifyAccessToken = (token: string): any => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  return jwt.verify(token, secret);
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
