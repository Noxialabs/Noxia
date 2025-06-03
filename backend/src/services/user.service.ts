import { query } from "../database/connection";
import { logger } from "../utils/logger.utils";
import {
  UserUpdateRequest,
  UserSearchFilters,
  UserResponse,
  PaginatedUsersResponse,
  User,
} from "../types/user.types";

export class UserService {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters: UserSearchFilters): Promise<{ users: UserResponse[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      tier,
      is_active,
      created_from,
      created_to,
    } = filters;

    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (search) {
      whereConditions.push(`(
        LOWER(email) LIKE LOWER($${paramIndex}) OR 
        LOWER(first_name) LIKE LOWER($${paramIndex}) OR 
        LOWER(last_name) LIKE LOWER($${paramIndex}) OR
        LOWER(organization) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (tier) {
      whereConditions.push(`tier = $${paramIndex}`);
      queryParams.push(tier);
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active);
      paramIndex++;
    }

    if (created_from) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(created_from);
      paramIndex++;
    }

    if (created_to) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(created_to);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, phone, organization,
        eth_address, tier, role, is_active, email_verified,
        last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const usersResult = await query(usersQuery, queryParams);

    const users: UserResponse[] = usersResult.rows.map(this.mapDatabaseUser);
    const totalPages = Math.ceil(total / limit);

    logger.info(`Retrieved ${users.length} users (page ${page}/${totalPages})`);

      return {
      users: users,
      total: total,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const result = await query(
      `SELECT 
        id, email, first_name, last_name, phone, organization,
        eth_address, tier, role, is_active, email_verified,
        last_login, created_at, updated_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDatabaseUser(result.rows[0]);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updateData: UserUpdateRequest
  ): Promise<UserResponse | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING 
        id, email, first_name, last_name, phone, organization,
        eth_address, tier, role, is_active, email_verified,
        last_login, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`User updated: ${userId}`);
    return this.mapDatabaseUser(result.rows[0]);
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(userId: string): Promise<boolean> {
    const result = await query(
      `UPDATE users 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND id != (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
       RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    logger.info(`User soft deleted: ${userId}`);
    return true;
  }

  /**
   * Hard delete user (permanent deletion)
   */
  async hardDeleteUser(userId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM users 
       WHERE id = $1 AND id != (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
       RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    logger.info(`User permanently deleted: ${userId}`);
    return true;
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<UserResponse | null> {
    const result = await query(
      `UPDATE users 
       SET is_active = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING 
         id, email, first_name, last_name, phone, organization,
         eth_address, tier, role, is_active, email_verified,
         last_login, created_at, updated_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`User activated: ${userId}`);
    return this.mapDatabaseUser(result.rows[0]);
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    newRole: "user" | "admin" | "super_admin"
  ): Promise<UserResponse | null> {
    // Prevent changing super admin role
    const checkResult = await query("SELECT role FROM users WHERE id = $1", [
      userId,
    ]);

    if (checkResult.rows.length === 0) {
      return null;
    }

    if (
      checkResult.rows[0].role === "super_admin" &&
      newRole !== "super_admin"
    ) {
      throw new Error("Cannot demote super admin");
    }

    const result = await query(
      `UPDATE users 
       SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING 
         id, email, first_name, last_name, phone, organization,
         eth_address, tier, role, is_active, email_verified,
         last_login, created_at, updated_at`,
      [newRole, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info(`User role changed: ${userId} -> ${newRole}`);
    return this.mapDatabaseUser(result.rows[0]);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<any> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admin_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN tier = 'Tier 1' THEN 1 END) as tier1_users,
        COUNT(CASE WHEN tier = 'Tier 2' THEN 1 END) as tier2_users,
        COUNT(CASE WHEN tier = 'Tier 3' THEN 1 END) as tier3_users,
        COUNT(CASE WHEN tier = 'Tier 4' THEN 1 END) as tier4_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days
      FROM users
    `;

    const result = await query(statsQuery);
    return result.rows[0];
  }

  /**
   * Map database row to UserResponse
   */
  private mapDatabaseUser(row: any): UserResponse {
    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      organization: row.organization,
      eth_address: row.eth_address,
      tier: row.tier,
      role: row.role,
      is_active: row.is_active,
      email_verified: row.email_verified,
      last_login: row.last_login,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
