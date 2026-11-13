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
const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : [];

// Default allowed origins (both with and without www, plus local dev)
const defaultOrigins = [
  'https://www.iamlecon.com',
  'https://iamlecon.com',
  'http://www.iamlecon.com',
  'http://iamlecon.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Allow wildcard
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Exact match in allowed origins
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Match any subdomain of iamlecon.com
    if (/^https?:\/\/([a-z0-9-]+\.)*iamlecon\.com$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Match Vercel preview or production URLs
    if (/^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      console.warn(`[CORS Blocked] Origin: ${cleanOrigin}`);
      return callback(null, false);
    }

    return callback(null, true); // Permissive in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

