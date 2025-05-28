import { query } from '../database/connection';
import { Document } from '../types';
import { logger } from '../utils/logger.utils';

export class DocumentModel {
  static async create(documentData: {
    id: string;
    caseId?: string;
    documentType: string;
    fileName: string;
    filePath: string;
    fileHash: string;
    blockchainTxHash?: string;
    qrCodePath?: string;
    status?: string;
  }): Promise<Document> {
    const result = await query(
      `INSERT INTO documents (
        id, case_id, document_type, file_name, file_path, 
        file_hash, blockchain_tx_hash, qr_code_path, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        documentData.id,
        documentData.caseId || null,
        documentData.documentType,
        documentData.fileName,
        documentData.filePath,
        documentData.fileHash,
        documentData.blockchainTxHash || null,
        documentData.qrCodePath || null,
        documentData.status || 'Generated',
        new Date()
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  static async findById(id: string): Promise<Document | null> {
    const result = await query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByCaseId(
    caseId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM documents WHERE case_id = $1',
      [caseId]
    );

    const documentsResult = await query(
      'SELECT * FROM documents WHERE case_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [caseId, limit, offset]
    );

    return {
      documents: documentsResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findByUserId(
    userId: string,
    filters: {
      documentType?: string;
      status?: string;
      caseId?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE c.user_id = $1`;
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters.documentType) {
      whereClause += ` AND d.document_type = $${paramIndex}`;
      values.push(filters.documentType);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.caseId) {
      whereClause += ` AND d.case_id = $${paramIndex}`;
      values.push(filters.caseId);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}`,
      values
    );

    const documentsResult = await query(
      `SELECT d.* FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      documents: documentsResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findByHash(fileHash: string): Promise<Document | null> {
    const result = await query(
      'SELECT * FROM documents WHERE file_hash = $1',
      [fileHash]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByType(
    documentType: string,
    limit: number = 50
  ): Promise<Document[]> {
    const result = await query(
      'SELECT * FROM documents WHERE document_type = $1 ORDER BY created_at DESC LIMIT $2',
      [documentType, limit]
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async update(id: string, updates: Partial<Document>): Promise<Document | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbField = this.camelToSnake(key);
        setClause.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE documents SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM documents WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async searchDocuments(
    searchTerm: string,
    userId?: string,
    filters: {
      documentType?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: Document[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE (d.file_name ILIKE $1 OR d.document_type ILIKE $1)`;
    const values: any[] = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (userId) {
      whereClause += ` AND c.user_id = $${paramIndex}`;
      values.push(userId);
      paramIndex++;
    }

    if (filters.documentType) {
      whereClause += ` AND d.document_type = $${paramIndex}`;
      values.push(filters.documentType);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.dateFrom) {
      whereClause += ` AND d.created_at >= $${paramIndex}`;
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      whereClause += ` AND d.created_at <= $${paramIndex}`;
      values.push(filters.dateTo);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}`,
      values
    );

    const documentsResult = await query(
      `SELECT d.* FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      documents: documentsResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async getDocumentStats(userId?: string): Promise<any> {
    let whereClause = '';
    const values: any[] = [];

    if (userId) {
      whereClause = `WHERE c.user_id = $1`;
      values.push(userId);
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN d.document_type = 'N240' THEN 1 END) as n240_forms,
        COUNT(CASE WHEN d.document_type = 'N1' THEN 1 END) as n1_forms,
        COUNT(CASE WHEN d.document_type = 'ET1' THEN 1 END) as et1_forms,
        COUNT(CASE WHEN d.document_type = 'Other' THEN 1 END) as other_documents,
        COUNT(CASE WHEN d.status = 'Generated' THEN 1 END) as generated_documents,
        COUNT(CASE WHEN d.status = 'Verified' THEN 1 END) as verified_documents,
        COUNT(CASE WHEN d.status = 'Archived' THEN 1 END) as archived_documents,
        COUNT(CASE WHEN d.qr_code_path IS NOT NULL THEN 1 END) as documents_with_qr,
        COUNT(CASE WHEN d.blockchain_tx_hash IS NOT NULL THEN 1 END) as blockchain_verified,
        COUNT(CASE WHEN d.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_documents
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      ${whereClause}
    `, values);

    return {
      totalDocuments: parseInt(result.rows[0].total_documents),
      formTypes: {
        n240: parseInt(result.rows[0].n240_forms),
        n1: parseInt(result.rows[0].n1_forms),
        et1: parseInt(result.rows[0].et1_forms),
        other: parseInt(result.rows[0].other_documents)
      },
      statuses: {
        generated: parseInt(result.rows[0].generated_documents),
        verified: parseInt(result.rows[0].verified_documents),
        archived: parseInt(result.rows[0].archived_documents)
      },
      documentsWithQR: parseInt(result.rows[0].documents_with_qr),
      blockchainVerified: parseInt(result.rows[0].blockchain_verified),
      recentDocuments: parseInt(result.rows[0].recent_documents)
    };
  }

  static async findExpiredDocuments(daysSinceCreation: number = 365): Promise<Document[]> {
    const result = await query(
      `SELECT * FROM documents 
       WHERE status = 'Generated' 
       AND created_at < NOW() - INTERVAL '${daysSinceCreation} days'
       ORDER BY created_at ASC`,
      []
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async findDocumentsWithoutQR(): Promise<Document[]> {
    const result = await query(
      'SELECT * FROM documents WHERE qr_code_path IS NULL ORDER BY created_at DESC LIMIT 100',
      []
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async findDocumentsWithoutBlockchainHash(): Promise<Document[]> {
    const result = await query(
      'SELECT * FROM documents WHERE blockchain_tx_hash IS NULL ORDER BY created_at DESC LIMIT 100',
      []
    );

    return result.rows.map(row => this.mapRow(row));
  }

  private static mapRow(row: any): Document {
    return {
      id: row.id,
      caseId: row.case_id,
      documentType: row.document_type,
      fileName: row.file_name,
      filePath: row.file_path,
      fileHash: row.file_hash,
      blockchainTxHash: row.blockchain_tx_hash,
      qrCodePath: row.qr_code_path,
      status: row.status,
      createdAt: row.created_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}