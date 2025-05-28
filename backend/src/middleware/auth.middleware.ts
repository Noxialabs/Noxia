// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { APIResponse, User } from '../types';
import { logger } from '../utils/logger.utils';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN'
      } as APIResponse);
      return;
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          error: 'TOKEN_EXPIRED'
        } as APIResponse);
        return;
      } else if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          error: 'INVALID_TOKEN'
        } as APIResponse);
        return;
      } else {
        throw jwtError;
      }
    }

    // Get user from database
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
        error: 'USER_NOT_FOUND'
      } as APIResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      } as APIResponse);
      return;
    }

    // Add user info to request
    req.userId = user.id;
    req.user = user;

    // Log successful authentication (optional, for security monitoring)
    logger.debug(`User authenticated: ${user.email} (${user.id})`);

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: 'AUTH_ERROR'
    } as APIResponse);
  }
};

// Optional middleware for routes that work with or without authentication
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await UserModel.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.userId = user.id;
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        logger.debug('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without auth for optional middleware
  }
};

// Admin middleware (requires specific role or tier)
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required for admin access.',
        error: 'AUTH_REQUIRED'
      } as APIResponse);
      return;
    }

    // Check if user has admin privileges (Tier 4 or specific admin flag)
    if (req.user.tier !== 'Tier 4') {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required. Upgrade to Tier 4 for admin access.',
        error: 'INSUFFICIENT_PRIVILEGES'
      } as APIResponse);
      return;
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin check.',
      error: 'ADMIN_CHECK_ERROR'
    } as APIResponse);
  }
};
