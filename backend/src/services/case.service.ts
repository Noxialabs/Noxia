import { query } from "../database/connection";
import {
  Case,
  DashboardFilters,
  EscalationAnalysis,
  UserProfile,
} from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";
import { AIService } from "./ai.service";
import { filter } from "compression";

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
      search?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ cases: Case[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = "";
    const values: any[] = [];
    let paramIndex = 1;
    let hasWhere = false;
    console.log("Filters : ", filters);

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

    // Apply search filter across multiple fields
    if (filters.search && filters.search.trim()) {
      const searchCondition = `(
        LOWER(case_ref) LIKE LOWER($${paramIndex}) OR 
        CAST(id AS TEXT) LIKE LOWER($${paramIndex}) OR 
        LOWER(title) LIKE LOWER($${paramIndex}) OR 
        LOWER(issue_category) LIKE LOWER($${paramIndex}) OR 
        LOWER(client_name) LIKE LOWER($${paramIndex})
      )`;

      whereClause += hasWhere
        ? ` AND ${searchCondition}`
        : `WHERE ${searchCondition}`;

      values.push(`%${filters.search.trim()}%`);
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

  async getCaseById(id: string): Promise<Case | null> {
    const result = await query("SELECT * FROM cases WHERE id = $1", [id]);

    return result.rows.length > 0 ? this.mapDatabaseCase(result.rows[0]) : null;
  }

  async getCaseWithDetails(caseId: string): Promise<Case | null> {
    try {
      const caseResult = await query("SELECT * FROM cases WHERE id = $1", [
        caseId,
      ]);

      if (caseResult.rows.length === 0) {
        return null;
      }

      const baseCase = this.mapDatabaseCase(caseResult.rows[0]);
      let userProfile: UserProfile | undefined;
      if (baseCase.userId) {
        userProfile = await this.getUserProfile(baseCase.userId);
      }

      return {
        ...baseCase,
        user: userProfile,
      };
    } catch (error) {
      console.error("Error fetching case with details:", error);
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    try {
      const userResult = await query(
        `
         SELECT 
           u.*,
           COUNT(DISTINCT c1.id) as cases_submitted,
           COUNT(DISTINCT CASE WHEN c2.status IN ('Completed', 'Resolved') THEN c2.id END) as cases_resolved,
           COALESCE(ur.reputation_score, 50) as reputation
         FROM users u
         LEFT JOIN cases c1 ON u.id = c1.user_id
         LEFT JOIN cases c2 ON u.id = c2.user_id
         LEFT JOIN user_reputation ur ON u.id = ur.user_id
         WHERE u.id = $1
         GROUP BY u.id, ur.reputation_score
       `,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return undefined;
      }

      const user = userResult.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        joinedAt: user.created_at,
        casesSubmitted: parseInt(user.cases_submitted),
        casesResolved: parseInt(user.cases_resolved),
        reputation: parseInt(user.reputation),
        verified: user.email_verified || false,
        lastLoginAt: user.last_login_at,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return undefined;
    }
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
    `
    );

    return result.rows[0];
  }

  async getDashboardStats(
    userId: string,
    filters: DashboardFilters = {}
  ): Promise<any> {
    const {
      dateRange = "30d",
      startDate,
      endDate,
      status,
      urgencyLevel,
    } = filters;

    // Define intervals mapping at the top of the function so it's accessible everywhere
    const intervals: Record<string, string> = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "1y": "1 year",
    };

    // Build date filter condition
    let dateCondition = "";
    if (startDate && endDate) {
      dateCondition = `AND submission_date BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      dateCondition = `AND submission_date >= NOW() - INTERVAL '${intervals[dateRange]}'`;
    }

    // Build additional filters
    let statusCondition = "";
    if (status && status.length > 0) {
      const statusList = status.map((s) => `'${s}'`).join(",");
      statusCondition = `AND status IN (${statusList})`;
    }

    let urgencyCondition = "";
    if (urgencyLevel && urgencyLevel.length > 0) {
      const urgencyList = urgencyLevel.map((u) => `'${u}'`).join(",");
      urgencyCondition = `AND escalation_level IN (${urgencyList})`;
    }

    // Main stats query
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_cases,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_cases,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_cases,
        COUNT(CASE WHEN status = 'Escalated' THEN 1 END) as escalated_cases,
        COUNT(CASE WHEN escalation_level = 'Urgent' THEN 1 END) as urgent_cases,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_cases,
        AVG(CASE WHEN ai_confidence IS NOT NULL THEN ai_confidence END) as avg_confidence,
        AVG(CASE WHEN urgency_score IS NOT NULL THEN urgency_score END) as avg_urgency,
        
        -- Previous period comparison (for trend calculation)
        (SELECT COUNT(*) FROM cases 
         WHERE submission_date >= NOW() - INTERVAL '${intervals[dateRange]}' * 2 
         AND submission_date < NOW() - INTERVAL '${intervals[dateRange]}'
         ${statusCondition} ${urgencyCondition}) as prev_period_total,
         
        -- Recent activity (last 7 days)
        COUNT(CASE WHEN submission_date >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_cases
        
      FROM cases 
      WHERE 1=1 ${dateCondition} ${statusCondition} ${urgencyCondition}
    `;

    const stats = await query(statsQuery);
    const mainStats = stats.rows[0];

    // Get trend data for charts
    const trendData = await this.getCaseTrendData(userId, filters);

    // Get status distribution
    const statusDistribution = await this.getStatusDistribution(
      userId,
      filters
    );

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId, filters);

    // Get priority distribution
    const priorityDistribution = await this.getPriorityDistribution(
      userId,
      filters
    );

    // Get monthly trends
    const monthlyTrends = await this.getMonthlyTrends(userId, filters);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalChange = calculateChange(
      parseInt(mainStats.total_cases),
      parseInt(mainStats.prev_period_total || "0")
    );

    return {
      stats: {
        total_cases: mainStats.total_cases,
        pending_cases: mainStats.pending_cases,
        in_progress_cases: mainStats.in_progress_cases,
        completed_cases: mainStats.completed_cases,
        escalated_cases: mainStats.escalated_cases,
        urgent_cases: mainStats.urgent_cases,
        resolved_cases: mainStats.resolved_cases,
        recent_cases: mainStats.recent_cases,
        avg_confidence: mainStats.avg_confidence
          ? parseFloat(mainStats.avg_confidence).toFixed(1)
          : null,
        avg_urgency: mainStats.avg_urgency
          ? parseFloat(mainStats.avg_urgency).toFixed(1)
          : null,
        total_change: totalChange,
      },

      trendData,
      statusDistribution,
      priorityDistribution,
      monthlyTrends,
      recentActivity,
      filters: {
        dateRange,
        startDate,
        endDate,
        status,
        urgencyLevel,
      },
    };
  }

  /**
   * Get daily trend data for line charts
   */
  async getCaseTrendData(
    userId: string,
    filters: DashboardFilters
  ): Promise<any[]> {
    const { dateRange = "30d" } = filters;

    const intervals = {
      "7d": { days: 7, groupBy: "DATE(submission_date)", format: "Mon" },
      "30d": { days: 30, groupBy: "DATE(submission_date)", format: "DD/MM" },
      "90d": {
        days: 90,
        groupBy: "DATE_TRUNC('week', submission_date)",
        format: "Week",
      },
      "1y": {
        days: 365,
        groupBy: "DATE_TRUNC('month', submission_date)",
        format: "Month",
      },
    };

    const config = intervals[dateRange];

    const trendQuery = `
      SELECT 
        ${config.groupBy} as date_group,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Completed' OR status = 'Resolved' THEN 1 END) as resolved_cases,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_cases,
        COUNT(CASE WHEN escalation_level = 'Urgent' THEN 1 END) as urgent_cases
      FROM cases 
      WHERE submission_date >= NOW() - INTERVAL '${config.days} days'
      GROUP BY ${config.groupBy}
      ORDER BY date_group
    `;

    const result = await query(trendQuery);

    return result.rows.map((row, index) => ({
      name:
        dateRange === "7d"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ||
            `Day ${index + 1}`
          : dateRange === "30d"
          ? new Date(row.date_group).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : new Date(row.date_group).toLocaleDateString("en-US", {
              month: "short",
            }),
      cases: parseInt(row.total_cases),
      resolved: parseInt(row.resolved_cases),
      pending: parseInt(row.pending_cases),
      urgent: parseInt(row.urgent_cases),
      date: row.date_group,
    }));
  }

  /**
   * Get status distribution for pie charts
   */
  async getStatusDistribution(
    userId: string,
    filters: DashboardFilters
  ): Promise<any[]> {
    const { dateRange = "30d" } = filters;

    const query_text = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) as percentage
      FROM cases 
      WHERE submission_date >= NOW() - INTERVAL '${
        dateRange === "7d"
          ? "7"
          : dateRange === "30d"
          ? "30"
          : dateRange === "90d"
          ? "90"
          : "365"
      } days'
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await query(query_text);

    const colors = {
      Pending: "#f59e0b",
      "In Progress": "#3b82f6",
      Completed: "#10b981",
      Escalated: "#ef4444",
      Resolved: "#059669",
      Cancelled: "#6b7280",
    };

    return result.rows.map((row) => ({
      name: row.status,
      value: parseInt(row.count),
      percentage: parseFloat(row.percentage),
      color: colors[row.status] || "#6b7280",
    }));
  }

  /**
   * Get priority/urgency distribution
   */
  async getPriorityDistribution(
    userId: string,
    filters: DashboardFilters
  ): Promise<any[]> {
    const { dateRange = "30d" } = filters;

    // Method 1: Include the CASE expression in GROUP BY
    const query_text = `
    SELECT 
      CASE 
        WHEN urgency_score >= 8 THEN 'Critical'
        WHEN urgency_score >= 6 THEN 'High'
        WHEN urgency_score >= 4 THEN 'Medium'
        ELSE 'Low'
      END as priority,
      COUNT(*) as count
    FROM cases 
    WHERE submission_date >= NOW() - INTERVAL '${
      dateRange === "7d"
        ? "7"
        : dateRange === "30d"
        ? "30"
        : dateRange === "90d"
        ? "90"
        : "365"
    } days'
    AND urgency_score IS NOT NULL
    GROUP BY 
      CASE 
        WHEN urgency_score >= 8 THEN 'Critical'
        WHEN urgency_score >= 6 THEN 'High'
        WHEN urgency_score >= 4 THEN 'Medium'
        ELSE 'Low'
      END
    ORDER BY 
      CASE 
        CASE 
          WHEN urgency_score >= 8 THEN 'Critical'
          WHEN urgency_score >= 6 THEN 'High'
          WHEN urgency_score >= 4 THEN 'Medium'
          ELSE 'Low'
        END
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
      END
  `;

    const result = await query(query_text);

    const colors = {
      Critical: "#dc2626",
      High: "#ea580c",
      Medium: "#d97706",
      Low: "#65a30d",
    };

    return result.rows.map((row) => ({
      name: row.priority,
      value: parseInt(row.count),
      color: colors[row.priority],
    }));
  }

  /**
   * Get monthly trends for the year
   */
  async getMonthlyTrends(
    userId: string,
    filters: DashboardFilters
  ): Promise<any[]> {
    const query_text = `
      SELECT 
        DATE_TRUNC('month', submission_date) as month,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Completed' OR status = 'Resolved' THEN 1 END) as resolved_cases,
        AVG(CASE WHEN ai_confidence IS NOT NULL THEN ai_confidence END) as avg_confidence
      FROM cases 
      WHERE submission_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submission_date)
      ORDER BY month
    `;

    const result = await query(query_text);

    return result.rows.map((row) => ({
      month: new Date(row.month).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      total_cases: parseInt(row.total_cases),
      resolved_cases: parseInt(row.resolved_cases),
      avg_confidence: row.avg_confidence
        ? parseFloat(row.avg_confidence).toFixed(1)
        : null,
      resolution_rate:
        row.total_cases > 0
          ? Math.round((row.resolved_cases / row.total_cases) * 100)
          : 0,
    }));
  }

  /**
   * Get recent activity for activity feed
   */
  async getRecentActivity(
    userId: string,
    filters: DashboardFilters
  ): Promise<any[]> {
    const query_text = `
      SELECT 
        id,
        case_ref,
        title,
        status,
        escalation_level,
        submission_date,
        updated_at,
        CASE 
          WHEN updated_at > submission_date THEN 'updated'
          ELSE 'submitted'
        END as action_type
      FROM cases 
      WHERE submission_date >= NOW() - INTERVAL '7 days'
      ORDER BY COALESCE(updated_at, submission_date) DESC
      LIMIT 10
    `;

    const result = await query(query_text);

    return result.rows.map((row) => ({
      id: row.id,
      case_ref: row.case_ref,
      title: row.title,
      status: row.status,
      escalation_level: row.escalation_level,
      action_type: row.action_type,
      timestamp: row.updated_at || row.submission_date,
      time_ago: this.getTimeAgo(
        new Date(row.updated_at || row.submission_date)
      ),
    }));
  }

  /**
   * Helper function to calculate time ago
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes || 1} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(userId: string): Promise<any> {
    const statusQuery = `SELECT DISTINCT status FROM cases WHERE status IS NOT NULL ORDER BY status`;
    const urgencyQuery = `SELECT DISTINCT escalation_level FROM cases WHERE escalation_level IS NOT NULL ORDER BY escalation_level`;

    const [statusResult, urgencyResult] = await Promise.all([
      query(statusQuery),
      query(urgencyQuery),
    ]);

    return {
      statuses: statusResult.rows.map((row) => row.status),
      urgencyLevels: urgencyResult.rows.map((row) => row.escalation_level),
      dateRanges: [
        { label: "7 Days", value: "7d" },
        { label: "30 Days", value: "30d" },
        { label: "90 Days", value: "90d" },
        { label: "1 Year", value: "1y" },
      ],
    };
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
    const currentCase = await this.getCaseById(caseId); // Get current case
    if (!currentCase) {
      throw new Error("Case not found");
    }

    const existingAttachments = this.safeParseJSON(currentCase.attachments, {});
    const updatedAttachments = { ...existingAttachments, ...attachment };

    return this.updateCase(caseId, { attachments: updatedAttachments });
  }

  // Utility method to update metadata without overwriting
  async updateMetadata(caseId: string, newMetadata: any): Promise<Case> {
    const currentCase = await this.getCaseById(caseId); // Get current case
    if (!currentCase) {
      throw new Error("Case not found");
    }

    const existingMetadata = this.safeParseJSON(currentCase.metadata, {});
    const updatedMetadata = { ...existingMetadata, ...newMetadata };

    return this.updateCase(caseId, { metadata: updatedMetadata });
  }

  // Utility method to add suggested action
  async addSuggestedAction(caseId: string, action: string): Promise<Case> {
    const currentCase = await this.getCaseById(caseId); // Get current case
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
