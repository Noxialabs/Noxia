import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { APIResponse } from "../types";
import { logger } from "../utils/logger.utils";

// Default rate limit configuration
const defaultConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
    : 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    error: "RATE_LIMIT_EXCEEDED",
  } as APIResponse,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

// Create rate limiter with custom config
export const rateLimitMiddleware = (config?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  const options = {
    ...defaultConfig,
    ...config,
    message: config?.message
      ? ({
          success: false,
          message: config.message,
          error: "RATE_LIMIT_EXCEEDED",
        } as APIResponse)
      : defaultConfig.message,

    // Custom key generator that considers user ID if authenticated
    keyGenerator:
      config?.keyGenerator ||
      ((req: Request): string => {
        if (req.userId) {
          return `user:${req.userId}`;
        }
        return req.ip || "unknown";
      }),

    // Handler for when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userId: req.userId,
        url: req.url,
        method: req.method,
        userAgent: req.get("User-Agent"),
      });

      res.status(429).json(options.message);
    },

    // Skip counting requests that result in successful responses
    skip: (req: Request, res: Response) => {
      if (config?.skipSuccessfulRequests && res.statusCode < 400) {
        return true;
      }
      if (config?.skipFailedRequests && res.statusCode >= 400) {
        return true;
      }
      return false;
    },
  };

  return rateLimit(options);
};

// Specific rate limiters for different types of operations

// Authentication rate limiter (stricter)
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again in 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API rate limiter (general)
export const apiRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many API requests, please slow down.",
});

// AI service rate limiter (expensive operations)
export const aiRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message:
    "Too many AI requests, please wait before making more classification requests.",
});

// Blockchain rate limiter (expensive operations)
export const blockchainRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 blockchain operations per minute
  message:
    "Too many blockchain requests, please wait before making more transactions.",
});

// File upload rate limiter
export const uploadRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: "Too many file uploads, please wait before uploading more files.",
});

// Email/SMS rate limiter (to prevent spam)
export const notificationRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 notifications per minute
  message: "Too many notification requests, please wait before sending more.",
});

// Tier-based rate limiting
export const tierBasedRateLimit = (req: Request, res: Response, next: any) => {
  const user = req.user;

  let maxRequests = 50; // Default for Tier 1

  if (user) {
    switch (user.tier) {
      case "Tier 2":
        maxRequests = 100;
        break;
      case "Tier 3":
        maxRequests = 200;
        break;
      case "Tier 4":
        maxRequests = 500;
        break;
      default:
        maxRequests = 50;
    }
  }

  const tierRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: maxRequests,
    message: `Too many requests for your tier (${
      user?.tier || "Tier 1"
    }). Upgrade your tier for higher limits.`,
    keyGenerator: (req: Request) =>
      `tier:${user?.tier || "Tier 1"}:${req.userId || req.ip}`,
  });

  return tierRateLimit(req, res, next);
};

// Global rate limiter with Redis support (if Redis is available)
export const createRedisRateLimit = (redisClient?: any) => {
  if (!redisClient) {
    logger.warn(
      "Redis client not provided, falling back to in-memory rate limiting"
    );
    return rateLimitMiddleware();
  }

  // If you have Redis available, you can use express-rate-limit with Redis store
  // const RedisStore = require('rate-limit-redis');

  return rateLimitMiddleware({
    // store: new RedisStore({
    //   sendCommand: (...args: string[]) => redisClient.call(...args),
    // }),
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
};

// ===================================================
