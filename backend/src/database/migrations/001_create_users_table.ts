// ===================================================
// src/database/migrations/001_create_users_table.ts
import { Pool } from "pg";
import { logger } from "../../utils/logger.utils";
import bcrypt from 'bcrypt'

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create UUID extension if not exists
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        eth_address VARCHAR(42) UNIQUE,
        tier VARCHAR(20) DEFAULT 'Tier 1' CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4')),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- Added role field
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        organization VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_eth_address ON users(eth_address) WHERE eth_address IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization) WHERE organization IS NOT NULL;
    `);

    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for users table
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default admin user (optional - remove if not needed)
    // Hash the admin password dynamically using bcrypt
    const adminPassword = "password123";
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await client.query(
      `
      INSERT INTO users (
      email, 
      password_hash, 
      role, 
      tier,
      first_name, 
      last_name,
      is_active,
      email_verified
      ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
      ) ON CONFLICT (email) DO NOTHING;
      `,
      [
        "admin@example.com",
        passwordHash,
        "admin",
        "Tier 4",
        "System",
        "Administrator",
        true,
        true,
      ]
    );

    await client.query("COMMIT");
    logger.info(
      "✅ Migration 001: Users table created successfully with admin role support"
    );
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("❌ Migration 001 failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DROP TRIGGER IF EXISTS update_users_updated_at ON users;"
    );
    await client.query("DROP TABLE IF EXISTS users CASCADE;");

    await client.query("COMMIT");
    logger.info("✅ Migration 001: Users table dropped successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("❌ Migration 001 rollback failed:", error);
    throw error;
  } finally {
    client.release();
  }
};
