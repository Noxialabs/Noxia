import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import Joi from 'joi';

const router = Router();
const authController = new AuthController();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'any.required': 'Password is required'
  }),
  ethAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional().messages({
    'string.pattern.base': 'Invalid Ethereum address format'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

const updateProfileSchema = Joi.object({
  ethAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional().allow('')
});

// Routes
router.post('/register', 
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 attempts per 15 minutes
  validationMiddleware(registerSchema),
  authController.register
);

router.post('/login',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 attempts per 15 minutes
  validationMiddleware(loginSchema),
  authController.login
);

router.get('/profile',
  authMiddleware,
  authController.profile
);

router.put('/profile',
  authMiddleware,
  validationMiddleware(updateProfileSchema),
  authController.updateProfile
);

router.put('/change-password',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 attempts per hour
  validationMiddleware(changePasswordSchema),
  authController.changePassword
);

// Admin routes (if needed)
router.get('/users',
  authMiddleware,
  // Add admin middleware here
  async (req, res) => {
    res.json({ message: 'Admin users endpoint - implement admin check' });
  }
);

export default router;
