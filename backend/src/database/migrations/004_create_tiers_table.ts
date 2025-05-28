// src/database/migrations/004_create_tiers_table.ts
import { Pool } from 'pg';
import { logger } from '../../utils/logger.utils';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create user_tiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tiers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tier VARCHAR(20) NOT NULL CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4')),
        eth_balance DECIMAL(20,8) DEFAULT 0.0 CHECK (eth_balance >= 0),
        eth_address VARCHAR(42) NOT NULL,
        last_balance_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        balance_check_count INTEGER DEFAULT 1,
        tier_changed_at TIMESTAMP,
        previous_tier VARCHAR(20),
        tier_upgrade_count INTEGER DEFAULT 0,
        tier_downgrade_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tier permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tier_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tier VARCHAR(20) NOT NULL CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4')),
        permission_name VARCHAR(100) NOT NULL,
        permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN (
          'feature_access', 'api_limit', 'storage_limit', 'priority_support'
        )),
        permission_value JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tier, permission_name)
      );
    `);

    // Create tier history table for tracking tier changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS tier_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_tier VARCHAR(20),
        new_tier VARCHAR(20) NOT NULL,
        old_balance DECIMAL(20,8),
        new_balance DECIMAL(20,8) NOT NULL,
        eth_address VARCHAR(42) NOT NULL,
        change_reason VARCHAR(100) DEFAULT 'balance_update',
        triggered_by VARCHAR(50) DEFAULT 'automatic' CHECK (triggered_by IN (
          'automatic', 'manual', 'admin', 'system'
        )),
        tx_hash VARCHAR(100),
        change_metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tier balance checks table for monitoring
    await client.query(`
      CREATE TABLE IF NOT EXISTS tier_balance_checks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        eth_address VARCHAR(42) NOT NULL,
        balance_wei VARCHAR(100) NOT NULL,
        balance_eth DECIMAL(20,8) NOT NULL,
        tier_calculated VARCHAR(20) NOT NULL,
        tier_applied VARCHAR(20) NOT NULL,
        check_duration_ms INTEGER,
        rpc_endpoint VARCHAR(255),
        block_number BIGINT,
        check_status VARCHAR(50) DEFAULT 'success' CHECK (check_status IN (
          'success', 'failed', 'timeout', 'rpc_error'
        )),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_tiers_user_id ON user_tiers(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_tier ON user_tiers(tier);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_eth_address ON user_tiers(eth_address);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_last_balance_check ON user_tiers(last_balance_check);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_is_active ON user_tiers(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_created_at ON user_tiers(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_tiers_tier_changed_at ON user_tiers(tier_changed_at) WHERE tier_changed_at IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_tier_permissions_tier ON tier_permissions(tier);
      CREATE INDEX IF NOT EXISTS idx_tier_permissions_permission_name ON tier_permissions(permission_name);
      CREATE INDEX IF NOT EXISTS idx_tier_permissions_permission_type ON tier_permissions(permission_type);
      CREATE INDEX IF NOT EXISTS idx_tier_permissions_is_active ON tier_permissions(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_tier_history_user_id ON tier_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_tier_history_old_tier ON tier_history(old_tier);
      CREATE INDEX IF NOT EXISTS idx_tier_history_new_tier ON tier_history(new_tier);
      CREATE INDEX IF NOT EXISTS idx_tier_history_created_at ON tier_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_tier_history_change_reason ON tier_history(change_reason);
      
      CREATE INDEX IF NOT EXISTS idx_tier_balance_checks_user_id ON tier_balance_checks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tier_balance_checks_eth_address ON tier_balance_checks(eth_address);
      CREATE INDEX IF NOT EXISTS idx_tier_balance_checks_created_at ON tier_balance_checks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tier_balance_checks_check_status ON tier_balance_checks(check_status);
    `);

    // Create unique constraint to prevent duplicate active tiers per user
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tiers_unique_active 
      ON user_tiers(user_id) 
      WHERE is_active = true;
    `);

    // Create trigger for user_tiers table
    await client.query(`
      DROP TRIGGER IF EXISTS update_user_tiers_updated_at ON user_tiers;
      CREATE TRIGGER update_user_tiers_updated_at
        BEFORE UPDATE ON user_tiers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger for tier_permissions table
    await client.query(`
      DROP TRIGGER IF EXISTS update_tier_permissions_updated_at ON tier_permissions;
      CREATE TRIGGER update_tier_permissions_updated_at
        BEFORE UPDATE ON tier_permissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create function to log tier changes
    await client.query(`
      CREATE OR REPLACE FUNCTION log_tier_change()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' AND (OLD.tier != NEW.tier OR OLD.eth_balance != NEW.eth_balance) THEN
          INSERT INTO tier_history (
            user_id, old_tier, new_tier, old_balance, new_balance, 
            eth_address, change_reason, change_metadata
          ) VALUES (
            NEW.user_id, 
            OLD.tier, 
            NEW.tier, 
            OLD.eth_balance, 
            NEW.eth_balance,
            NEW.eth_address,
            CASE 
              WHEN OLD.tier != NEW.tier THEN 'tier_change'
              ELSE 'balance_update'
            END,
            json_build_object(
              'old_tier', OLD.tier,
              'new_tier', NEW.tier,
              'balance_difference', NEW.eth_balance - OLD.eth_balance,
              'timestamp', CURRENT_TIMESTAMP
            )
          );
          
          -- Update tier change timestamp and counters
          IF OLD.tier != NEW.tier THEN
            NEW.tier_changed_at = CURRENT_TIMESTAMP;
            NEW.previous_tier = OLD.tier;
            
            -- Update upgrade/downgrade counters
            IF (OLD.tier = 'Tier 1' AND NEW.tier IN ('Tier 2', 'Tier 3', 'Tier 4')) OR
               (OLD.tier = 'Tier 2' AND NEW.tier IN ('Tier 3', 'Tier 4')) OR
               (OLD.tier = 'Tier 3' AND NEW.tier = 'Tier 4') THEN
              NEW.tier_upgrade_count = OLD.tier_upgrade_count + 1;
            ELSIF (OLD.tier = 'Tier 4' AND NEW.tier IN ('Tier 1', 'Tier 2', 'Tier 3')) OR
                  (OLD.tier = 'Tier 3' AND NEW.tier IN ('Tier 1', 'Tier 2')) OR
                  (OLD.tier = 'Tier 2' AND NEW.tier = 'Tier 1') THEN
              NEW.tier_downgrade_count = OLD.tier_downgrade_count + 1;
            END IF;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for automatic tier change logging
    await client.query(`
      DROP TRIGGER IF EXISTS log_user_tier_changes ON user_tiers;
      CREATE TRIGGER log_user_tier_changes
        BEFORE UPDATE ON user_tiers
        FOR EACH ROW
        EXECUTE FUNCTION log_tier_change();
    `);

  
    await client.query(`
      INSERT INTO tier_permissions (tier, permission_name, permission_type, permission_value, description) VALUES
      -- Tier 1 Permissions (Basic)
      ('Tier 1', 'max_cases_per_month', 'api_limit', '{"limit": 5}', 'Maximum cases that can be submitted per month'),
      ('Tier 1', 'max_documents_per_case', 'api_limit', '{"limit": 3}', 'Maximum documents per case'),
      ('Tier 1', 'storage_limit_mb', 'storage_limit', '{"limit": 100}', 'Storage limit in MB'),
      ('Tier 1', 'ai_classifications_per_month', 'api_limit', '{"limit": 50}', 'AI classification requests per month'),
      ('Tier 1', 'support_level', 'priority_support', '{"level": "community"}', 'Community support only'),
      ('Tier 1', 'form_generation', 'feature_access', '{"enabled": true, "forms": ["N240"]}', 'Basic form generation'),
      
      -- Tier 2 Permissions (Standard)
      ('Tier 2', 'max_cases_per_month', 'api_limit', '{"limit": 25}', 'Maximum cases that can be submitted per month'),
      ('Tier 2', 'max_documents_per_case', 'api_limit', '{"limit": 10}', 'Maximum documents per case'),
      ('Tier 2', 'storage_limit_mb', 'storage_limit', '{"limit": 500}', 'Storage limit in MB'),
      ('Tier 2', 'ai_classifications_per_month', 'api_limit', '{"limit": 200}', 'AI classification requests per month'),
      ('Tier 2', 'support_level', 'priority_support', '{"level": "email"}', 'Email support'),
      ('Tier 2', 'form_generation', 'feature_access', '{"enabled": true, "forms": ["N240", "N1", "ET1"]}', 'Extended form generation'),
      ('Tier 2', 'blockchain_verification', 'feature_access', '{"enabled": true}', 'Document blockchain verification'),
      
      -- Tier 3 Permissions (Premium)
      ('Tier 3', 'max_cases_per_month', 'api_limit', '{"limit": 100}', 'Maximum cases that can be submitted per month'),
      ('Tier 3', 'max_documents_per_case', 'api_limit', '{"limit": 25}', 'Maximum documents per case'),
      ('Tier 3', 'storage_limit_mb', 'storage_limit', '{"limit": 2000}', 'Storage limit in MB'),
      ('Tier 3', 'ai_classifications_per_month', 'api_limit', '{"limit": 1000}', 'AI classification requests per month'),
      ('Tier 3', 'support_level', 'priority_support', '{"level": "priority"}', 'Priority support'),
      ('Tier 3', 'form_generation', 'feature_access', '{"enabled": true, "forms": ["N240", "N1", "ET1", "N244"]}', 'All form generation'),
      ('Tier 3', 'blockchain_verification', 'feature_access', '{"enabled": true}', 'Document blockchain verification'),
      ('Tier 3', 'case_escalation', 'feature_access', '{"enabled": true, "auto_escalation": true}', 'Automatic case escalation'),
      ('Tier 3', 'api_access', 'feature_access', '{"enabled": true, "rate_limit": 1000}', 'API access with higher limits'),
      
      -- Tier 4 Permissions (Enterprise)
      ('Tier 4', 'max_cases_per_month', 'api_limit', '{"limit": -1}', 'Unlimited cases per month'),
      ('Tier 4', 'max_documents_per_case', 'api_limit', '{"limit": -1}', 'Unlimited documents per case'),
      ('Tier 4', 'storage_limit_mb', 'storage_limit', '{"limit": -1}', 'Unlimited storage'),
      ('Tier 4', 'ai_classifications_per_month', 'api_limit', '{"limit": -1}', 'Unlimited AI classification requests'),
      ('Tier 4', 'support_level', 'priority_support', '{"level": "dedicated"}', 'Dedicated support representative'),
      ('Tier 4', 'form_generation', 'feature_access', '{"enabled": true, "forms": ["all"], "custom_forms": true}', 'All forms including custom'),
      ('Tier 4', 'blockchain_verification', 'feature_access', '{"enabled": true, "priority_queue": true}', 'Priority blockchain verification'),
      ('Tier 4', 'case_escalation', 'feature_access', '{"enabled": true, "auto_escalation": true, "priority_handling": true}', 'Priority case escalation'),
      ('Tier 4', 'api_access', 'feature_access', '{"enabled": true, "rate_limit": -1, "webhooks": true}', 'Unlimited API access with webhooks'),
      ('Tier 4', 'analytics_dashboard', 'feature_access', '{"enabled": true, "advanced_reporting": true}', 'Advanced analytics and reporting'),
      ('Tier 4', 'white_label', 'feature_access', '{"enabled": true}', 'White label solution access')
      ON CONFLICT (tier, permission_name) DO NOTHING;
    `);

    await client.query('COMMIT');
    logger.info('✅ Migration 004: Tiers tables created successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 004 failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TRIGGER IF EXISTS log_user_tier_changes ON user_tiers;');
    await client.query('DROP TRIGGER IF EXISTS update_tier_permissions_updated_at ON tier_permissions;');
    await client.query('DROP TRIGGER IF EXISTS update_user_tiers_updated_at ON user_tiers;');
    await client.query('DROP FUNCTION IF EXISTS log_tier_change();');
    await client.query('DROP TABLE IF EXISTS tier_balance_checks CASCADE;');
    await client.query('DROP TABLE IF EXISTS tier_history CASCADE;');
    await client.query('DROP TABLE IF EXISTS tier_permissions CASCADE;');
    await client.query('DROP TABLE IF EXISTS user_tiers CASCADE;');
    
    await client.query('COMMIT');
    logger.info('✅ Migration 004: Tiers tables dropped successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 004 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};