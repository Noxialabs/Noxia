// src/models/User.model.ts
import { query } from '../database/connection';
import { User } from '../types';
import { logger } from '../utils/logger.utils';

export class UserModel {
  static async create(userData: {
    id: string;
    email: string;
    passwordHash: string;
    ethAddress?: string;
    tier?: string;
    isActive?: boolean;
  }): Promise<User> {
    const now = new Date();
    
    const result = await query(
      `INSERT INTO users (id, email, password_hash, eth_address, tier, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userData.id,
        userData.email,
        userData.passwordHash,
        userData.ethAddress || null,
        userData.tier || 'Tier 1',
        userData.isActive !== false,
        now,
        now
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByEthAddress(ethAddress: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE eth_address = $1 AND is_active = true',
      [ethAddress]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
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

    // Always update the updated_at timestamp
    setClause.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    values.push(id); // for WHERE clause

    const result = await query(
      `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramIndex + 1} AND is_active = true RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2',
      [new Date(), id]
    );

    return result.rowCount > 0;
  }

  static async findAll(
    filters: {
      tier?: string;
      isActive?: boolean;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.tier) {
      whereClause += ` AND tier = $${paramIndex}`;
      values.push(filters.tier);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      values.push(filters.isActive);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (email ILIKE $${paramIndex} OR eth_address ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      values
    );

    // Get users with pagination
    const usersResult = await query(
      `SELECT * FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      users: usersResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async getUserStats(): Promise<any> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN tier = 'Tier 1' THEN 1 END) as tier_1_users,
        COUNT(CASE WHEN tier = 'Tier 2' THEN 1 END) as tier_2_users,
        COUNT(CASE WHEN tier = 'Tier 3' THEN 1 END) as tier_3_users,
        COUNT(CASE WHEN tier = 'Tier 4' THEN 1 END) as tier_4_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN eth_address IS NOT NULL THEN 1 END) as users_with_eth
      FROM users
    `);

    return {
      totalUsers: parseInt(result.rows[0].total_users),
      tierDistribution: {
        tier1: parseInt(result.rows[0].tier_1_users),
        tier2: parseInt(result.rows[0].tier_2_users),
        tier3: parseInt(result.rows[0].tier_3_users),
        tier4: parseInt(result.rows[0].tier_4_users)
      },
      activeUsers: parseInt(result.rows[0].active_users),
      inactiveUsers: parseInt(result.rows[0].inactive_users),
      newUsers30d: parseInt(result.rows[0].new_users_30d),
      usersWithEth: parseInt(result.rows[0].users_with_eth)
    };
  }

  private static mapRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      ethAddress: row.eth_address,
      tier: row.tier,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
