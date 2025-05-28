import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { tierCheckMiddleware } from '../middleware/tier-check.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import Joi from 'joi';

const router = Router();
const documentController = new DocumentController();

// Validation schemas
const generateFormSchema = Joi.object({
  formType: Joi.string().valid('N240', 'N1', 'ET1').required().messages({
    'any.only': 'Form type must be one of: N240, N1, ET1',
    'any.required': 'Form type is required'
  }),
  caseId: Joi.string().uuid().optional(),
  formData: Joi.object({
    // N240 fields
    courtName: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    caseNumber: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    claimantName: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    defendantName: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    requestDetails: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    signatureName: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    signatureDate: Joi.string().when('formType', { is: 'N240', then: Joi.required() }),
    
    // N1 fields
    claimantAddress: Joi.string().when('formType', { is: 'N1', then: Joi.required() }),
    defendantAddress: Joi.string().when('formType', { is: 'N1', then: Joi.required() }),
    claimAmount: Joi.string().when('formType', { is: 'N1', then: Joi.required() }),
    claimDetails: Joi.string().when('formType', { is: 'N1', then: Joi.required() }),
    
    // ET1 fields
    respondentName: Joi.string().when('formType', { is: 'ET1', then: Joi.required() }),
    respondentAddress: Joi.string().when('formType', { is: 'ET1', then: Joi.required() }),
    employmentDetails: Joi.string().when('formType', { is: 'ET1', then: Joi.required() })
  }).required()
});

const uploadDocumentSchema = Joi.object({
  caseId: Joi.string().uuid().optional(),
  documentType: Joi.string().valid('N240', 'N1', 'ET1', 'Other').optional()
});

const getDocumentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  caseId: Joi.string().uuid().optional(),
  documentType: Joi.string().valid('N240', 'N1', 'ET1', 'Other').optional(),
  status: Joi.string().valid('Generated', 'Verified', 'Archived').optional()
});

const searchDocumentsSchema = Joi.object({
  search: Joi.string().min(3).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  documentType: Joi.string().valid('N240', 'N1', 'ET1', 'Other').optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

// Apply authentication to all routes
router.use(authMiddleware);

// Form generation - Tier 1+ (basic tier gets limited forms)
router.post('/generate',
  tierCheckMiddleware(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }), // 5 forms per minute
  validationMiddleware(generateFormSchema),
  documentController.generateForm
);

// Document upload - all tiers
router.post('/upload',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(uploadDocumentSchema, 'body'),
  documentController.uploadDocument
);

// Get documents list
router.get('/',
  validationMiddleware(getDocumentsSchema, 'query'),
  documentController.getDocuments
);

// Search documents - Tier 2+ only
router.get('/search',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  validationMiddleware(searchDocumentsSchema, 'query'),
  documentController.getDocuments // Reuse with search functionality
);

// Document statistics
router.get('/stats',
  documentController.getDocumentStats
);

// Get specific document
router.get('/:id',
  documentController.getDocument
);

// Download document
router.get('/:id/download',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }),
  documentController.downloadDocument
);

// Preview document - Tier 2+ only
router.get('/:id/preview',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  documentController.previewDocument
);

// Get QR code for document
router.get('/:id/qr',
  documentController.getQRCode
);

// Generate QR code for document - Tier 2+ only
router.post('/:id/qr',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  documentController.generateQRCode
);

// Delete document - Tier 3+ only
router.delete('/:id',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  documentController.deleteDocument
);

export default router;