import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { apiLimiter } from './middleware/rateLimiter';
import { startSubscriptionJobs } from './jobs/subscription-expiry.cron';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import planRoutes from './routes/plan.routes';
import orderRoutes from './routes/order.routes';
import entitlementRoutes from './routes/entitlement.routes';
import progressRoutes from './routes/progress.routes';
import certificateRoutes from './routes/certificate.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import blogRoutes from './routes/blog.routes';
import eventRoutes from './routes/event.routes';
import testimonialRoutes from './routes/testimonial.routes';
import categoryRoutes from './routes/category.routes';
import supportRoutes from './routes/support.routes';
import notificationRoutes from './routes/notification.routes';
import cmsRoutes from './routes/cms.routes';
import streamRoutes from './routes/stream.routes';
import path from 'path';
import contactRoutes from './routes/contact.routes';
import statsRoutes from './routes/stats.routes';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      mediaSrc: ["'self'", 'https:', 'blob:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    }
  }
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Session-ID'],
}));

// Capture raw body for Razorpay webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    if (req.url?.includes('/orders/webhook')) {
      (req as any).rawBody = buf.toString('utf8');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use((req, res, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

app.use('/api/', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'aimentra-api' });
});

app.get('/ready', (_req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/entitlements', entitlementRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/stream', streamRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Aimentra API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    startSubscriptionJobs();
  });
});

export default app;
