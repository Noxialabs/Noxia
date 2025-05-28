import { query } from '../database/connection';
import { Case } from '../types';
import { logger } from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';

export class CaseService {
  async createCase(caseData: {
    caseRef: string;
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
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO cases (
        id, case_ref, user_id, client_name, description, jurisdiction,
        issue_category, escalation_level, ai_confidence, urgency_score,
        suggested_actions, status, priority, attachments, metadata,
        submission_date, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        id,
        caseData.caseRef,
        caseData.userId,
        caseData.clientName,
        caseData.description,
        caseData.jurisdiction || null,
        caseData.issueCategory,
        caseData.escalationLevel,
        caseData.aiConfidence,
        caseData.urgencyScore,
        JSON.stringify(caseData.suggestedActions || []),
        caseData.status || 'Pending',
        caseData.priority || 'Normal',
        JSON.stringify(caseData.attachments || {}),
        JSON.stringify(caseData.metadata || {}),
        now,
        now
      ]
    );

    logger.info(`Case created: ${caseData.caseRef}`);
    return this.mapDatabaseCase(result.rows[0]);
  }

  async getCases(
    filters: {
      userId: string;
      status?: string;
      priority?: string;
      escalationLevel?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = $1';
    const values: any[] = [filters.userId];
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
      cases: casesResult.rows.map(row => this.mapDatabaseCase(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  async getCaseById(id: string, userId: string): Promise<Case | null> {
    const result = await query(
      'SELECT * FROM cases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return result.rows.length > 0 ? this.mapDatabaseCase(result.rows[0]) : null;
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        if (dbField === 'suggested_actions' || dbField === 'attachments' || dbField === 'metadata') {
          setClause.push(`${dbField} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${dbField} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    setClause.push(`last_updated = $${paramIndex}`);
    values.push(new Date());
    values.push(id);

    const result = await query(
      `UPDATE cases SET ${setClause.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Case not found');
    }

    logger.info(`Case updated: ${id}`);
    return this.mapDatabaseCase(result.rows[0]);
  }

  async deleteCase(id: string): Promise<void> {
    await query('DELETE FROM cases WHERE id = $1', [id]);
    logger.info(`Case deleted: ${id}`);
  }

  async getCaseStats(userId: string): Promise<any> {
    const result = await query(`
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
    `, [userId]);

    return result.rows[0];
  }

  async escalateCase(
    id: string,
    userId: string,
    escalationData: {
      reason: string;
      priority: string;
      escalatedBy: string;
      escalatedAt: Date;
    }
  ): Promise<Case> {
    const result = await query(
      `UPDATE cases 
       SET status = 'Escalated', priority = $1, last_updated = $2,
           metadata = COALESCE(metadata, '{}')::jsonb || $3::jsonb
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [
        escalationData.priority,
        new Date(),
        JSON.stringify({
          escalation: escalationData
        }),
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Case not found');
    }

    return this.mapDatabaseCase(result.rows[0]);
  }

  async getCasesByStatus(status: string, limit: number = 50): Promise<Case[]> {
    const result = await query(
      'SELECT * FROM cases WHERE status = $1 ORDER BY submission_date DESC LIMIT $2',
      [status, limit]
    );

    return result.rows.map(row => this.mapDatabaseCase(row));
  }

  async searchCases(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await query(`
      SELECT COUNT(*) FROM cases 
      WHERE user_id = $1 AND (
        description ILIKE $2 OR 
        client_name ILIKE $2 OR 
        case_ref ILIKE $2 OR
        issue_category ILIKE $2
      )
    `, [userId, `%${searchTerm}%`]);

    const casesResult = await query(`
      SELECT * FROM cases 
      WHERE user_id = $1 AND (
        description ILIKE $2 OR 
        client_name ILIKE $2 OR 
        case_ref ILIKE $2 OR
        issue_category ILIKE $2
      )
      ORDER BY submission_date DESC 
      LIMIT $3 OFFSET $4
    `, [userId, `%${searchTerm}%`, limit, offset]);

    return {
      cases: casesResult.rows.map(row => this.mapDatabaseCase(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  private mapDatabaseCase(dbCase: any): Case {
    return {
      id: dbCase.id,
      caseRef: dbCase.case_ref,
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
      lastUpdated: dbCase.last_updated,
      attachments: dbCase.attachments ? JSON.parse(dbCase.attachments) : null,
      metadata: dbCase.metadata ? JSON.parse(dbCase.metadata) : null,
      suggestedActions: dbCase.suggested_actions ? JSON.parse(dbCase.suggested_actions) : []
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}