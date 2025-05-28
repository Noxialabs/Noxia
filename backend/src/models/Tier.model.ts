import { query } from '../database/connection';
import { UserTier } from '../types';
import { logger } from '../utils/logger.utils';

export class TierModel {
  static async create(tierData: {
    id: string;
    userId: string;
    tier: string;
    ethBalance: number;
    ethAddress: string;
  }): Promise<UserTier> {
    const now = new Date();

    const result = await query(
      `INSERT INTO user_tiers (id, user_id, tier, eth_balance, eth_address, last_balance_check, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tierData.id,
        tierData.userId,
        tierData.tier,
        tierData.ethBalance,
        tierData.ethAddress,
        now,
        now
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  static async findById(id: string): Promise<UserTier | null> {
    const result = await query(
      'SELECT * FROM user_tiers WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByUserId(userId: string): Promise<UserTier | null> {
    const result = await query(
      'SELECT * FROM user_tiers WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByEthAddress(ethAddress: string): Promise<UserTier[]> {
    const result = await query(
      'SELECT * FROM user_tiers WHERE eth_address = $1 ORDER BY created_at DESC',
      [ethAddress]
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async findLatestByUserId(userId: string): Promise<UserTier | null> {
    const result = await query(
      'SELECT * FROM user_tiers WHERE user_id = $1 ORDER BY last_balance_check DESC LIMIT 1',
      [userId]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async findByTier(
    tier: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ tiers: UserTier[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_tiers WHERE tier = $1',
      [tier]
    );

    const tiersResult = await query(
      'SELECT * FROM user_tiers WHERE tier = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tier, limit, offset]
    );

    return {
      tiers: tiersResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async update(id: string, updates: Partial<UserTier>): Promise<UserTier | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbField = this.camelToSnake(key);
        setClause.push(`${dbField} = ${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return await this.findById(id);
    }

    // Update balance check timestamp if balance is being updated
    if (updates.ethBalance !== undefined) {
      setClause.push(`last_balance_check = ${paramIndex}`);
      values.push(new Date());
      paramIndex++;
    }

    values.push(id);

    const result = await query(
      `UPDATE user_tiers SET ${setClause.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM user_tiers WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async getTierStats(): Promise<any> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_tier_records,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN tier = 'Tier 1' THEN 1 END) as tier_1_count,
        COUNT(CASE WHEN tier = 'Tier 2' THEN 1 END) as tier_2_count,
        COUNT(CASE WHEN tier = 'Tier 3' THEN 1 END) as tier_3_count,
        COUNT(CASE WHEN tier = 'Tier 4' THEN 1 END) as tier_4_count,
        AVG(eth_balance) as avg_balance,
        MAX(eth_balance) as max_balance,
        MIN(eth_balance) as min_balance,
        COUNT(CASE WHEN last_balance_check > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_checks
      FROM user_tiers
    `);

    // Get tier distribution by unique users (latest tier per user)
    const latestTiersResult = await query(`
      SELECT tier, COUNT(*) as count
      FROM (
        SELECT DISTINCT ON (user_id) user_id, tier
        FROM user_tiers
        ORDER BY user_id, last_balance_check DESC
      ) latest_tiers
      GROUP BY tier
      ORDER BY tier
    `);

    return {
      totalRecords: parseInt(result.rows[0].total_tier_records),
      uniqueUsers: parseInt(result.rows[0].unique_users),
      tierCounts: {
        tier1: parseInt(result.rows[0].tier_1_count),
        tier2: parseInt(result.rows[0].tier_2_count),
        tier3: parseInt(result.rows[0].tier_3_count),
        tier4: parseInt(result.rows[0].tier_4_count)
      },
      balanceStats: {
        average: parseFloat(result.rows[0].avg_balance || '0'),
        maximum: parseFloat(result.rows[0].max_balance || '0'),
        minimum: parseFloat(result.rows[0].min_balance || '0')
      },
      recentChecks: parseInt(result.rows[0].recent_checks),
      currentTierDistribution: latestTiersResult.rows.map(row => ({
        tier: row.tier,
        count: parseInt(row.count)
      }))
    };
  }

  static async findStaleBalances(hoursSinceCheck: number = 24): Promise<UserTier[]> {
    const result = await query(
      `SELECT * FROM user_tiers 
       WHERE last_balance_check < NOW() - INTERVAL '${hoursSinceCheck} hours'
       ORDER BY last_balance_check ASC
       LIMIT 100`,
      []
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async findHighestTierUsers(limit: number = 10): Promise<UserTier[]> {
    const result = await query(
      `SELECT DISTINCT ON (user_id) *
       FROM user_tiers
       ORDER BY user_id, eth_balance DESC, last_balance_check DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => this.mapRow(row));
  }

  static async getTierHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ history: UserTier[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_tiers WHERE user_id = $1',
      [userId]
    );

    const historyResult = await query(
      'SELECT * FROM user_tiers WHERE user_id = $1 ORDER BY last_balance_check DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    return {
      history: historyResult.rows.map(row => this.mapRow(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findTierChanges(
    userId: string,
    daysSince: number = 30
  ): Promise<{ changes: any[]; totalChanges: number }> {
    const result = await query(
      `SELECT 
         ut1.tier as old_tier,
         ut2.tier as new_tier,
         ut1.eth_balance as old_balance,
         ut2.eth_balance as new_balance,
         ut2.last_balance_check as change_date
       FROM user_tiers ut1
       JOIN user_tiers ut2 ON ut1.user_id = ut2.user_id
       WHERE ut1.user_id = $1
       AND ut2.last_balance_check > ut1.last_balance_check
       AND ut1.tier != ut2.tier
       AND ut2.last_balance_check > NOW() - INTERVAL '${daysSince} days'
       ORDER BY ut2.last_balance_check DESC`,
      [userId]
    );

    return {
      changes: result.rows,
      totalChanges: result.rows.length
    };
  }

  static async getUsersNeedingTierUpdate(hoursSinceCheck: number = 1): Promise<string[]> {
    const result = await query(
      `SELECT DISTINCT user_id 
       FROM user_tiers 
       WHERE last_balance_check < NOW() - INTERVAL '${hoursSinceCheck} hours'`,
      []
    );

    return result.rows.map(row => row.user_id);
  }

  private static mapRow(row: any): UserTier {
    return {
      id: row.id,
      userId: row.user_id,
      tier: row.tier,
      ethBalance: parseFloat(row.eth_balance),
      ethAddress: row.eth_address,
      lastBalanceCheck: row.last_balance_check,
      createdAt: row.created_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
