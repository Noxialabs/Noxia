// ===================================================
// package.json dependencies to add
/*
npm install --save swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
*/

// ===================================================
// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Legal Case Management API',
    version: '1.0.0',
    description: 'API for managing legal cases with AI-powered escalation and blockchain integration',
    contact: {
      name: 'Legal Case Management Team',
      email: 'support@legalcasemanagement.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.legalcasemanagement.com' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token for admin authentication',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'super_admin'],
            description: 'User role in the system',
          },
          tier: {
            type: 'string',
            enum: ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
            description: 'User tier level',
          },
          first_name: {
            type: 'string',
            description: 'User first name',
          },
          last_name: {
            type: 'string',
            description: 'User last name',
          },
          is_active: {
            type: 'boolean',
            description: 'Whether user account is active',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
        },
      },
      Case: {
        type: 'object',
        required: ['title', 'client_name', 'description', 'issue_category'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique case identifier',
          },
          case_ref: {
            type: 'string',
            description: 'Human-readable case reference',
            example: 'CASE-2025-154-0001',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'ID of registered user who submitted case (null for public submissions)',
          },
          title: {
            type: 'string',
            description: 'Case title',
            example: 'Police Misconduct Report',
          },
          client_name: {
            type: 'string',
            description: 'Name of the client filing the case',
            example: 'John Doe',
          },
          client_email: {
            type: 'string',
            format: 'email',
            nullable: true,
            description: 'Client contact email',
          },
          client_phone: {
            type: 'string',
            nullable: true,
            description: 'Client contact phone',
          },
          description: {
            type: 'string',
            minLength: 50,
            description: 'Detailed case description (minimum 50 characters)',
          },
          jurisdiction: {
            type: 'string',
            nullable: true,
            description: 'Legal jurisdiction',
          },
          issue_category: {
            type: 'string',
            enum: [
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
            ],
            description: 'Category of the legal issue',
          },
          escalation_level: {
            type: 'string',
            enum: ['Basic', 'Priority', 'Urgent'],
            default: 'Basic',
            description: 'AI-determined escalation level',
          },
          escalation_flag: {
            type: 'boolean',
            description: 'Auto-generated flag indicating if case needs escalation',
          },
          ai_confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            nullable: true,
            description: 'AI confidence score for classification',
          },
          status: {
            type: 'string',
            enum: ['Pending', 'In Progress', 'Completed', 'Escalated', 'Closed'],
            default: 'Pending',
            description: 'Current case status',
          },
          priority: {
            type: 'string',
            enum: ['Low', 'Normal', 'High', 'Critical'],
            default: 'Normal',
            description: 'Case priority level',
          },
          urgency_score: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Urgency score from 1-10',
          },
          eth_tx_hash: {
            type: 'string',
            nullable: true,
            description: 'Ethereum transaction hash for blockchain audit trail',
          },
          is_public_submission: {
            type: 'boolean',
            default: false,
            description: 'Whether case was submitted by public user',
          },
          submission_date: {
            type: 'string',
            format: 'date-time',
            description: 'Case submission timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                url: { type: 'string' },
                size: { type: 'integer' },
                type: { type: 'string' },
              },
            },
            description: 'Case attachments',
          },
          suggested_actions: {
            type: 'array',
            items: { type: 'string' },
            description: 'AI-suggested actions for the case',
          },
        },
      },
      CaseSubmission: {
        type: 'object',
        required: ['title', 'client_name', 'description', 'issue_category'],
        properties: {
          title: {
            type: 'string',
            description: 'Case title',
            example: 'Police Misconduct Report',
          },
          client_name: {
            type: 'string',
            description: 'Name of the client filing the case',
            example: 'John Doe',
          },
          client_email: {
            type: 'string',
            format: 'email',
            description: 'Client contact email (required for public submissions)',
          },
          client_phone: {
            type: 'string',
            description: 'Client contact phone',
          },
          description: {
            type: 'string',
            minLength: 50,
            description: 'Detailed case description (minimum 50 characters)',
          },
          jurisdiction: {
            type: 'string',
            description: 'Legal jurisdiction',
          },
          issue_category: {
            type: 'string',
            enum: [
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
            ],
            description: 'Category of the legal issue',
          },
        },
      },
      AIClassification: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          case_id: {
            type: 'string',
            format: 'uuid',
          },
          issue_category: {
            type: 'string',
            description: 'AI-classified issue category',
          },
          escalation_level: {
            type: 'string',
            enum: ['Basic', 'Priority', 'Urgent'],
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
          },
          urgency_score: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
          },
          suggested_actions: {
            type: 'array',
            items: { type: 'string' },
          },
          processing_time_ms: {
            type: 'integer',
            description: 'Time taken for AI processing in milliseconds',
          },
          model_used: {
            type: 'string',
            description: 'AI model used for classification',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ], // Path to the API files
};

export const specs = swaggerJsdoc(options);


