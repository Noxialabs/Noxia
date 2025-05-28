import { EscalationLevel, IssueCategory } from "./case.types";
import { UserTierLevel } from "./user.types";

export interface AIClassification {
  issueCategory: IssueCategory;
  escalationLevel: EscalationLevel;
  confidence: number;
  suggestedActions: string[];
  urgencyScore: number;
  reasoning?: string;
}

// AI classification request
export interface AIClassificationRequest {
  text: string;
  context?: Record<string, any>;
  caseId?: string;
  userId?: string;
}

// AI classification response with metadata
export interface AIClassificationResponse extends AIClassification {
  processingTimeMs: number;
  modelUsed: string;
  tokensUsed?: number;
  cost?: number;
  timestamp: string;
  requestId: string;
}

// AI classification history entry
export interface AIClassificationHistory {
  id: string;
  caseId?: string;
  caseRef?: string;
  userId?: string;
  inputText: string;
  issueCategory: IssueCategory;
  escalationLevel: EscalationLevel;
  confidence: number;
  urgencyScore: number;
  suggestedActions: string[];
  processingTimeMs: number;
  modelUsed: string;
  tokensUsed?: number;
  cost?: number;
  createdAt: Date;
}

// AI escalation analysis request
export interface AIEscalationRequest {
  subject: string;
  body: string;
  customerTier?: UserTierLevel;
  urgency?: string;
  context?: Record<string, any>;
}

// AI escalation analysis response
export interface AIEscalationResponse {
  escalate: boolean;
  routeTo: string;
  reason: string;
  urgencyLevel: number;
  recommendedActions: string[];
  confidence: number;
}

// AI model configuration
export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// AI prompt template
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'classification' | 'escalation' | 'summary' | 'analysis';
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI operation log
export interface AIOperationLog {
  id: string;
  operation: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  duration: number;
  success: boolean;
  error?: string;
  userId?: string;
  caseId?: string;
  createdAt: Date;
}

// AI classification statistics
export interface AIClassificationStats {
  totalClassifications: number;
  avgConfidence: number;
  avgUrgencyScore: number;
  avgProcessingTime: number;
  urgentCases: number;
  priorityCases: number;
  basicCases: number;
  categoryBreakdown: Array<{
    category: IssueCategory;
    count: number;
  }>;
  modelUsage: Array<{
    model: string;
    count: number;
    avgCost: number;
  }>;
  timeframe: string;
}

// AI batch processing request
export interface AIBatchRequest {
  id: string;
  requests: AIClassificationRequest[];
  priority: 'low' | 'normal' | 'high';
  callback?: string;
  createdAt: Date;
}

// AI batch processing response
export interface AIBatchResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRequests: number;
  processedRequests: number;
  results: AIClassificationResponse[];
  errors: Array<{
    index: number;
    error: string;
  }>;
  startedAt?: Date;
  completedAt?: Date;
}

// AI feedback for model improvement
export interface AIFeedback {
  id: string;
  classificationId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  suggestedCategory?: IssueCategory;
  suggestedEscalation?: EscalationLevel;
  createdAt: Date;
}