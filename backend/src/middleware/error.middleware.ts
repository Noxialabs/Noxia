import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../types';
import { logger } from '../utils/logger.utils';

export interface ApiError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
}

export const errorMiddleware = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('Error caught by middleware:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let response: APIResponse = {
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    response = {
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR',
      details: err.message
    };
    res.status(400).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    response = {
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    response = {
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    };
    res.status(401).json(response);
    return;
  }

  // Database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    response = {
      success: false,
      message: 'Duplicate entry found',
      error: 'DUPLICATE_ENTRY'
    };
    res.status(409).json(response);
    return;
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    response = {
      success: false,
      message: 'Referenced record not found',
      error: 'FOREIGN_KEY_VIOLATION'
    };
    res.status(400).json(response);
    return;
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    response = {
      success: false,
      message: 'File size exceeds limit',
      error: 'FILE_TOO_LARGE'
    };
    res.status(413).json(response);
    return;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    response = {
      success: false,
      message: 'Unexpected file field',
      error: 'INVALID_FILE_FIELD'
    };
    res.status(400).json(response);
    return;
  }

  // Rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    response = {
      success: false,
      message: 'Too many requests. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    };
    res.status(429).json(response);
    return;
  }

  // Network/external API errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    response = {
      success: false,
      message: 'External service unavailable',
      error: 'SERVICE_UNAVAILABLE'
    };
    res.status(503).json(response);
    return;
  }

  // OpenAI API errors
  if (err.message && err.message.includes('OpenAI')) {
    response = {
      success: false,
      message: 'AI service temporarily unavailable',
      error: 'AI_SERVICE_ERROR'
    };
    res.status(503).json(response);
    return;
  }

  // Ethereum/blockchain errors
  if (err.message && (err.message.includes('ethers') || err.message.includes('blockchain'))) {
    response = {
      success: false,
      message: 'Blockchain service unavailable',
      error: 'BLOCKCHAIN_ERROR'
    };
    res.status(503).json(response);
    return;
  }

  // Custom API errors
  if (error.statusCode) {
    response = {
      success: false,
      message: error.message || 'An error occurred',
      error: error.code || 'API_ERROR'
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Default server error
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      message: err.message,
      stack: err.stack
    };
  }

  res.status(500).json(response);
};

// Not found middleware
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const error: ApiError = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Create custom error
export const createError = (statusCode: number, message: string, code?: string): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
};