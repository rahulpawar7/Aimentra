import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, registrationLimiter, passwordResetLimiter, apiLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', registrationLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), authController.register);

router.post('/verify-email', apiLimiter, validate([
  body('token').notEmpty().withMessage('Token is required')
]), authController.verifyEmail);

router.post('/login', loginLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]), authController.login);

router.post('/logout', apiLimiter, authController.logout);

router.post('/refresh', apiLimiter, authController.refreshToken);

router.post('/forgot-password', passwordResetLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required')
]), authController.forgotPassword);

router.post('/reset-password', passwordResetLimiter, validate([
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), authController.resetPassword);

router.put('/change-password', requireAuth, apiLimiter, validate([
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
]), authController.changePassword);

router.get('/me', requireAuth, apiLimiter, authController.me);

export default router;
