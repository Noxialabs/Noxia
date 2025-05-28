// scripts/migrate.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { logger } from '../src/utils/logger.utils';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

interface Migration {
  id: string;
  name: string;
  up: (pool: Pool) => Promise<void>;
  down: (pool: Pool) => Promise<void>;
}

class MigrationRunner {
  private pool: Pool;
  private migrations: Migration[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async init(): Promise<void> {
    // Create migrations table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async loadMigrations(): Promise<void> {
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = await import(migrationPath);
      
      const migrationName = file.replace(/\.(ts|js)$/, '');
      this.migrations.push({
        id: migrationName,
        name: migrationName,
        up: migration.up,
        down: migration.down
      });
    }

    logger.info(`Loaded ${this.migrations.length} migrations`);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
  }

  async up(targetMigration?: string): Promise<void> {
    await this.init();
    await this.loadMigrations();

    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = this.migrations.filter(
      migration => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }

    logger.info(`📦 Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      if (targetMigration && migration.name !== targetMigration) {
        continue;
      }

      try {
        logger.info(`🚀 Running migration: ${migration.name}`);
        await migration.up(this.pool);
        
        // Record migration as executed
        await this.pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        
        logger.info(`✅ Migration completed: ${migration.name}`);

        if (targetMigration && migration.name === targetMigration) {
          break;
        }
      } catch (error) {
        logger.error(`❌ Migration failed: ${migration.name}`, error);
        throw error;
      }
    }

    logger.info('🎉 All migrations completed successfully');
  }

  async down(migrationName?: string): Promise<void> {
    await this.init();
    await this.loadMigrations();

    const executedMigrations = await this.getExecutedMigrations();
    
    if (!migrationName) {
      // Rollback last migration
      migrationName = executedMigrations[executedMigrations.length - 1];
    }

    if (!migrationName) {
      logger.info('✅ No migrations to rollback');
      return;
    }

    const migration = this.migrations.find(m => m.name === migrationName);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationName}`);
    }

    if (!executedMigrations.includes(migrationName)) {
      throw new Error(`Migration not executed: ${migrationName}`);
    }

    try {
      logger.info(`🔄 Rolling back migration: ${migrationName}`);
      await migration.down(this.pool);
      
      // Remove migration record
      await this.pool.query(
        'DELETE FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      logger.info(`✅ Migration rolled back: ${migrationName}`);
    } catch (error) {
      logger.error(`❌ Migration rollback failed: ${migrationName}`, error);
      throw error;
    }
  }

  async status(): Promise<void> {
    await this.init();
    await this.loadMigrations();

    const executedMigrations = await this.getExecutedMigrations();
    
    logger.info('📊 Migration Status:');
    logger.info('==================');
    
    for (const migration of this.migrations) {
      const status = executedMigrations.includes(migration.name) ? '✅ EXECUTED' : '⏳ PENDING';
      logger.info(`${status} ${migration.name}`);
    }
    
    logger.info(`\nTotal: ${this.migrations.length} migrations`);
    logger.info(`Executed: ${executedMigrations.length}`);
    logger.info(`Pending: ${this.migrations.length - executedMigrations.length}`);
  }

  async reset(): Promise<void> {
    await this.init();
    await this.loadMigrations();

    const executedMigrations = await this.getExecutedMigrations();
    
    // Rollback all migrations in reverse order
    for (let i = executedMigrations.length - 1; i >= 0; i--) {
      const migrationName = executedMigrations[i];
      await this.down(migrationName);
    }

    logger.info('🔄 All migrations rolled back');
  }

  async fresh(): Promise<void> {
    await this.reset();
    await this.up();
    logger.info('🎉 Database refreshed with all migrations');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const argument = process.argv[3];
  
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'up':
        await runner.up(argument);
        break;
      case 'down':
        await runner.down(argument);
        break;
      case 'status':
        await runner.status();
        break;
      case 'reset':
        await runner.reset();
        break;
      case 'fresh':
        await runner.fresh();
        break;
      default:
        console.log(`
Usage: npm run migrate <command> [options]

Commands:
  up [migration]     Run pending migrations (or specific migration)
  down [migration]   Rollback last migration (or specific migration)
  status            Show migration status
  reset             Rollback all migrations
  fresh             Reset and run all migrations

Examples:
  npm run migrate up                    # Run all pending migrations
  npm run migrate up 001_create_users   # Run specific migration
  npm run migrate down                  # Rollback last migration
  npm run migrate status                # Show status
  npm run migrate fresh                 # Reset and run all
        `);
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration command failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default MigrationRunner;