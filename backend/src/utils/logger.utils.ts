import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, userId, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (service) {
      logMessage += ` [${service}]`;
    }
    
    if (userId) {
      logMessage += ` [User: ${userId}]`;
    }
    
    logMessage += `: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, userId } = info;
    let logMessage = `${timestamp} ${level}`;
    
    if (service) {
      logMessage += ` [${service}]`;
    }
    
    if (userId) {
      logMessage += ` [${userId}]`;
    }
    
    return `${logMessage}: ${message}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: '999plus-backend',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Separate file for audit logs
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ],

  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Specialized loggers for different purposes
export class LoggerUtils {
  // Audit logger for security events
  static auditLog(event: string, details: any, userId?: string): void {
    logger.info(event, {
      type: 'audit',
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Security logger for authentication events
  static securityLog(event: string, details: any, ip?: string, userAgent?: string): void {
    logger.warn(event, {
      type: 'security',
      ip,
      userAgent,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Performance logger
  static performanceLog(operation: string, duration: number, details?: any): void {
    logger.info(`Performance: ${operation}`, {
      type: 'performance',
      duration,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // API request logger
  static apiLog(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    logger.info(`API Request: ${method} ${url}`, {
      type: 'api',
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Database operation logger
  static dbLog(operation: string, table: string, duration?: number, error?: any): void {
    if (error) {
      logger.error(`DB Error: ${operation} on ${table}`, {
        type: 'database',
        operation,
        table,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.debug(`DB Operation: ${operation} on ${table}`, {
        type: 'database',
        operation,
        table,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Blockchain operation logger
  static blockchainLog(operation: string, txHash?: string, gasUsed?: number, error?: any): void {
    if (error) {
      logger.error(`Blockchain Error: ${operation}`, {
        type: 'blockchain',
        operation,
        txHash,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info(`Blockchain Operation: ${operation}`, {
        type: 'blockchain',
        operation,
        txHash,
        gasUsed,
        timestamp: new Date().toISOString()
      });
    }
  }

  // AI operation logger
  static aiLog(operation: string, model: string, tokens?: number, cost?: number, error?: any): void {
    if (error) {
      logger.error(`AI Error: ${operation}`, {
        type: 'ai',
        operation,
        model,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info(`AI Operation: ${operation}`, {
        type: 'ai',
        operation,
        model,
        tokens,
        cost,
        timestamp: new Date().toISOString()
      });
    }
  }

  // User activity logger
  static userActivityLog(userId: string, action: string, details?: any): void {
    logger.info(`User Activity: ${action}`, {
      type: 'user_activity',
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Case activity logger
  static caseLog(caseId: string, action: string, userId?: string, details?: any): void {
    logger.info(`Case Activity: ${action}`, {
      type: 'case_activity',
      caseId,
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Document activity logger
  static documentLog(documentId: string, action: string, userId?: string, details?: any): void {
    logger.info(`Document Activity: ${action}`, {
      type: 'document_activity',
      documentId,
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Error logger with context
  static errorLog(error: Error, context?: any, userId?: string): void {
    logger.error(error.message, {
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Create child logger with default metadata
  static createChildLogger(service: string, userId?: string): winston.Logger {
    return logger.child({
      service,
      userId
    });
  }
}

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    LoggerUtils.apiLog(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      req.userId
    );
  });
  
  next();
};

export default logger;
