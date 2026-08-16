import { Request, Response, NextFunction } from 'express';
import { User, Session } from '../models';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateAdminAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
} from '../services/auth.service';
import EmailService from '../services/email.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password required' },
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMAIL_IN_USE', message: 'Email address already registered' },
      });
    }

    const hashedPassword = await hashPassword(password);
    const verifyToken = generateSecureToken();
    const verifyTokenHash = hashToken(verifyToken);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      phone,
      emailVerificationToken: verifyTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending_verification',
      emailVerified: false,
      role: 'student',
    });
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    await EmailService.sendEmailVerification(user.email, `${frontend}/verify-email?token=${verifyToken}`);
    await EmailService.sendWelcome(user.email, user.name);

    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role, 'user');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email before purchasing.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        },
        accessToken,
        verifyToken: process.env.NODE_ENV !== 'production' ? verifyToken : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' },
      });
    }

    user.status = 'active';
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe, adminPortal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || (user.status !== 'active' && user.status !== 'pending_verification')) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Invalid email or password' },
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Invalid email or password' },
      });
    }

    const adminRoles = ['super_admin', 'admin', 'content_manager', 'finance_manager'];
    if (adminPortal && !adminRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const audience = adminPortal && adminRoles.includes(user.role) ? ('admin' as const) : ('user' as const);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const refreshDays = rememberMe ? 30 : 7;

    const accessToken =
      audience === 'admin'
        ? generateAdminAccessToken(user._id.toString(), user.email, user.role)
        : generateAccessToken(user._id.toString(), user.email, user.role, 'user');
    const refreshTokenStr = generateRefreshToken(user._id.toString(), sessionId, !!rememberMe, audience);

    const session = new Session({
      userId: user._id,
      sessionId,
      refreshTokenHash: hashToken(refreshTokenStr),
      deviceId: req.headers['user-agent'] || 'browser',
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || '127.0.0.1',
      expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
    });
    await session.save();

    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip || '127.0.0.1';
    await user.save();

    res.cookie('refreshToken', refreshTokenStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.cookies;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await Session.findOneAndUpdate({ sessionId: decoded.sessionId }, { revokedAt: new Date() });
      } catch {
        // ignore
      }
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'No refresh token' } });
    }

    const decoded = verifyRefreshToken(token);
    const session = await Session.findOne({ sessionId: decoded.sessionId });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Session invalid or expired' },
      });
    }

    const user = await User.findById(session.userId);
    if (!user || (user.status !== 'active' && user.status !== 'pending_verification')) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'User inactive or not found' },
      });
    }

    const audience = decoded.aud === 'admin' ? ('admin' as const) : ('user' as const);
    const newAccessToken =
      audience === 'admin'
        ? generateAdminAccessToken(user._id.toString(), user.email, user.role)
        : generateAccessToken(user._id.toString(), user.email, user.role, 'user');

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid refresh token' } });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If email exists, password reset instructions were generated',
      });
    }

    const resetToken = generateSecureToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    await EmailService.sendPasswordReset(user.email, `${frontend}/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: 'If email exists, password reset instructions were generated',
      ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' },
      });
    }

    user.passwordHash = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await Session.updateMany({ userId: user._id }, { revokedAt: new Date(), revokedReason: 'password_reset' });

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Current password incorrect' },
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await Session.updateMany({ userId: user._id }, { revokedAt: new Date(), revokedReason: 'password_changed' });

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
