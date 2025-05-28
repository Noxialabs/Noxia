
// src/utils/constants.ts
export const API_CONSTANTS = {
  // Application info
  APP_NAME: '999Plus',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Crime Reporting Platform to Combat Systematic Corruption',

  // API Configuration
  API_PREFIX: '/api',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes

  // Supported file types
  ALLOWED_FILE_TYPES: {
    DOCUMENTS: ['pdf', 'doc', 'docx'],
    IMAGES: ['jpg', 'jpeg', 'png', 'gif'],
    ALL: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif']
  },

  // User tiers and requirements
  TIERS: {
    TIER_1: {
      name: 'Tier 1',
      ethRequired: 0,
      features: [
        'Basic case submission',
        'AI classification',
        'Document viewing',
        'Basic notifications'
      ],
      limits: {
        casesPerMonth: 10,
        documentsPerMonth: 5,
        apiRequestsPerMinute: 50
      }
    },
    TIER_2: {
      name: 'Tier 2',
      ethRequired: 1,
      features: [
        'Case escalation',
        'Document hashing',
        'Email notifications',
        'Advanced search',
        'QR code generation'
      ],
      limits: {
        casesPerMonth: 50,
        documentsPerMonth: 25,
        apiRequestsPerMinute: 100
      }
    },
    TIER_3: {
      name: 'Tier 3',
      ethRequired: 5,
      features: [
        'Blockchain registration',
        'SMS notifications',
        'Document deletion',
        'Scheduled notifications',
        'Case analytics'
      ],
      limits: {
        casesPerMonth: 200,
        documentsPerMonth: 100,
        apiRequestsPerMinute: 200
      }
    },
    TIER_4: {
      name: 'Tier 4',
      ethRequired: 10,
      features: [
        'Bulk notifications',
        'Admin features',
        'Full API access',
        'Priority support',
        'Custom integrations'
      ],
      limits: {
        casesPerMonth: -1, // Unlimited
        documentsPerMonth: -1, // Unlimited
        apiRequestsPerMinute: 500
      }
    }
  },

  // Case-related constants
  CASE: {
    STATUSES: ['Pending', 'In Progress', 'Completed', 'Escalated', 'Closed'],
    PRIORITIES: ['Low', 'Normal', 'High', 'Critical'],
    ESCALATION_LEVELS: ['Basic', 'Priority', 'Urgent'],
    ISSUE_CATEGORIES: [
      'Corruption - Police',
      'Corruption - Government',
      'Corruption - Judicial',
      'Criminal - Assault',
      'Criminal - Fraud',
      'Criminal - Harassment',
      'Criminal - Murder',
      'Legal - Civil Rights',
      'Legal - Employment',
      'Legal - Housing',
      'Legal - Immigration',
      'Other'
    ],
    MIN_DESCRIPTION_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 5000
  },

  // Document-related constants
  DOCUMENTS: {
    TYPES: ['N240', 'N1', 'ET1', 'Other'],
    STATUSES: ['Generated', 'Verified', 'Archived'],
    TEMPLATES_PATH: './src/storage/templates',
    STORAGE_PATH: './src/storage/documents',
    QR_STORAGE_PATH: './src/storage/qr_codes'
  },

  // Notification constants
  NOTIFICATIONS: {
    TYPES: ['email', 'sms', 'push', 'webhook'],
    STATUSES: ['Pending', 'Sent', 'Failed', 'Read'],
    TEMPLATES: {
      CASE_SUBMITTED: 'case-submitted',
      TIER_UPGRADED: 'tier-upgraded',
      DOCUMENT_READY: 'document-ready',
      ESCALATION_ALERT: 'escalation-alert',
      CASE_UPDATE: 'case-update'
    },
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 5000
  },

  // Rate limiting constants
  RATE_LIMITS: {
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // attempts
    },
    API_GENERAL: {
      windowMs: 60 * 1000, // 1 minute
      max: 60 // requests
    },
    AI_OPERATIONS: {
      windowMs: 60 * 1000, // 1 minute
      max: 20 // requests
    },
    BLOCKCHAIN_OPERATIONS: {
      windowMs: 60 * 1000, // 1 minute
      max: 10 // requests
    },
    FILE_UPLOADS: {
      windowMs: 60 * 1000, // 1 minute
      max: 10 // uploads
    },
    NOTIFICATIONS: {
      windowMs: 60 * 1000, // 1 minute
      max: 5 // notifications
    }
  },

  // Blockchain constants
  BLOCKCHAIN: {
    NETWORKS: {
      MAINNET: 'mainnet',
      SEPOLIA: 'sepolia',
      GOERLI: 'goerli',
      POLYGON: 'polygon',
      MUMBAI: 'mumbai'
    },
    GAS_LIMITS: {
      SIMPLE_TRANSFER: 21000,
      CONTRACT_INTERACTION: 200000,
      DOCUMENT_REGISTRATION: 100000
    },
    CONFIRMATION_BLOCKS: 3
  },

  // AI Configuration
  AI: {
    MODELS: {
      GPT_4: 'gpt-4',
      GPT_4_TURBO: 'gpt-4-turbo-preview',
      GPT_3_5_TURBO: 'gpt-3.5-turbo'
    },
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.2,
    MIN_CONFIDENCE: 0.1,
    HIGH_CONFIDENCE: 0.8
  },

  // Error codes
  ERROR_CODES: {
    // Authentication errors
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INSUFFICIENT_PRIVILEGES: 'INSUFFICIENT_PRIVILEGES',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Business logic errors
    INSUFFICIENT_TIER: 'INSUFFICIENT_TIER',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

    // External service errors
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
    EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
    SMS_SERVICE_ERROR: 'SMS_SERVICE_ERROR',

    // File-related errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',

    // System errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  },

  // Success messages
  SUCCESS_MESSAGES: {
    USER_REGISTERED: 'User registered successfully',
    USER_AUTHENTICATED: 'User authenticated successfully',
    CASE_SUBMITTED: 'Case submitted successfully',
    CASE_UPDATED: 'Case updated successfully',
    DOCUMENT_GENERATED: 'Document generated successfully',
    NOTIFICATION_SENT: 'Notification sent successfully',
    TIER_UPDATED: 'User tier updated successfully',
    HASH_REGISTERED: 'Document hash registered on blockchain',
    QR_GENERATED: 'QR code generated successfully'
  },

  // Regular expressions
  REGEX: {
    ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    ETH_PRIVATE_KEY: /^0x[a-fA-F0-9]{64}$/,
    TX_HASH: /^0x[a-fA-F0-9]{64}$/,
    FILE_HASH: /^[a-fA-F0-9]{64}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    CASE_REF: /^999P-\d+-[A-Z0-9]{2,4}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+[1-9]\d{1,14}$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // Time constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000
  },

  // URLs and endpoints
  URLS: {
    ETHERSCAN: {
      MAINNET: 'https://etherscan.io',
      SEPOLIA: 'https://sepolia.etherscan.io',
      GOERLI: 'https://goerli.etherscan.io'
    },
    INFURA: {
      MAINNET: 'https://mainnet.infura.io/v3/',
      SEPOLIA: 'https://sepolia.infura.io/v3/',
      GOERLI: 'https://goerli.infura.io/v3/'
    }
  },

  // Database table names
  TABLES: {
    USERS: 'users',
    USER_TIERS: 'user_tiers',
    CASES: 'cases',
    AI_CLASSIFICATIONS: 'ai_classifications',
    DOCUMENTS: 'documents',
    BLOCKCHAIN_TRANSACTIONS: 'blockchain_transactions',
    NOTIFICATIONS: 'notifications',
    AUDIT_LOGS: 'audit_logs'
  },

  // Environment variables
  ENV_VARS: {
    NODE_ENV: 'NODE_ENV',
    PORT: 'PORT',
    DATABASE_URL: 'DATABASE_URL',
    JWT_SECRET: 'JWT_SECRET',
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    ETH_PRIVATE_KEY: 'ETH_PRIVATE_KEY',
    RPC_URL: 'RPC_URL',
    SMTP_HOST: 'SMTP_HOST',
    SMTP_USER: 'SMTP_USER',
    SMTP_PASS: 'SMTP_PASS'
  }
};

