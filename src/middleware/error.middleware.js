// src/middleware/error.middleware.js

import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Multer-specific error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 5 MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Custom file filter rejection
  if (err.message && err.message.includes('Only JPG, PNG, WEBP images and PDF documents are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default server error (mask raw database/internal exceptions in production)
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || 500;
  const clientMessage =
    statusCode >= 500 && isProduction
      ? 'An unexpected internal server error occurred.'
      : err.message || 'An unexpected internal server error occurred.';

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
}

