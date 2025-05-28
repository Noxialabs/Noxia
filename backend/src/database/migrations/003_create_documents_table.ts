// src/database/migrations/003_create_documents_table.ts
import { Pool } from 'pg';
import { logger } from '../../utils/logger.utils';

export const up = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
          'N240', 'N1', 'N244', 'ET1', 'N208', 'N279', 'CPR23', 'Other'
        )),
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT DEFAULT 0,
        mime_type VARCHAR(100),
        file_hash VARCHAR(64) NOT NULL UNIQUE,
        blockchain_tx_hash VARCHAR(100),
        qr_code_path VARCHAR(500),
        status VARCHAR(50) DEFAULT 'Generated' CHECK (status IN (
          'Generated', 'Processing', 'Verified', 'Failed', 'Archived'
        )),
        verification_status VARCHAR(50) DEFAULT 'Pending' CHECK (verification_status IN (
          'Pending', 'Verified', 'Failed', 'Expired'
        )),
        metadata JSONB DEFAULT '{}',
        template_used VARCHAR(100),
        form_data JSONB DEFAULT '{}',
        processing_time_ms INTEGER,
        error_message TEXT,
        download_count INTEGER DEFAULT 0,
        last_downloaded TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create document templates table for managing form templates
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_name VARCHAR(100) NOT NULL UNIQUE,
        form_type VARCHAR(50) NOT NULL,
        template_path VARCHAR(500) NOT NULL,
        version VARCHAR(20) DEFAULT '1.0',
        is_active BOOLEAN DEFAULT true,
        field_mappings JSONB DEFAULT '{}',
        validation_rules JSONB DEFAULT '{}',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create document access logs table for security audit
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_access_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
          'view', 'download', 'share', 'verify', 'delete'
        )),
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create document shares table for tracking shared documents
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_shares (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        shared_by UUID NOT NULL REFERENCES users(id),
        share_token VARCHAR(255) NOT NULL UNIQUE,
        share_type VARCHAR(50) DEFAULT 'public' CHECK (share_type IN (
          'public', 'private', 'temporary'
        )),
        password_protected BOOLEAN DEFAULT false,
        password_hash VARCHAR(255),
        max_downloads INTEGER,
        current_downloads INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
      CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON documents(verification_status);
      CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
      CREATE INDEX IF NOT EXISTS idx_documents_blockchain_tx_hash ON documents(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at) WHERE expires_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_documents_download_count ON documents(download_count);
      
      CREATE INDEX IF NOT EXISTS idx_document_templates_form_type ON document_templates(form_type);
      CREATE INDEX IF NOT EXISTS idx_document_templates_is_active ON document_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_document_templates_template_name ON document_templates(template_name);
      
      CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
      CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_document_access_logs_access_type ON document_access_logs(access_type);
      CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at ON document_access_logs(accessed_at);
      CREATE INDEX IF NOT EXISTS idx_document_access_logs_ip_address ON document_access_logs(ip_address);
      
      CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
      CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
      CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);
      CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at) WHERE expires_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_document_shares_is_active ON document_shares(is_active);
    `);

    // Create trigger for documents table
    await client.query(`
      DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
      CREATE TRIGGER update_documents_updated_at
        BEFORE UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger for document_templates table
    await client.query(`
      DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;
      CREATE TRIGGER update_document_templates_updated_at
        BEFORE UPDATE ON document_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create function to log document access
    await client.query(`
      CREATE OR REPLACE FUNCTION log_document_access()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' AND OLD.download_count != NEW.download_count THEN
          INSERT INTO document_access_logs (document_id, access_type, accessed_at)
          VALUES (NEW.id, 'download', CURRENT_TIMESTAMP);
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for automatic document access logging
    await client.query(`
      DROP TRIGGER IF EXISTS log_document_download ON documents;
      CREATE TRIGGER log_document_download
        AFTER UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION log_document_access();
    `);

    // Insert default document templates
    await client.query(`
      INSERT INTO document_templates (template_name, form_type, template_path, description) VALUES
      ('N240 Application Form', 'N240', '/templates/n240_blank.pdf', 'Application to ask the court to consider a statement of case'),
      ('N1 Claim Form', 'N1', '/templates/n1_blank.pdf', 'Claim form for starting court proceedings'),
      ('ET1 Employment Tribunal', 'ET1', '/templates/et1_blank.pdf', 'Employment tribunal claim form'),
      ('N244 Application Notice', 'N244', '/templates/n244_blank.pdf', 'Application to vary an order or injunction')
      ON CONFLICT (template_name) DO NOTHING;
    `);

    await client.query('COMMIT');
    logger.info('✅ Migration 003: Documents tables created successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 003 failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TRIGGER IF EXISTS log_document_download ON documents;');
    await client.query('DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;');
    await client.query('DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;');
    await client.query('DROP FUNCTION IF EXISTS log_document_access();');
    await client.query('DROP TABLE IF EXISTS document_shares CASCADE;');
    await client.query('DROP TABLE IF EXISTS document_access_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS document_templates CASCADE;');
    await client.query('DROP TABLE IF EXISTS documents CASCADE;');
    
    await client.query('COMMIT');
    logger.info('✅ Migration 003: Documents tables dropped successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 003 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};