// Helper functions for constants
export class ConstantsHelper {
  // Get tier information by name
  static getTierInfo(tierName: string): any {
    const tiers = API_CONSTANTS.TIERS;
    return Object.values(tiers).find(tier => tier.name === tierName);
  }

  // Get tier by ETH balance
  static getTierByBalance(ethBalance: number): string {
    if (ethBalance >= API_CONSTANTS.TIERS.TIER_4.ethRequired) return 'Tier 4';
    if (ethBalance >= API_CONSTANTS.TIERS.TIER_3.ethRequired) return 'Tier 3';
    if (ethBalance >= API_CONSTANTS.TIERS.TIER_2.ethRequired) return 'Tier 2';
    return 'Tier 1';
  }

  // Check if feature is available for tier
  static isFeatureAvailable(tierName: string, feature: string): boolean {
    const tierInfo = this.getTierInfo(tierName);
    return tierInfo ? tierInfo.features.includes(feature) : false;
  }

  // Get rate limit for tier
  static getRateLimitForTier(tierName: string): number {
    const tierInfo = this.getTierInfo(tierName);
    return tierInfo ? tierInfo.limits.apiRequestsPerMinute : 50;
  }

  // Get monthly limits for tier
  static getMonthlyLimits(tierName: string): { cases: number; documents: number } {
    const tierInfo = this.getTierInfo(tierName);
    return tierInfo ? {
      cases: tierInfo.limits.casesPerMonth,
      documents: tierInfo.limits.documentsPerMonth
    } : { cases: 10, documents: 5 };
  }

  // Validate environment variables
  static validateEnvironment(): { valid: boolean; missing: string[] } {
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
      'OPENAI_API_KEY'
    ];

    const missing = required.filter(envVar => !process.env[envVar]);

