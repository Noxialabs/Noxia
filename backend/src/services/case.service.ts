import { query } from "../database/connection";
import { Case, EscalationAnalysis } from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";
import { AIService } from "./ai.service";

export class CaseService {
  async createCase(caseData: {
    title: string;
    caseRef: string;
    userId: string;
    clientName: string;
    description: string;
    jurisdiction?: string;
    issueCategory: string;
    escalationLevel: string;
    aiConfidence: number;
    urgencyScore: number;
    suggestedActions?: string[] | string;
    status?: string;
    priority?: string;
    attachments?: any;
    metadata?: any;
  }): Promise<Case> {
    const id = uuidv4();
    const now = new Date();

    // Ensure proper JSONB formatting
    const suggestedActions = Array.isArray(caseData.suggestedActions)
      ? caseData.suggestedActions
      : caseData.suggestedActions
      ? [caseData.suggestedActions]
      : [];

    const attachments =
      caseData.attachments && typeof caseData.attachments === "object"
        ? caseData.attachments
        : {};

    const metadata =
      caseData.metadata && typeof caseData.metadata === "object"
        ? caseData.metadata
        : {};

    const result = await query(
      `INSERT INTO cases (
        id, title, case_ref, user_id, client_name, description, jurisdiction,
        issue_category, escalation_level, ai_confidence, urgency_score,
        suggested_actions, status, priority, attachments, metadata,
        submission_date, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        caseData.title,
        caseData.caseRef,
        caseData.userId ?? null,
        caseData.clientName,
        caseData.description,
        caseData.jurisdiction || null,
        caseData.issueCategory,
        caseData.escalationLevel,
        caseData.aiConfidence,
        caseData.urgencyScore,
        JSON.stringify(suggestedActions),
        caseData.status || "Pending",
        caseData.priority || "Normal",
        JSON.stringify(attachments),
        JSON.stringify(metadata),
        now,
        now,
      ]
    );

    logger.info(`Case created: ${caseData.caseRef}`);
    return this.mapDatabaseCase(result.rows[0]);
  }

  async getCases(
    filters: {
      userId?: string; // Made optional
      status?: string;
      priority?: string;
      escalationLevel?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "";
    const values: any[] = [];
    let paramIndex = 1;
    let hasWhere = false;

    // Apply userId filter only if userId has a value
    if (filters.userId) {
      whereClause += "WHERE user_id = $1";
      values.push(filters.userId);
      paramIndex++;
      hasWhere = true;
    }

    if (filters.status) {
      whereClause += hasWhere
        ? ` AND status = $${paramIndex}`
        : `WHERE status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
      hasWhere = true;
    }

    if (filters.priority) {
      whereClause += hasWhere
        ? ` AND priority = $${paramIndex}`
        : `WHERE priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
      hasWhere = true;
    }

    if (filters.escalationLevel) {
      whereClause += hasWhere
        ? ` AND escalation_level = $${paramIndex}`
        : `WHERE escalation_level = $${paramIndex}`;
      values.push(filters.escalationLevel);
      paramIndex++;
      hasWhere = true;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM cases ${whereClause}`,
      values
    );

    // Get cases with pagination
    const casesResult = await query(
      `SELECT * FROM cases ${whereClause} 
     ORDER BY submission_date DESC 
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      cases: casesResult.rows.map((row) => this.mapDatabaseCase(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }

  async getCaseById(id: string, userId: string): Promise<Case | null> {
    const result = await query("SELECT * FROM cases WHERE id = $1", [id]);

    return result.rows.length > 0 ? this.mapDatabaseCase(result.rows[0]) : null;
  }

  // Improved safeParseJSON method
  private safeParseJSON<T>(value: any, fallback: T): T {
    // Return fallback if value is null, undefined, or empty
    if (value === null || value === undefined) {
      return fallback;
    }

    // If it's already an object/array, return it
    if (typeof value === "object") {
      return value as T;
    }

    // If it's a string, try to parse it
    if (typeof value === "string") {
      // Handle empty strings
      if (value.trim() === "") {
        return fallback;
      }

      try {
        const parsed = JSON.parse(value);
        return parsed as T;
      } catch (error) {
        console.warn(`JSON parse error for value: ${value}`, error);
        return fallback;
      }
    }

    // For any other type, return fallback
    return fallback;
  }

  // Improved updateCase method with better JSONB handling
  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);

        if (dbField === "suggested_actions" || dbField === "attachments") {
          // Handle JSON array fields
          if (value === null) {
            setClause.push(`${dbField} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify([])); // Default to empty array instead of null
          } else {
            setClause.push(`${dbField} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(Array.isArray(value) ? value : []));
          }
        } else if (dbField === "metadata") {
          // Handle JSON object fields with merge capability
          if (value === null) {
            setClause.push(`${dbField} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify({})); // Default to empty object instead of null
          } else {
            setClause.push(`${dbField} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(typeof value === "object" ? value : {}));
          }
        } else {
          // Handle other fields with explicit type casting where needed
          if (value === null) {
            setClause.push(`${dbField} = $${paramIndex}`);
            values.push(null);
          } else if (typeof value === "boolean") {
            setClause.push(`${dbField} = $${paramIndex}::boolean`);
            values.push(value);
          } else if (typeof value === "number") {
            setClause.push(`${dbField} = $${paramIndex}::numeric`);
            values.push(value);
          } else if (value instanceof Date) {
            setClause.push(`${dbField} = $${paramIndex}::timestamp`);
            values.push(value);
          } else {
            setClause.push(`${dbField} = $${paramIndex}`);
            values.push(value);
          }
        }
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(id);

    const result = await query(
      `UPDATE cases SET ${setClause.join(
        ", "
      )} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error("Case not found");
    }

    logger.info(`Case updated: ${id}`);
    return this.mapDatabaseCase(result.rows[0]);
  }

