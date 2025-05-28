// src/database/seeds/initial_data.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';

export class InitialDataSeeder {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async seed(): Promise<void> {
    logger.info('🌱 Starting database seeding...');

    try {
      await this.seedUsers();
      await this.seedCases();
      await this.seedDocuments();
      await this.seedTierPermissions();
      await this.seedDocumentTemplates();
      
      logger.info('✅ Database seeding completed successfully');
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    logger.info('📝 Seeding users...');

    const users = [
      {
        id: uuidv4(),
        email: 'admin@999plus.org',
        password: await bcrypt.hash('AdminPass123!', 12),
        eth_address: '0x1234567890123456789012345678901234567890',
        tier: 'Tier 4',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'demo@999plus.org',
        password: await bcrypt.hash('DemoPass123!', 12),
        eth_address: '0x2345678901234567890123456789012345678901',
        tier: 'Tier 2',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'test@999plus.org',
        password: await bcrypt.hash('TestPass123!', 12),
        eth_address: '0x3456789012345678901234567890123456789012',
        tier: 'Tier 1',
        is_active: true,
        email_verified: false
      },
      {
        id: uuidv4(),
        email: 'premium@999plus.org',
        password: await bcrypt.hash('PremiumPass123!', 12),
        eth_address: '0x4567890123456789012345678901234567890123',
        tier: 'Tier 3',
        is_active: true,
        email_verified: true
      }
    ];

    for (const user of users) {
      await this.pool.query(`
        INSERT INTO users (
          id, email, password_hash, eth_address, tier, 
          is_active, email_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO NOTHING
      `, [
        user.id, user.email, user.password, user.eth_address, 
        user.tier, user.is_active, user.email_verified
      ]);
    }

    logger.info(`✅ Seeded ${users.length} users`);
  }

