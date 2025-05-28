import { BlockchainNetwork } from "./blockchain.types";
import { UserTierLevel } from "./user.types";

export * from "./user.types";
export * from "./case.types";
export * from "./ai.types";
export * from "./blockchain.types";

// Common API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
  requestId?: string;
  details?: any;
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error response
export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// File upload response
export interface FileUploadResponse {
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  hash?: string;
  uploadedAt: Date;
}

// Document types
export interface Document {
  id: string;
  caseId?: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileHash: string;
  blockchainTxHash?: string;
  qrCodePath?: string;
  status: DocumentStatus;
  createdAt: Date;
}

export type DocumentType = "N240" | "N1" | "ET1" | "Other";
export type DocumentStatus = "Generated" | "Verified" | "Archived";

// Notification types
export interface Notification {
  id: string;
  userId: string;
  caseId?: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type NotificationType = "email" | "sms" | "push" | "webhook";
export type NotificationStatus = "Pending" | "Sent" | "Failed" | "Read";

// Audit log
export interface AuditLog {
  id: string;
  userId?: string;
  caseId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Health check response
export interface HealthCheckResponse {
  status: "OK" | "ERROR";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: "Connected" | "Disconnected" | "Error";
    redis?: "Connected" | "Disconnected" | "Error";
    openai: "Available" | "Unavailable" | "Error";
    ethereum: "Connected" | "Disconnected" | "Error";
  };
  memory: {
    used: number;
    total: number;
    external: number;
  };
}

// Search query interface
export interface SearchQuery {
  term: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Batch operation request
export interface BatchOperationRequest<T> {
  operations: T[];
  continueOnError?: boolean;
  batchSize?: number;
}

// Batch operation response
export interface BatchOperationResponse<T> {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  executionTime: number;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  tier: UserTierLevel;
  iat: number;
  exp: number;
}

// Database connection info
export interface DatabaseInfo {
  connected: boolean;
  host: string;
  database: string;
  version?: string;
  poolSize?: number;
  activeConnections?: number;
}

// Service status
export interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  version?: string;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

// Configuration interface
export interface AppConfig {
  app: {
    name: string;
    version: string;
    port: number;
    environment: string;
  };
  database: {
    url: string;
    maxConnections: number;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  ai: {
    openaiApiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  blockchain: {
    network: BlockchainNetwork;
    rpcUrl: string;
    privateKey?: string;
    contractAddress?: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  storage: {
    maxFileSize: number;
    allowedTypes: string[];
    uploadPath: string;
  };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Generic repository interface
export interface Repository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(
    filters?: Record<string, any>,
    page?: number,
    limit?: number
  ): Promise<{ items: T[]; total: number }>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Event emitter types
export interface EventData {
  type: string;
  payload: any;
  userId?: string;
  timestamp: Date;
}

export interface SystemEvent {
  id: string;
  type:
    | "user_registered"
    | "case_submitted"
    | "tier_updated"
    | "document_generated"
    | "blockchain_transaction";
  data: EventData;
  processed: boolean;
  createdAt: Date;
}