  async deleteCase(id: string): Promise<void> {
    await query("DELETE FROM cases WHERE id = $1", [id]);
    logger.info(`Case deleted: ${id}`);
  }

  async getCaseStats(userId: string): Promise<any> {
    const result = await query(
      `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_cases,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_cases,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN status = 'Escalated' THEN 1 END) as escalated_cases,
        COUNT(CASE WHEN escalation_level = 'Urgent' THEN 1 END) as urgent_cases,
        COUNT(CASE WHEN submission_date > NOW() - INTERVAL '30 days' THEN 1 END) as recent_cases,
        AVG(ai_confidence) as avg_confidence,
        AVG(urgency_score) as avg_urgency
      FROM cases 
      WHERE user_id = $1
    `,
      [userId]
    );

    return result.rows[0];
  }

  async escalateCase(
    id: string,
    userId: string,
    escalationData: {
      reason: string;
      priority?: string;
      escalatedBy: string;
      escalatedAt: Date;
    }
  ): Promise<{
    case: Case;
    aiAnalysis: EscalationAnalysis;
    escalationApproved: boolean;
  }> {
    // First, get the current case data
    const currentCaseResult = await query(`SELECT * FROM cases WHERE id = $1`, [
      id,
    ]);

    if (currentCaseResult.rows.length === 0) {
      throw new Error("Case not found");
    }

    const currentCase = this.mapDatabaseCase(currentCaseResult.rows[0]);

    // Check if case is already escalated
    if (currentCase.status === "Escalated") {
      throw new Error("Case is already escalated");
    }

    // Check if case is closed
    if (currentCase.status === "Closed" || currentCase.status === "Completed") {
      throw new Error("Cannot escalate closed or completed case");
    }

    // Use AI to analyze if escalation is appropriate
    const aiService = new AIService();
    const aiAnalysis = await aiService.analyzeEscalation({
      title: currentCase.title,
      description: currentCase.description,
      currentPriority: currentCase.priority,
      currentStatus: currentCase.status,
      issueCategory: currentCase.issueCategory,
      jurisdiction: currentCase.jurisdiction,
      submissionDate: currentCase.submissionDate,
      userReason: escalationData.reason,
    });

    console.log("AI Analysis ", aiAnalysis);

    // Determine if escalation should proceed based on AI analysis
    let escalationApproved = false;
    let finalPriority = escalationData.priority || "High";
    let escalationNotes = escalationData.reason;

    if (aiAnalysis.shouldEscalate && aiAnalysis.confidence >= 0.6) {
      escalationApproved = true;
      finalPriority = aiAnalysis.suggestedPriority;
      escalationNotes += ` | AI Analysis: ${aiAnalysis.recommendation}`;
    } else if (aiAnalysis.shouldEscalate && aiAnalysis.confidence >= 0.4) {
      escalationApproved = true;
      escalationNotes += ` | AI Analysis (moderate confidence): ${aiAnalysis.recommendation}`;
    } else if (!aiAnalysis.shouldEscalate && aiAnalysis.confidence >= 0.7) {
      throw new Error(
        `AI analysis advises against escalation: ${
          aiAnalysis.recommendation
        }. Confidence: ${(aiAnalysis.confidence * 100).toFixed(1)}%`
      );
    } else {
      escalationApproved = true;
      escalationNotes += ` | AI Analysis (low confidence): Manual escalation approved despite AI recommendation. ${aiAnalysis.recommendation}`;
    }

    if (!escalationApproved) {
      throw new Error("Escalation not approved based on AI analysis");
    }

    // Determine escalation level based on priority
    let escalationLevel: string;
    switch (finalPriority) {
      case "Critical":
        escalationLevel = "Urgent";
        break;
      case "High":
        escalationLevel = "Priority";
        break;
      default:
        escalationLevel = "Basic";
    }

    // Prepare escalation metadata object
    const escalationMetadata = {
      reason: escalationNotes,
      priority: finalPriority,
      escalatedBy: escalationData.escalatedBy,
      escalatedAt: escalationData.escalatedAt.toISOString(),
      aiAnalysis: {
        shouldEscalate: aiAnalysis.shouldEscalate,
        confidence: aiAnalysis.confidence,
        reasons: aiAnalysis.reasons,
        suggestedPriority: aiAnalysis.suggestedPriority,
        urgencyScore: aiAnalysis.urgencyScore,
        riskFactors: aiAnalysis.riskFactors,
        recommendation: aiAnalysis.recommendation,
      },
    };

    // Get existing metadata and merge properly
    const existingMetadata = this.safeParseJSON(currentCase.metadata, {});
    const updatedMetadata = {
      ...existingMetadata,
      escalation: escalationMetadata, // This will replace any existing escalation data
    };

    // Update the case with proper JSONB handling
    const updateResult = await query(
      `UPDATE cases 
       SET 
         status = $1::varchar,
         priority = $2::varchar,
         escalation_level = $3::varchar,
         urgency_score = $4::integer,
         escalated_by = $5::uuid,
         escalated_at = $6::timestamp,
         updated_at = $6::timestamp,
         metadata = $7::jsonb
       WHERE id = $8::uuid
       RETURNING *`,
      [
        "Escalated", // $1 - status
        finalPriority, // $2 - priority
        escalationLevel, // $3 - escalation_level
        aiAnalysis.urgencyScore, // $4 - urgency_score
        escalationData.escalatedBy, // $5 - escalated_by
        escalationData.escalatedAt, // $6 - escalated_at & updated_at
        JSON.stringify(updatedMetadata), // $7 - properly merged metadata
        id, // $8 - case id
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error("Failed to update case");
    }

    // Create AI classification record
    await query(
      `INSERT INTO ai_classifications (
        case_id, input_text, issue_category, escalation_level, 
        confidence, urgency_score, suggested_actions, 
        model_used, created_at
      ) VALUES ($1::uuid, $2::text, $3::varchar, $4::varchar, $5::decimal, $6::integer, $7::jsonb, $8::varchar, $9::timestamp)`,
      [
        id,
        `Manual escalation analysis: ${escalationData.reason}`,
        currentCase.issueCategory,
        escalationLevel,
        aiAnalysis.confidence,
        aiAnalysis.urgencyScore,
        JSON.stringify(aiAnalysis.reasons),
        "gpt-4-escalation-analysis",
        new Date(),
      ]
    );

    const escalatedCase = this.mapDatabaseCase(updateResult.rows[0]);

    logger.info(
      `Case escalated: ${
        escalatedCase.caseRef
      } by user ${userId}. AI approved: ${escalationApproved}, Confidence: ${(
        aiAnalysis.confidence * 100
      ).toFixed(1)}%`
    );

    return {
      case: escalatedCase,
      aiAnalysis,
      escalationApproved,
    };
  }

  async getCasesByStatus(status: string, limit: number = 50): Promise<Case[]> {
    const result = await query(
      "SELECT * FROM cases WHERE status = $1 ORDER BY submission_date DESC LIMIT $2",
      [status, limit]
    );

    return result.rows.map((row) => this.mapDatabaseCase(row));
  }

  async searchCases(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      `
      SELECT COUNT(*) FROM cases 
      WHERE user_id = $1 AND (
        description ILIKE $2 OR 
        client_name ILIKE $2 OR 
        case_ref ILIKE $2 OR
        issue_category ILIKE $2
      )
    `,
      [userId, `%${searchTerm}%`]
    );

    const casesResult = await query(
      `
      SELECT * FROM cases 
      WHERE user_id = $1 AND (
        description ILIKE $2 OR 
        client_name ILIKE $2 OR 
        case_ref ILIKE $2 OR
        issue_category ILIKE $2
      )
      ORDER BY submission_date DESC 
      LIMIT $3 OFFSET $4
    `,
      [userId, `%${searchTerm}%`, limit, offset]
    );

    return {
      cases: casesResult.rows.map((row) => this.mapDatabaseCase(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }

  public mapDatabaseCase(dbCase: any): Case {
    console.log("DB Case: ", dbCase);
    return {
      id: dbCase.id,
      caseRef: dbCase.case_ref,
      title: dbCase.title,
      userId: dbCase.user_id,
      clientName: dbCase.client_name,
      description: dbCase.description,
      jurisdiction: dbCase.jurisdiction,
      issueCategory: dbCase.issue_category,
      escalationLevel: dbCase.escalation_level,
      aiConfidence: parseFloat(dbCase.ai_confidence),
      status: dbCase.status,
      priority: dbCase.priority,
      urgencyScore: dbCase.urgency_score,
      ethTxHash: dbCase.eth_tx_hash,
      ceFileStatus: dbCase.ce_file_status,
      submissionDate: dbCase.submission_date,
      updatedAt: dbCase.updated_at,
      createdAt: dbCase.created_at,
      attachments: this.safeParseJSON(dbCase.attachments, []),
      metadata: this.safeParseJSON(dbCase.metadata, {}),
      suggestedActions: this.safeParseJSON(dbCase.suggested_actions, []),
    };
  }

  // Utility method to add attachment to existing case
  async addAttachment(caseId: string, attachment: any): Promise<Case> {
    const currentCase = await this.getCaseById(caseId, ""); // Get current case
    if (!currentCase) {
      throw new Error("Case not found");
    }

    const existingAttachments = this.safeParseJSON(currentCase.attachments, {});
    const updatedAttachments = { ...existingAttachments, ...attachment };

    return this.updateCase(caseId, { attachments: updatedAttachments });
  }

  // Utility method to update metadata without overwriting
  async updateMetadata(caseId: string, newMetadata: any): Promise<Case> {
    const currentCase = await this.getCaseById(caseId, ""); // Get current case
    if (!currentCase) {
      throw new Error("Case not found");
    }

    const existingMetadata = this.safeParseJSON(currentCase.metadata, {});
    const updatedMetadata = { ...existingMetadata, ...newMetadata };

    return this.updateCase(caseId, { metadata: updatedMetadata });
  }

  // Utility method to add suggested action
  async addSuggestedAction(caseId: string, action: string): Promise<Case> {
    const currentCase = await this.getCaseById(caseId, ""); // Get current case
    if (!currentCase) {
      throw new Error("Case not found");
    }

    const existingActions = this.safeParseJSON(
      currentCase.suggestedActions,
      []
    );
    const updatedActions = [...existingActions, action];

    return this.updateCase(caseId, { suggestedActions: updatedActions });
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private mergeJsonbObjects(existing: any, newData: any): string {
    const existingObj = this.safeParseJSON(existing, {});
    const newObj = this.safeParseJSON(newData, {});

    // Deep merge objects
    const merged = { ...existingObj, ...newObj };
    return JSON.stringify(merged);
  }

  // Helper method to safely append to JSONB arrays
  private appendToJsonbArray(existing: any, newItems: any[]): string {
    const existingArray = this.safeParseJSON(existing, []);
    const newArray = Array.isArray(newItems) ? newItems : [newItems];

    return JSON.stringify([...existingArray, ...newArray]);
  }
}
