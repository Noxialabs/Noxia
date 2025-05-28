import { UserTierLevel } from "./user.types";

export interface BlockchainTransaction {
  id: string;
  documentId?: string;
  caseId?: string;
  txHash: string;
  documentHash: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: string;
  status: TransactionStatus;
  network: BlockchainNetwork;
  fromAddress?: string;
  toAddress?: string;
  value?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

// Transaction status types
export type TransactionStatus = 'Pending' | 'Confirmed' | 'Failed' | 'Cancelled';

// Blockchain network types
export type BlockchainNetwork = 'mainnet' | 'sepolia' | 'goerli' | 'polygon' | 'mumbai';

// Document hash registration request
export interface DocumentHashRequest {
  documentHash: string;
  documentId?: string;
  caseId?: string;
  metadata?: Record<string, any>;
}

// Document hash registration response
export interface DocumentHashResponse {
  txHash: string;
  documentHash: string;
  blockNumber?: number;
  gasUsed?: number;
  explorerUrl: string;
  status: TransactionStatus;
  estimatedConfirmationTime?: number;
}

// Document verification request
export interface DocumentVerificationRequest {
  documentPath?: string;
  documentHash?: string;
  expectedHash?: string;
}

// Document verification response
export interface DocumentVerificationResponse {
  isValid: boolean;
  actualHash: string;
  expectedHash?: string;
  blockchainVerified: boolean;
  txHash?: string;
  blockNumber?: number;
  verifiedAt: Date;
  details?: Record<string, any>;
}

// Tier update request
export interface TierUpdateRequest {
  userId: string;
  ethAddress: string;
  forceUpdate?: boolean;
}

// Tier update response
export interface TierUpdateResponse {
  userId: string;
  ethAddress: string;
  previousTier: UserTierLevel;
  currentTier: UserTierLevel;
  ethBalance: number;
  tierChanged: boolean;
  lastChecked: Date;
  features: string[];
  limits: {
    casesPerMonth: number;
    documentsPerMonth: number;
    apiRequestsPerMinute: number;
  };
}

// Wallet information
export interface WalletInfo {
  address: string;
  balance: number;
  tier: UserTierLevel;
  isValid: boolean;
  lastChecked: Date;
  network: BlockchainNetwork;
}

// Smart contract interface
export interface SmartContract {
  address: string;
  abi: any[];
  network: BlockchainNetwork;
  deployedAt?: Date;
  version: string;
}

// Gas estimation
export interface GasEstimation {
  gasLimit: number;
  gasPrice: string;
  estimatedCost: string;
  estimatedTime: number;
  confidence: 'low' | 'medium' | 'high';
}

// Blockchain operation log
export interface BlockchainOperationLog {
  id: string;
  operation: string;
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  value?: string;
  gasUsed?: number;
  gasPrice?: string;
  status: TransactionStatus;
  error?: string;
  userId?: string;
  createdAt: Date;
}

// Blockchain statistics
export interface BlockchainStats {
  transactions: {
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
    avgGasUsed: number;
    recent: number;
  };
  tiers: Array<{
    tier: UserTierLevel;
    count: number;
  }>;
  networks: Array<{
    network: BlockchainNetwork;
    transactionCount: number;
  }>;
  totalGasSpent: number;
  avgTransactionTime: number;
}

// QR code generation request
export interface QRCodeRequest {
  documentHash: string;
  txHash?: string;
  metadata?: Record<string, any>;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// QR code generation response
export interface QRCodeResponse {
  qrCodePath: string;
  qrCodeUrl: string;
  qrData: {
    documentHash: string;
    txHash?: string;
    verifyUrl: string;
    explorerUrl?: string;
    generatedAt: string;
    metadata?: Record<string, any>;
  };
  base64: string;
}

// Blockchain event
export interface BlockchainEvent {
  id: string;
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  topics: string[];
  data: string;
  decodedData?: Record<string, any>;
  createdAt: Date;
}

// Network status
export interface NetworkStatus {
  network: BlockchainNetwork;
  isOnline: boolean;
  blockHeight: number;
  gasPrice: string;
  avgBlockTime: number;
  congestion: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}
