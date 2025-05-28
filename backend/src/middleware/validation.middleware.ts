import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { APIResponse } from '../types';
import { logger } from '../utils/logger.utils';

export const validationMiddleware = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false, // Return all validation errors
        stripUnknown: true, // Remove unknown properties
        convert: true, // Convert types when possible
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed:', {
          property,
          errors: validationErrors,
          originalData: req[property]
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: validationErrors
        } as APIResponse);
        return;
      }

      // Replace the original data with validated and sanitized data
      req[property] = value;
      next();
    } catch (validationError) {
      logger.error('Validation middleware error:', validationError);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
        error: 'VALIDATION_MIDDLEWARE_ERROR'
      } as APIResponse);
    }
  };
};

// Custom validation helpers
export const customValidators = {
  // Ethereum address validation
  ethAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).messages({
    'string.pattern.base': 'Invalid Ethereum address format'
  }),

  // UUID validation
  uuid: Joi.string().uuid().messages({
    'string.guid': 'Invalid UUID format'
  }),

  // Strong password validation
  strongPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  // Phone number validation (international format)
  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
  }),

  // Case reference validation
  caseRef: Joi.string().pattern(/^999P-\d+-[A-Z0-9]{4}$/).messages({
    'string.pattern.base': 'Invalid case reference format'
  }),

  // File hash validation (SHA-256)
  fileHash: Joi.string().length(64).pattern(/^[a-fA-F0-9]+$/).messages({
    'string.length': 'File hash must be 64 characters long',
    'string.pattern.base': 'File hash must be hexadecimal'
  }),

  // Transaction hash validation
  txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).messages({
    'string.pattern.base': 'Invalid transaction hash format'
  }),

  // Pagination validation
  pagination: {
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page number must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
  }
};

// Sanitization middleware
export const sanitizeMiddleware = (
  fields: string[] = []
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const sanitizeString = (str: string): string => {
        return str
          .trim()
          .replace(/[<>]/g, '') // Remove basic HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/sql/gi, '') // Basic SQL injection prevention
          .substring(0, 10000); // Limit length to prevent DoS
      };

      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeString(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        } else if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
          }
          return sanitized;
        }
        return obj;
      };

      // Sanitize specified fields or all fields if none specified
      if (fields.length > 0) {
        fields.forEach(field => {
          if (req.body[field]) {
            req.body[field] = sanitizeObject(req.body[field]);
          }
        });
      } else {
        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query);
      }

      next();
    } catch (error) {
      logger.error('Sanitization middleware error:', error);
      next(); // Continue without sanitization rather than fail
    }
  };
};
