import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import rubricRoutes from './routes/rubricRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/admin', adminRoutes);

// API Documentation route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Automated Assessment and Feedback System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      submissions: '/api/submissions',
      evaluations: '/api/evaluations',
      feedback: '/api/feedback',
      progress: '/api/progress',
      activities: '/api/activities',
      rubrics: '/api/rubrics',
      notifications: '/api/notifications',
      admin: '/api/admin',
    },
  });
});

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

export default app;
