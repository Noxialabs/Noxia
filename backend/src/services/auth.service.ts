import { query } from "../database/connection";
import { User } from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";

export class AuthService {
  async createUser(userData: {
    email: string;
    passwordHash: string;
    ethAddress?: string;
    tier?: string;
    isActive?: boolean;
  }): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO users (id, email, password_hash, eth_address, tier, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        userData.email,
        userData.passwordHash,
        userData.ethAddress || null,
        userData.tier || "Tier 1",
        userData.isActive !== false,
        now,
        now,
      ]
    );

    logger.info(`User created: ${userData.email}`);
    return this.mapDatabaseUser(result.rows[0]);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email]
    );

    return result.rows.length > 0 ? this.mapDatabaseUser(result.rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await query(
      "SELECT * FROM users WHERE id = $1 AND is_active = true",
      [id]
    );

    return result.rows.length > 0 ? this.mapDatabaseUser(result.rows[0]) : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        setClause.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Always update the updated_at timestamp
    setClause.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    values.push(id); // for WHERE clause

    const result = await query(
      `UPDATE users SET ${setClause.join(", ")} WHERE id = $${
        paramIndex + 1
      } RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    logger.info(`User updated: ${id}`);
    return this.mapDatabaseUser(result.rows[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    await query("UPDATE users SET updated_at = $1 WHERE id = $2", [
      new Date(),
      id,
    ]);
  }

  async deactivateUser(id: string): Promise<void> {
    await query(
      "UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2",
      [new Date(), id]
    );
    logger.info(`User deactivated: ${id}`);
  }

  async getUserStats(): Promise<any> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN tier = 'Tier 1' THEN 1 END) as tier_1_users,
        COUNT(CASE WHEN tier = 'Tier 2' THEN 1 END) as tier_2_users,
        COUNT(CASE WHEN tier = 'Tier 3' THEN 1 END) as tier_3_users,
        COUNT(CASE WHEN tier = 'Tier 4' THEN 1 END) as tier_4_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users 
      WHERE is_active = true
    `);

    return result.rows[0];
  }

  private mapDatabaseUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      ethAddress: dbUser.eth_address,
      tier: dbUser.tier,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      role: dbUser.role,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
