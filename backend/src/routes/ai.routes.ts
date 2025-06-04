import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { tierCheckMiddleware } from '../middleware/tier-check.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import Joi from 'joi';

const router = Router();
const aiController = new AIController();

// Validation schemas
const classifyTextSchema = Joi.object({
  text: Joi.string().min(10).max(10000).required().messages({
    'string.min': 'Text must be at least 10 characters for classification',
    'string.max': 'Text cannot exceed 10000 characters',
    'any.required': 'Text is required for classification'
  }),
  context: Joi.object().optional(),
  caseId: Joi.string().uuid().optional()
});

const reclassifySchema = Joi.object({
  text: Joi.string().min(10).max(10000).required(),
  context: Joi.object().optional()
});

const analyzeEscalationSchema = Joi.object({
  subject: Joi.string().min(5).max(500).required(),
  body: Joi.string().min(10).max(5000).required(),
  customerTier: Joi.string().valid('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4').optional(),
  urgency: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  context: Joi.object().optional()
});

const getHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  timeframe: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
});

// Apply authentication to all routes
router.use(authMiddleware);

// Basic classification - available to all tiers
router.post('/classify',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }), // 20 requests per minute
  validationMiddleware(classifyTextSchema),
  aiController.classifyText
);

// Reclassification - higher tiers only
router.post('/reclassify/:caseId',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(reclassifySchema),
  aiController.reclassifyCase
);

// Classification history
router.get('/history',
  validationMiddleware(getHistorySchema, 'query'),
  aiController.getClassificationHistory
);

// Classification statistics
router.get('/stats',
  aiController.getClassificationStats
);

// Escalation analysis - Tier 2+ only
/* router.post('/analyze-escalation',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(analyzeEscalationSchema),
  aiController.analyzeEscalation
); */

// Case summary generation - Tier 3+ only
router.post('/generate-summary/:caseId',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }),
  aiController.generateSummary
);

export default router;