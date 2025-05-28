export { UserModel } from './User.model';
export { CaseModel } from './Case.model';
export { DocumentModel } from './Document.model';
export { TierModel } from './Tier.model';

// Re-export types for convenience
export type {
  User,
  Case,
  Document,
  UserTier,
  APIResponse,
  PaginatedResponse
} from '../types';

// Model utilities and helpers
export class ModelUtils {
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sanitizeSearchTerm(term: string): string {
    // Remove SQL injection attempts and sanitize search term
    return term.replace(/[%_\\]/g, '\\        COUNT(CASE WHEN d.created_at > NOW() -').trim();
  }

  static buildPaginationInfo(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      offset: (page - 1) * limit
    };
  }

  static validatePaginationParams(page: any, limit: any): { page: number; limit: number } {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
    
    return { page: validPage, limit: validLimit };
  }

  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidEthAddress(address: string): boolean {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  }

  static generateCaseRef(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `999P-${timestamp}-${random}`;
  }

  static calculateConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  }

  static determineUrgencyLevel(urgencyScore: number): string {
    if (urgencyScore >= 9) return 'Critical';
    if (urgencyScore >= 7) return 'High';
    if (urgencyScore >= 5) return 'Medium';
    if (urgencyScore >= 3) return 'Low';
    return 'Minimal';
  }

  static maskSensitiveData(data: any, fields: string[] = ['password', 'passwordHash', 'token']): any {
    const masked = { ...data };
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    });
    return masked;
  }

  static buildFilterQuery(
    baseWhere: string,
    filters: Record<string, any>,
    startParamIndex: number = 1
  ): { whereClause: string; values: any[]; nextParamIndex: number } {
    let whereClause = baseWhere;
    const values: any[] = [];
    let paramIndex = startParamIndex;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const dbField = this.camelToSnake(key);
        whereClause += ` AND ${dbField} = ${paramIndex}`;
        values.push(value);
        paramIndex++;
      }
    }

    return { whereClause, values, nextParamIndex: paramIndex };
  }

  static parseJsonField(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  static stringifyJsonField(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value?.toString() || '';
  }
}

// Database query builder helper
export class QueryBuilder {
  private selectClause: string = '';
  private fromClause: string = '';
  private whereClause: string = '';
  private joinClause: string = '';
  private orderClause: string = '';
  private limitClause: string = '';
  private values: any[] = [];
  private paramIndex: number = 1;

  static create(): QueryBuilder {
    return new QueryBuilder();
  }

  select(fields: string | string[]): QueryBuilder {
    this.selectClause = Array.isArray(fields) ? fields.join(', ') : fields;
    return this;
  }

  from(table: string, alias?: string): QueryBuilder {
    this.fromClause = alias ? `${table} ${alias}` : table;
    return this;
  }

  where(condition: string, value?: any): QueryBuilder {
    const connector = this.whereClause ? ' AND ' : '';
    
    if (value !== undefined) {
      this.whereClause += `${connector}${condition.replace('?', `${this.paramIndex}`)}`;
      this.values.push(value);
      this.paramIndex++;
    } else {
      this.whereClause += `${connector}${condition}`;
    }
    
    return this;
  }

  leftJoin(table: string, condition: string, alias?: string): QueryBuilder {
    const tableWithAlias = alias ? `${table} ${alias}` : table;
    this.joinClause += ` LEFT JOIN ${tableWithAlias} ON ${condition}`;
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    const connector = this.orderClause ? ', ' : '';
    this.orderClause += `${connector}${field} ${direction}`;
    return this;
  }

  limit(count: number, offset?: number): QueryBuilder {
    this.limitClause = `LIMIT ${this.paramIndex}`;
    this.values.push(count);
    this.paramIndex++;
    
    if (offset !== undefined) {
      this.limitClause += ` OFFSET ${this.paramIndex}`;
      this.values.push(offset);
      this.paramIndex++;
    }
    
    return this;
  }

  build(): { query: string; values: any[] } {
    let query = `SELECT ${this.selectClause || '*'}`;
    query += ` FROM ${this.fromClause}`;
    
    if (this.joinClause) query += this.joinClause;
    if (this.whereClause) query += ` WHERE ${this.whereClause}`;
    if (this.orderClause) query += ` ORDER BY ${this.orderClause}`;
    if (this.limitClause) query += ` ${this.limitClause}`;

    return { query, values: this.values };
  }
}