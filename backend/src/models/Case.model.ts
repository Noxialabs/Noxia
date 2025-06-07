import { query } from "../database/connection";
import { Case } from "../types";
import { logger } from "../utils/logger.utils";

export class CaseModel {
  static async create(caseData: {
    id: string;
    caseRef: string;
    title: string;
    userId: string;
    clientName: string;
    description: string;
    jurisdiction?: string;
    issueCategory: string;
    escalationLevel: string;
    aiConfidence: number;
    urgencyScore: number;
    suggestedActions?: string[];
    status?: string;
    priority?: string;
    attachments?: any;
    metadata?: any;
  }): Promise<Case> {
    const now = new Date();

    const result = await query(
      `INSERT INTO cases (
        id, case_ref,title, user_id, client_name, description, jurisdiction,
        issue_category, escalation_level, ai_confidence, urgency_score,
        suggested_actions, status, priority, attachments, metadata,
        submission_date, created_at,updated_at, ce_file_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,$19)
      RETURNING *`,
      [
        caseData.id,
        caseData.caseRef,
        caseData.title,
        caseData.userId,
        caseData.clientName,
        caseData.description,
        caseData.jurisdiction || null,
        caseData.issueCategory,
        caseData.escalationLevel,
        caseData.aiConfidence,
        caseData.urgencyScore,
        JSON.stringify(caseData.suggestedActions || []),
        caseData.status || "Pending",
        caseData.priority || "Normal",
        JSON.stringify(caseData.attachments || {}),
        JSON.stringify(caseData.metadata || {}),
        now,
        now,
        now,
        "Pending",
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  static async findById(id: string): Promise<Case | null> {
    const result = await query("SELECT * FROM cases WHERE id = $1", [id]);

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByUserId(
    userId: string,
    filters: {
      status?: string;
      priority?: string;
      escalationLevel?: string;
      issueCategory?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE user_id = $1";
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      whereClause += ` AND priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.escalationLevel) {
      whereClause += ` AND escalation_level = $${paramIndex}`;
      values.push(filters.escalationLevel);
      paramIndex++;
    }

    if (filters.issueCategory) {
      whereClause += ` AND issue_category = $${paramIndex}`;
      values.push(filters.issueCategory);
      paramIndex++;
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
      cases: casesResult.rows.map((row) => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }

  static async findByCaseRef(caseRef: string): Promise<Case | null> {
    const result = await query("SELECT * FROM cases WHERE case_ref = $1", [
      caseRef,
    ]);

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async update(
    id: string,
    updates: Partial<Case>
  ): Promise<Case | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== "id" && key !== "submissionDate") {
        const dbField = this.camelToSnake(key);
        if (
          dbField === "suggested_actions" ||
          dbField === "attachments" ||
          dbField === "metadata"
        ) {
          setClause.push(`${dbField} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${dbField} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return await this.findById(id);
    }

    setClause.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    values.push(id);

    const result = await query(
      `UPDATE cases SET ${setClause.join(", ")} WHERE id = $${
        paramIndex + 1
      } RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM cases WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  static async findByStatus(
    status: string,
    limit: number = 50
  ): Promise<Case[]> {
    const result = await query(
      "SELECT * FROM cases WHERE status = $1 ORDER BY submission_date DESC LIMIT $2",
      [status, limit]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  static async findUrgentCases(limit: number = 20): Promise<Case[]> {
    const result = await query(
      `SELECT * FROM cases 
       WHERE escalation_level = 'Urgent' OR urgency_score >= 8
       ORDER BY urgency_score DESC, submission_date DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  static async searchCases(
    searchTerm: string,
    userId?: string,
    filters: {
      status?: string;
      priority?: string;
      escalationLevel?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE (
      description ILIKE $1 OR 
      client_name ILIKE $1 OR 
      case_ref ILIKE $1 OR
      issue_category ILIKE $1
    )`;
    const values: any[] = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      values.push(userId);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      whereClause += ` AND priority = $${paramIndex}`;
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.escalationLevel) {
      whereClause += ` AND escalation_level = $${paramIndex}`;
      values.push(filters.escalationLevel);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM cases ${whereClause}`,
      values
    );

    const casesResult = await query(
      `SELECT * FROM cases ${whereClause}
       ORDER BY submission_date DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      cases: casesResult.rows.map((row) => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count),
    };
  }

  static async getCaseStats(userId?: string): Promise<any> {
    let whereClause = "";
    const values: any[] = [];

    if (userId) {
      whereClause = "WHERE user_id = $1";
      values.push(userId);
    }

    const result = await query(
      `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_cases,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_cases,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN status = 'Escalated' THEN 1 END) as escalated_cases,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_cases,
        COUNT(CASE WHEN escalation_level = 'Urgent' THEN 1 END) as urgent_cases,
        COUNT(CASE WHEN escalation_level = 'Priority' THEN 1 END) as priority_cases,
        COUNT(CASE WHEN escalation_level = 'Basic' THEN 1 END) as basic_cases,
        COUNT(CASE WHEN submission_date > NOW() - INTERVAL '30 days' THEN 1 END) as recent_cases,
        COUNT(CASE WHEN urgency_score >= 8 THEN 1 END) as high_urgency_cases,
        AVG(ai_confidence) as avg_confidence,
        AVG(urgency_score) as avg_urgency
      FROM cases ${whereClause}
    `,
      values
    );

    // Get issue category breakdown
    const categoryResult = await query(
      `
      SELECT issue_category, COUNT(*) as count
      FROM cases ${whereClause}
      GROUP BY issue_category
      ORDER BY count DESC
    `,
      values
    );

    return {
      totalCases: parseInt(result.rows[0].total_cases),
      statusBreakdown: {
        pending: parseInt(result.rows[0].pending_cases),
        inProgress: parseInt(result.rows[0].in_progress_cases),
        completed: parseInt(result.rows[0].completed_cases),
        escalated: parseInt(result.rows[0].escalated_cases),
        closed: parseInt(result.rows[0].closed_cases),
      },
      escalationBreakdown: {
        urgent: parseInt(result.rows[0].urgent_cases),
        priority: parseInt(result.rows[0].priority_cases),
        basic: parseInt(result.rows[0].basic_cases),
      },
      recentCases: parseInt(result.rows[0].recent_cases),
      highUrgencyCases: parseInt(result.rows[0].high_urgency_cases),
      avgConfidence: parseFloat(result.rows[0].avg_confidence || "0"),
      avgUrgency: parseFloat(result.rows[0].avg_urgency || "0"),
      categoryBreakdown: categoryResult.rows.map((row) => ({
        category: row.issue_category,
        count: parseInt(row.count),
      })),
    };
  }

  static async findExpiredCases(
    daysSinceSubmission: number = 30
  ): Promise<Case[]> {
    const result = await query(
      `SELECT * FROM cases 
       WHERE status IN ('Pending', 'In Progress') 
       AND submission_date < NOW() - INTERVAL '${daysSinceSubmission} days'
       ORDER BY submission_date ASC`,
      []
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  private static mapRow(row: any): Case {
    return {
      id: row.id,
      title: row.title,
      caseRef: row.case_ref,
      userId: row.user_id,
      clientName: row.client_name,
      description: row.description,
      jurisdiction: row.jurisdiction,
      issueCategory: row.issue_category,
      escalationLevel: row.escalation_level,
      aiConfidence: parseFloat(row.ai_confidence),
      status: row.status,
      priority: row.priority,
      urgencyScore: row.urgency_score,
      ethTxHash: row.eth_tx_hash,
      ceFileStatus: row.ce_file_status,
      submissionDate: row.submission_date,
      closedAt: row.closed_at,
      closureReason: row.closure_reason,
      assignedTo: row.assigned_to,
      closedBy: row.closed_by,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      attachments: row.attachments ? JSON.parse(row.attachments) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      suggestedActions: row.suggested_actions
        ? JSON.parse(row.suggested_actions)
        : [],
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