  private async seedCases(): Promise<void> {
    logger.info('📝 Seeding sample cases...');

    // Get user IDs for foreign key references
    const usersResult = await this.pool.query('SELECT id, email FROM users LIMIT 4');
    const users = usersResult.rows;

    if (users.length === 0) {
      logger.warn('No users found, skipping case seeding');
      return;
    }

    const cases = [
      {
        id: uuidv4(),
        case_ref: 'CASE-2025-001',
        user_id: users[0].id,
        client_name: 'John Smith',
        description: 'Report of police misconduct during arrest. Officer failed to follow proper procedures and used excessive force without justification. Multiple witnesses present.',
        jurisdiction: 'Greater Manchester',
        issue_category: 'Corruption - Police',
        escalation_level: 'Priority',
        ai_confidence: 0.89,
        status: 'In Progress',
        priority: 'High',
        urgency_score: 8
      },
      {
        id: uuidv4(),
        case_ref: 'CASE-2025-002',
        user_id: users[1].id,
        client_name: 'Sarah Johnson',
        description: 'Government official requesting bribes for planning permission approval. Have recorded conversations and documentation as evidence.',
        jurisdiction: 'London Borough of Camden',
        issue_category: 'Corruption - Government',
        escalation_level: 'Urgent',
        ai_confidence: 0.94,
        status: 'Escalated',
        priority: 'Critical',
        urgency_score: 9
      },
      {
        id: uuidv4(),
        case_ref: 'CASE-2025-003',
        user_id: users[2].id,
        client_name: 'Michael Brown',
        description: 'Workplace discrimination based on ethnicity. Manager making inappropriate comments and blocking promotion opportunities.',
        jurisdiction: 'West Midlands',
        issue_category: 'Legal - Employment',
        escalation_level: 'Basic',
        ai_confidence: 0.76,
        status: 'Pending',
        priority: 'Normal',
        urgency_score: 5
      },
      {
        id: uuidv4(),
        case_ref: 'CASE-2025-004',
        user_id: users[3].id,
        client_name: 'Emma Wilson',
        description: 'Landlord refusing to return deposit without valid reasons. Property was left in good condition with professional cleaning.',
        jurisdiction: 'Yorkshire and Humber',
        issue_category: 'Legal - Housing',
        escalation_level: 'Basic',
        ai_confidence: 0.82,
        status: 'Pending',
        priority: 'Normal',
        urgency_score: 4
      },
      {
        id: uuidv4(),
        case_ref: 'CASE-2025-005',
        user_id: users[0].id,
        client_name: 'David Lee',
        description: 'Threats and harassment from neighbor escalating to physical intimidation. Police reports filed but no action taken.',
        jurisdiction: 'Merseyside',
        issue_category: 'Criminal - Harassment',
        escalation_level: 'Priority',
        ai_confidence: 0.87,
        status: 'In Progress',
        priority: 'High',
        urgency_score: 7
      }
    ];

    for (const caseData of cases) {
      await this.pool.query(`
        INSERT INTO cases (
          id, case_ref, user_id, client_name, description, jurisdiction,
          issue_category, escalation_level, ai_confidence, status, 
          priority, urgency_score, submission_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT (case_ref) DO NOTHING
      `, [
        caseData.id, caseData.case_ref, caseData.user_id, caseData.client_name,
        caseData.description, caseData.jurisdiction, caseData.issue_category,
        caseData.escalation_level, caseData.ai_confidence, caseData.status,
        caseData.priority, caseData.urgency_score
      ]);
    }

    // Seed AI classifications for these cases
    const casesResult = await this.pool.query('SELECT id FROM cases LIMIT 5');
    const caseIds = casesResult.rows.map(row => row.id);

    for (let i = 0; i < caseIds.length; i++) {
      await this.pool.query(`
        INSERT INTO ai_classifications (
          id, case_id, input_text, issue_category, escalation_level,
          confidence, urgency_score, suggested_actions, processing_time_ms,
          model_used, tokens_used, cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        uuidv4(), caseIds[i], cases[i].description, cases[i].issue_category,
        cases[i].escalation_level, cases[i].ai_confidence, cases[i].urgency_score,
        JSON.stringify(['Document evidence', 'Legal consultation', 'Report to authorities']),
        Math.floor(Math.random() * 3000) + 1000, 'gpt-4', 
        Math.floor(Math.random() * 500) + 200, 0.02
      ]);
    }

    logger.info(`✅ Seeded ${cases.length} cases with AI classifications`);
  }

  private async seedDocuments(): Promise<void> {
    logger.info('📝 Seeding sample documents...');

    // Get case IDs for foreign key references
    const casesResult = await this.pool.query('SELECT id FROM cases LIMIT 3');
    const caseIds = casesResult.rows.map(row => row.id);

    if (caseIds.length === 0) {
      logger.warn('No cases found, skipping document seeding');
      return;
    }

    const documents = [
      {
        id: uuidv4(),
        case_id: caseIds[0],
        document_type: 'N240',
        file_name: 'N240_police_misconduct_application.pdf',
        file_path: '/storage/documents/N240_police_misconduct_application.pdf',
        file_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012',
        blockchain_tx_hash: '0xabc123def456789012345678901234567890abcdef123456789012345678901234',
        qr_code_path: '/storage/qr_codes/qr_a1b2c3d4e5f6.png',
        status: 'Verified'
      },
      {
        id: uuidv4(),
        case_id: caseIds[1],
        document_type: 'N1',
        file_name: 'N1_corruption_claim_form.pdf',
        file_path: '/storage/documents/N1_corruption_claim_form.pdf',
        file_hash: 'b2c3d4e5f67890123456789012345678901abcdef2345678901234567890123',
        blockchain_tx_hash: '0xdef456abc789012345678901234567890123abcdef456789012345678901234',
        qr_code_path: '/storage/qr_codes/qr_b2c3d4e5f678.png',
        status: 'Verified'
      },
      {
        id: uuidv4(),
        case_id: caseIds[2],
        document_type: 'ET1',
        file_name: 'ET1_employment_discrimination.pdf',
        file_path: '/storage/documents/ET1_employment_discrimination.pdf',
        file_hash: 'c3d4e5f6789012345678901234567890123abcdef34567890123456789012345',
        status: 'Generated'
      },
      {
        id: uuidv4(),
        case_id: caseIds[0],
        document_type: 'Other',
        file_name: 'witness_statement_001.pdf',
        file_path: '/storage/documents/witness_statement_001.pdf',
        file_hash: 'd4e5f678901234567890123456789012345abcdef456789012345678901234567',
        status: 'Generated'
      }
    ];

    for (const doc of documents) {
      await this.pool.query(`
        INSERT INTO documents (
          id, case_id, document_type, file_name, file_path, file_hash,
          blockchain_tx_hash, qr_code_path, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `, [
        doc.id, doc.case_id, doc.document_type, doc.file_name,
        doc.file_path, doc.file_hash, doc.blockchain_tx_hash || null,
        doc.qr_code_path || null, doc.status
      ]);
    }

    logger.info(`✅ Seeded ${documents.length} documents`);
  }

  private async seedTierPermissions(): Promise<void> {
    logger.info('📝 Seeding tier permissions...');

    // Get user IDs to create user_tiers
    const usersResult = await this.pool.query('SELECT id, tier, eth_address FROM users');
    const users = usersResult.rows;

    // Create user_tiers records
    for (const user of users) {
      const ethBalance = this.getTierBalance(user.tier);
      await this.pool.query(`
        INSERT INTO user_tiers (
          id, user_id, tier, eth_balance, eth_address, 
          last_balance_check, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), user.id, user.tier, ethBalance, user.eth_address
      ]);
    }

    logger.info(`✅ Seeded user tiers for ${users.length} users`);
  }

