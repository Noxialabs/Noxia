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
        user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Made nullable for public submissions
        title VARCHAR(255) NOT NULL, -- Added title field as per requirements
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255), -- Added for public user contact
        client_phone VARCHAR(20), -- Added for public user contact
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
        escalation_flag BOOLEAN GENERATED ALWAYS AS (escalation_level != 'Basic') STORED, -- Added for backward compatibility
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
        closure_reason TEXT,
        -- Fields for tracking public submissions
        is_public_submission BOOLEAN DEFAULT false,
        submission_ip INET, -- Track IP for public submissions
        submission_user_agent TEXT -- Track user agent for public submissions
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
        user_id UUID REFERENCES users(id), -- Nullable for system/public actions
        action VARCHAR(100) NOT NULL,
        description TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create case exports table for tracking admin exports
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_exports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        exported_by UUID REFERENCES users(id) ON DELETE SET NULL,
        export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('csv', 'pdf', 'excel')),
        case_ids UUID[] NOT NULL,
        filters_applied JSONB DEFAULT '{}',
        total_cases_exported INTEGER NOT NULL,
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user sessions table for admin authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_cases_case_ref ON cases(case_ref);
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
      CREATE INDEX IF NOT EXISTS idx_cases_escalation_level ON cases(escalation_level);
      CREATE INDEX IF NOT EXISTS idx_cases_escalation_flag ON cases(escalation_flag);
      CREATE INDEX IF NOT EXISTS idx_cases_issue_category ON cases(issue_category);
      CREATE INDEX IF NOT EXISTS idx_cases_submission_date ON cases(submission_date);
      CREATE INDEX IF NOT EXISTS idx_cases_urgency_score ON cases(urgency_score);
      CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to) WHERE assigned_to IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_cases_escalated_by ON cases(escalated_by) WHERE escalated_by IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_cases_is_public_submission ON cases(is_public_submission);
      CREATE INDEX IF NOT EXISTS idx_cases_client_email ON cases(client_email) WHERE client_email IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_cases_title ON cases(title);
      
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_case_id ON ai_classifications(case_id);
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_created_at ON ai_classifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_classifications_confidence ON ai_classifications(confidence);
      
      CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON case_activities(case_id);
      CREATE INDEX IF NOT EXISTS idx_case_activities_user_id ON case_activities(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_case_activities_created_at ON case_activities(created_at);
      CREATE INDEX IF NOT EXISTS idx_case_activities_action ON case_activities(action);
      
      CREATE INDEX IF NOT EXISTS idx_case_exports_exported_by ON case_exports(exported_by) WHERE exported_by IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_case_exports_created_at ON case_exports(created_at);
      CREATE INDEX IF NOT EXISTS idx_case_exports_export_type ON case_exports(export_type);
      
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
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
        ELSIF TG_OP = 'INSERT' THEN
          INSERT INTO case_activities (case_id, action, description, new_values, ip_address, user_agent)
          VALUES (
            NEW.id,
            CASE 
              WHEN NEW.is_public_submission THEN 'case_submitted_public'
              ELSE 'case_created'
            END,
            CASE 
              WHEN NEW.is_public_submission THEN 'Case submitted by public user'
              ELSE 'Case created by registered user'
            END,
            row_to_json(NEW),
            NEW.submission_ip,
            NEW.submission_user_agent
          );
        END IF;
        RETURN COALESCE(NEW, OLD);
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for automatic case activity logging
    await client.query(`
      DROP TRIGGER IF EXISTS log_case_update_activity ON cases;
      DROP TRIGGER IF EXISTS log_case_insert_activity ON cases;
      
      CREATE TRIGGER log_case_update_activity
        AFTER UPDATE ON cases
        FOR EACH ROW
        EXECUTE FUNCTION log_case_activity();
        
      CREATE TRIGGER log_case_insert_activity
        AFTER INSERT ON cases
        FOR EACH ROW
        EXECUTE FUNCTION log_case_activity();
    `);

    // Create function to clean up expired sessions
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS void AS $$
      BEGIN
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
      END;
      $$ language 'plpgsql';
    `);

    // Create function to generate unique case reference
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_case_ref()
      RETURNS varchar AS $$
      DECLARE
        new_ref varchar;
        counter int := 0;
      BEGIN
        LOOP
          new_ref := 'CASE-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                     LPAD((EXTRACT(DOY FROM CURRENT_DATE))::text, 3, '0') || '-' ||
                     LPAD((counter + 1)::text, 4, '0');
          
          EXIT WHEN NOT EXISTS (SELECT 1 FROM cases WHERE case_ref = new_ref);
          counter := counter + 1;
        END LOOP;
        
        RETURN new_ref;
      END;
      $$ language 'plpgsql';
    `);

    await client.query('COMMIT');
    logger.info('✅ Migration 002: Cases tables created successfully with public user support');

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
    
    await client.query('DROP TRIGGER IF EXISTS log_case_insert_activity ON cases;');
    await client.query('DROP TRIGGER IF EXISTS log_case_update_activity ON cases;');
    await client.query('DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;');
    await client.query('DROP FUNCTION IF EXISTS generate_case_ref();');
    await client.query('DROP FUNCTION IF EXISTS cleanup_expired_sessions();');
    await client.query('DROP FUNCTION IF EXISTS log_case_activity();');
    await client.query('DROP TABLE IF EXISTS user_sessions CASCADE;');
    await client.query('DROP TABLE IF EXISTS case_exports CASCADE;');
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