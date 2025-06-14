import { UserProfile } from "./user.types";

// Case status types
export type CaseStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Escalated"
  | "Closed";
export interface Case {
  id: string;
  caseRef: string;
  title: string;
  userId: string;
  clientName: string;
  description: string;
  jurisdiction?: string;
  issueCategory: IssueCategory;
  escalationLevel: EscalationLevel;
  aiConfidence: number;
  status: CaseStatus;
  priority: CasePriority;
  urgencyScore: number;
  ethTxHash?: string;
  ceFileStatus: string;
  submissionDate: Date;
  closedAt: Date;
  closedBy: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: CaseAttachment[];
  metadata?: Record<string, any>;
  suggestedActions?: string[];
  closureReason?: string;
  assignedTo?: string;

  user?: UserProfile;
}

// Case priority types
export type CasePriority = "Low" | "Normal" | "High" | "Critical";

// Escalation level types
export type EscalationLevel = "Basic" | "Priority" | "Urgent";

// Issue category types
export type IssueCategory =
  | "Corruption - Police"
  | "Corruption - Government"
  | "Corruption - Judicial"
  | "Criminal - Assault"
  | "Criminal - Fraud"
  | "Criminal - Harassment"
  | "Criminal - Murder"
  | "Legal - Civil Rights"
  | "Legal - Employment"
  | "Legal - Housing"
  | "Legal - Immigration"
  | "Other";

// Case attachment interface
export interface CaseAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// Case submission request
export interface CaseSubmissionRequest {
  clientName: string;
  title: string;
  description: string;
  jurisdiction?: string;
  attachments?: Express.Multer.File[];
}

// Case update request
export interface CaseUpdateRequest {
  clientName?: string;
  description?: string;
  jurisdiction?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  attachments?: Express.Multer.File[];
}

// Case escalation request
export interface CaseEscalationRequest {
  reason: string;
  priority?: CasePriority;
  urgencyScore?: number;
  assignedTo?: string;
}

// Case search filters
export interface CaseSearchFilters {
  search?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  escalationLevel?: EscalationLevel;
  issueCategory?: IssueCategory;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

// Case statistics
export interface CaseStats {
  totalCases: number;
  recentCases: number;
  highUrgencyCases: number;
  avgConfidence: number;
  avgUrgency: number;
  statusBreakdown: {
    pending: number;
    inProgress: number;
    completed: number;
    escalated: number;
    closed: number;
  };
  escalationBreakdown: {
    urgent: number;
    priority: number;
    basic: number;
  };
  categoryBreakdown: Array<{
    category: IssueCategory;
    count: number;
  }>;
}

// Case activity log
export interface CaseActivity {
  id: string;
  caseId: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  createdAt: Date;
}

// Case escalation details
export interface CaseEscalation {
  id: string;
  caseId: string;
  escalatedBy: string;
  escalatedTo?: string;
  reason: string;
  priority: CasePriority;
  escalatedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

// Case timeline entry
export interface CaseTimelineEntry {
  id: string;
  caseId: string;
  action: string;
  description: string;
  performedBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Case assignment
export interface CaseAssignment {
  id: string;
  caseId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  status: "Active" | "Completed" | "Transferred";
  notes?: string;
}

interface CaseWithDetails {
  // Base case data
  id: string;
  caseRef: string;
  title: string;
  userId?: string;
  clientName: string;
  description: string;
  jurisdiction: string;
  issueCategory: string;
  escalationLevel: string;
  aiConfidence: number;
  status: string;
  priority: string;
  urgencyScore: number;
  ethTxHash?: string;
  ceFileStatus: string;
  submissionDate: string;
  updatedAt: string;
  createdAt: string;
  attachments: any;
  metadata: any;

  // Enhanced data
}