  private async seedDocumentTemplates(): Promise<void> {
    logger.info('📝 Seeding document templates...');

    const templates = [
      {
        id: uuidv4(),
        template_name: 'N240 Application Form',
        form_type: 'N240',
        template_path: '/templates/n240_blank.pdf',
        version: '2024.1',
        is_active: true,
        field_mappings: JSON.stringify({
          court_name: 'Court Name',
          case_number: 'Case Number',
          claimant_name: 'Claimant Name',
          defendant_name: 'Defendant Name',
          request_details: 'Request Details',
          signature_name: 'Signature Name',
          signature_date: 'Date'
        }),
        validation_rules: JSON.stringify({
          required_fields: ['court_name', 'claimant_name', 'request_details'],
          max_lengths: {
            court_name: 100,
            case_number: 50,
            claimant_name: 100,
            defendant_name: 100,
            request_details: 2000
          }
        }),
        description: 'Application to ask the court to consider a statement of case'
      },
      {
        id: uuidv4(),
        template_name: 'N1 Claim Form',
        form_type: 'N1',
        template_path: '/templates/n1_blank.pdf',
        version: '2024.1',
        is_active: true,
        field_mappings: JSON.stringify({
          court_name: 'Court Name',
          case_number: 'Case Number',
          claimant_name: 'Claimant Name',
          defendant_name: 'Defendant Name',
          claim_details: 'Claim Details',
          amount_claimed: 'Amount Claimed',
          signature_name: 'Signature Name',
          signature_date: 'Date'
        }),
        validation_rules: JSON.stringify({
          required_fields: ['court_name', 'claimant_name', 'defendant_name', 'claim_details'],
          max_lengths: {
            court_name: 100,
            claimant_name: 100,
            defendant_name: 100,
            claim_details: 5000
          }
        }),
        description: 'Claim form for starting court proceedings'
      },
      {
        id: uuidv4(),
        template_name: 'ET1 Employment Tribunal',
        form_type: 'ET1',
        template_path: '/templates/et1_blank.pdf',
        version: '2024.1',
        is_active: true,
        field_mappings: JSON.stringify({
          claimant_name: 'Claimant Name',
          respondent_name: 'Respondent Name',
          employment_details: 'Employment Details',
          complaint_details: 'Complaint Details',
          remedy_sought: 'Remedy Sought',
          signature_name: 'Signature Name',
          signature_date: 'Date'
        }),
        validation_rules: JSON.stringify({
          required_fields: ['claimant_name', 'respondent_name', 'complaint_details'],
          max_lengths: {
            claimant_name: 100,
            respondent_name: 100,
            employment_details: 1000,
            complaint_details: 5000,
            remedy_sought: 1000
          }
        }),
        description: 'Employment tribunal claim form'
      }
    ];

    for (const template of templates) {
      await this.pool.query(`
        INSERT INTO document_templates (
          id, template_name, form_type, template_path, version,
          is_active, field_mappings, validation_rules, description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (template_name) DO NOTHING
      `, [
        template.id, template.template_name, template.form_type,
        template.template_path, template.version, template.is_active,
        template.field_mappings, template.validation_rules, template.description
      ]);
    }

    logger.info(`✅ Seeded ${templates.length} document templates`);
  }

  private getTierBalance(tier: string): number {
    switch (tier) {
      case 'Tier 1': return Math.random() * 0.9; // 0-0.9 ETH
      case 'Tier 2': return 1 + Math.random() * 3.9; // 1-4.9 ETH
      case 'Tier 3': return 5 + Math.random() * 4.9; // 5-9.9 ETH
      case 'Tier 4': return 10 + Math.random() * 90; // 10+ ETH
      default: return 0;
    }
  }

  async clean(): Promise<void> {
    logger.info('🧹 Cleaning existing seed data...');

    const tables = [
      'tier_balance_checks',
      'tier_history', 
      'user_tiers',
      'document_access_logs',
      'document_shares',
      'documents',
      'document_templates',
      'case_activities',
      'ai_classifications',
      'cases',
      'users'
    ];

    for (const table of tables) {
      await this.pool.query(`DELETE FROM ${table} WHERE created_at IS NOT NULL`);
    }

    logger.info('✅ Seed data cleaned');
  }
}

// Seed runner script
export async function runSeeds(pool: Pool, options: { clean?: boolean } = {}): Promise<void> {
  const seeder = new InitialDataSeeder(pool);

  if (options.clean) {
    await seeder.clean();
  }

  await seeder.seed();
}

// CLI interface if run directly
if (require.main === module) {
  async function main() {
    const { Pool } = require('pg');
    const dotenv = require('dotenv');
    
    dotenv.config();

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      const shouldClean = process.argv.includes('--clean');
      await runSeeds(pool, { clean: shouldClean });
      logger.info('🎉 Seeding completed successfully');
    } catch (error) {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }

  main();
}