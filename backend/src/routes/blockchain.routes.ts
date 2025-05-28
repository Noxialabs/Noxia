import { Router } from 'express';
import { BlockchainController } from '../controllers/blockchain.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { tierCheckMiddleware } from '../middleware/tier-check.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import Joi from 'joi';

const router = Router();
const blockchainController = new BlockchainController();

// Validation schemas
const getTierSchema = Joi.object({
  ethAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required().messages({
    'string.pattern.base': 'Invalid Ethereum address format',
    'any.required': 'Ethereum address is required'
  })
});

const hashDocumentSchema = Joi.object({
  documentPath: Joi.string().required(),
  caseId: Joi.string().uuid().optional(),
  documentType: Joi.string().valid('N240', 'N1', 'ET1', 'Other').optional()
});

const registerHashSchema = Joi.object({
  documentHash: Joi.string().length(64).pattern(/^[a-fA-F0-9]+$/).required().messages({
    'string.length': 'Document hash must be 64 characters',
    'string.pattern.base': 'Document hash must be hexadecimal',
    'any.required': 'Document hash is required'
  }),
  documentId: Joi.string().uuid().optional(),
  caseId: Joi.string().uuid().optional()
});

const verifyDocumentSchema = Joi.object({
  documentPath: Joi.string().required(),
  expectedHash: Joi.string().length(64).pattern(/^[a-fA-F0-9]+$/).optional()
});

const generateQRSchema = Joi.object({
  documentHash: Joi.string().length(64).pattern(/^[a-fA-F0-9]+$/).required(),
  txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
  metadata: Joi.object().optional()
});

// Apply authentication to all routes
router.use(authMiddleware);

// Tier information - all tiers
router.post('/tier',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }), // 10 requests per minute
  validationMiddleware(getTierSchema),
  blockchainController.getTierInfo
);

router.put('/tier',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }), // 5 updates per minute
  validationMiddleware(getTierSchema),
  blockchainController.updateTier
);

// Wallet balance check - all tiers
router.get('/balance/:ethAddress',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }),
  blockchainController.getWalletBalance
);

// Document hashing - Tier 2+ only
router.post('/hash',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(hashDocumentSchema),
  blockchainController.hashDocument
);

// Blockchain registration - Tier 3+ only (costs gas)
router.post('/register',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 3 }), // Limited due to gas costs
  validationMiddleware(registerHashSchema),
  blockchainController.registerDocumentHash
);

// Document verification - all tiers
router.post('/verify',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 15 }),
  validationMiddleware(verifyDocumentSchema),
  blockchainController.verifyDocument
);

// Transaction status - all tiers
router.get('/transaction/:txHash',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }),
  blockchainController.getTransactionStatus
);

// QR code generation - Tier 2+ only
router.post('/qr',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(generateQRSchema),
  blockchainController.generateQRCode
);

// Blockchain statistics
router.get('/stats',
  blockchainController.getBlockchainStats
);

export default router;