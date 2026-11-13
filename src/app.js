// src/app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import registrationRoutes from './routes/registration.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Trust reverse proxy (Render, Railway, AWS, Heroku) for accurate rate limiting by client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['https://www.iamlecon.com/'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
      return callback(null, true); // Permissive only in local development
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IAMLECON 2027 Registration API',
    timestamp: new Date().toISOString(),
  });
});

// Primary API Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;