    return {
      valid: missing.length === 0,
      missing
    };
  }

  // Get blockchain explorer URL
  static getExplorerUrl(network: string, txHash: string): string {
    const baseUrl = API_CONSTANTS.URLS.ETHERSCAN[network.toUpperCase() as keyof typeof API_CONSTANTS.URLS.ETHERSCAN];
    return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
  }

  // Get Infura RPC URL
  static getInfuraUrl(network: string, projectId: string): string {
    const baseUrl = API_CONSTANTS.URLS.INFURA[network.toUpperCase() as keyof typeof API_CONSTANTS.URLS.INFURA];
    return baseUrl ? `${baseUrl}${projectId}` : '';
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file size is within limits
  static isFileSizeValid(fileSize: number): boolean {
    return fileSize <= API_CONSTANTS.MAX_FILE_SIZE;
  }

  // Get notification template by type
  static getNotificationTemplate(templateType: string): string {
    return API_CONSTANTS.NOTIFICATIONS.TEMPLATES[templateType as keyof typeof API_CONSTANTS.NOTIFICATIONS.TEMPLATES] || '';
  }

  // Generate case reference
  static generateCaseRef(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `999P-${timestamp}-${random}`;
  }

  // Validate case reference format
  static isValidCaseRef(caseRef: string): boolean {
    return API_CONSTANTS.REGEX.CASE_REF.test(caseRef);
  }

  // Get time constants
  static getTimeConstant(unit: string): number {
    return API_CONSTANTS.TIME[unit.toUpperCase() as keyof typeof API_CONSTANTS.TIME] || 0;
  }

  // Check if issue category is valid
  static isValidIssueCategory(category: string): boolean {
    return API_CONSTANTS.CASE.ISSUE_CATEGORIES.includes(category);
  }

  // Get all valid values for a field
  static getValidValues(field: string): string[] {
    const fieldMap: { [key: string]: string[] } = {
      'status': API_CONSTANTS.CASE.STATUSES,
      'priority': API_CONSTANTS.CASE.PRIORITIES,
      'escalationLevel': API_CONSTANTS.CASE.ESCALATION_LEVELS,
      'issueCategory': API_CONSTANTS.CASE.ISSUE_CATEGORIES,
      'documentType': API_CONSTANTS.DOCUMENTS.TYPES,
      'documentStatus': API_CONSTANTS.DOCUMENTS.STATUSES,
      'notificationType': API_CONSTANTS.NOTIFICATIONS.TYPES,
      'notificationStatus': API_CONSTANTS.NOTIFICATIONS.STATUSES
    };

    return fieldMap[field] || [];
  }

  // Get default pagination settings
  static getDefaultPagination(): { page: number; limit: number } {
    return {
      page: 1,
      limit: API_CONSTANTS.DEFAULT_PAGE_SIZE
    };
  }

  // Validate pagination parameters
  static validatePagination(page: number, limit: number): { valid: boolean; corrected: { page: number; limit: number } } {
    const correctedPage = Math.max(1, page);
    const correctedLimit = Math.min(API_CONSTANTS.MAX_PAGE_SIZE, Math.max(1, limit));

    return {
      valid: page === correctedPage && limit === correctedLimit,
      corrected: {
        page: correctedPage,
        limit: correctedLimit
      }
    };
  }

  // Get error message by code
  static getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      [API_CONSTANTS.ERROR_CODES.AUTH_REQUIRED]: 'Authentication is required',
      [API_CONSTANTS.ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token',
      [API_CONSTANTS.ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
      [API_CONSTANTS.ERROR_CODES.INSUFFICIENT_TIER]: 'Your tier level is insufficient for this operation',
      [API_CONSTANTS.ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded, please try again later',
      [API_CONSTANTS.ERROR_CODES.VALIDATION_ERROR]: 'Input validation failed',
      [API_CONSTANTS.ERROR_CODES.RESOURCE_NOT_FOUND]: 'Requested resource not found',
      [API_CONSTANTS.ERROR_CODES.DUPLICATE_ENTRY]: 'Duplicate entry detected',
      [API_CONSTANTS.ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit',
      [API_CONSTANTS.ERROR_CODES.INVALID_FILE_TYPE]: 'File type is not supported',
      [API_CONSTANTS.ERROR_CODES.AI_SERVICE_ERROR]: 'AI service is temporarily unavailable',
      [API_CONSTANTS.ERROR_CODES.BLOCKCHAIN_ERROR]: 'Blockchain service error occurred',
      [API_CONSTANTS.ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
      [API_CONSTANTS.ERROR_CODES.INTERNAL_ERROR]: 'Internal server error'
    };

    return errorMessages[errorCode] || 'An unknown error occurred';
  }

  // Get success message by code
  static getSuccessMessage(operation: string): string {
    return API_CONSTANTS.SUCCESS_MESSAGES[operation as keyof typeof API_CONSTANTS.SUCCESS_MESSAGES] || 'Operation completed successfully';
  }

  // Convert time to human readable format
  static formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  // Check if current environment is production
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // Check if current environment is development
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // Get application info
  static getAppInfo(): { name: string; version: string; description: string } {
    return {
      name: API_CONSTANTS.APP_NAME,
      version: API_CONSTANTS.APP_VERSION,
      description: API_CONSTANTS.APP_DESCRIPTION
    };
  }
}
    