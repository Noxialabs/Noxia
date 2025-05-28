
// ===================================================

// src/database/migrations/002_create_cases_table.ts
import { Pool } from 'pg';
import { logger } from '../../utils/logger.utils';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_ref VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 50),
        jurisdiction VARCHAR(100),
        issue_category VARCHAR(100) NOT NULL CHECK (issue_category IN (
          'Corruption - Police',
          'Corruption - Government', 
          'Corruption - Judicial',
          'Criminal - Assault',
          'Criminal - Fraud',
          'Criminal - Harassment',
          'Criminal - Murder',
          'Legal - Civil Rights',
          'Legal - Employment',
          'Legal - Housing',
          'Legal - Immigration',
          'Other'
        )),
        escalation_level VARCHAR(50) NOT NULL DEFAULT 'Basic' CHECK (escalation_level IN ('Basic', 'Priority', 'Urgent')),
        ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
        status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Escalated', 'Closed')),
        priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
        urgency_score INTEGER DEFAULT 5 CHECK (urgency_score >= 1 AND urgency_score <= 10),
        eth_tx_hash VARCHAR(100),
        ce_file_status VARCHAR(50) DEFAULT 'Pending',
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        suggested_actions JSONB DEFAULT '[]',
        assigned_to UUID REFERENCES users(id),
        escalated_by UUID REFERENCES users(id),
        escalated_at TIMESTAMP,
        closed_at TIMESTAMP,
        closed_by UUID REFERENCES users(id),
        closure_reason TEXT
      );
    `);

    // Create AI classifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_classifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
        input_text TEXT NOT NULL,
        issue_category VARCHAR(100) NOT NULL,
        escalation_level VARCHAR(50) NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        urgency_score INTEGER NOT NULL,
        suggested_actions JSONB DEFAULT '[]',
        processing_time_ms INTEGER,
        model_used VARCHAR(50) DEFAULT 'gpt-4',
        tokens_used INTEGER,
        cost DECIMAL(10,4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create case activities table for audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        description TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
      CREATE INDEX IF NOT EXISTS idx_cases_case_ref ON cases(case_ref);
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
      CREATE INDEX IF NOT EXISTS idx_cases_escalation_level ON cases(escalation_level);
      CREATE INDEX IF NOT EXISTS idx_cases_issue_category ON cases(issue_category);
      CREATE INDEX IF NOT EXISTS idx_cases_submission_date ON cases(submission_date);
      CREATE INDEX IF NOT EXISTS idx_cases_urgency_score ON cases(urgency_score);
      CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to) WHERE assigned_to IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_cases_escalated_by ON cases(escalated_by) WHERE escalated_by IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_case_id ON ai_classifications(case_id);
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_created_at ON ai_classifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_confidence ON ai_classifications(confidence);
      
      CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON case_activities(case_id);
      CREATE INDEX IF NOT EXISTS idx_case_activities_user_id ON case_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_case_activities_created_at ON case_activities(created_at);
    `);

    // Create trigger for cases table
    await client.query(`
      DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
      CREATE TRIGGER update_cases_updated_at
        BEFORE UPDATE ON cases
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create function to automatically create case activity when case is updated
    await client.query(`
      CREATE OR REPLACE FUNCTION log_case_activity()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' THEN
          INSERT INTO case_activities (case_id, action, description, old_values, new_values)
          VALUES (
            NEW.id,
            'case_updated',
            'Case details updated',
            row_to_json(OLD),
            row_to_json(NEW)
          );
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for automatic case activity logging
    await client.query(`
      DROP TRIGGER IF EXISTS log_case_update_activity ON cases;
      CREATE TRIGGER log_case_update_activity
        AFTER UPDATE ON cases
        FOR EACH ROW
        EXECUTE FUNCTION log_case_activity();
    `);

    await client.query('COMMIT');
    logger.info('✅ Migration 002: Cases tables created successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 002 failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TRIGGER IF EXISTS log_case_update_activity ON cases;');
    await client.query('DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;');
    await client.query('DROP FUNCTION IF EXISTS log_case_activity();');
    await client.query('DROP TABLE IF EXISTS case_activities CASCADE;');
    await client.query('DROP TABLE IF EXISTS ai_classifications CASCADE;');
    await client.query('DROP TABLE IF EXISTS cases CASCADE;');
    
    await client.query('COMMIT');
    logger.info('✅ Migration 002: Cases tables dropped successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 002 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};