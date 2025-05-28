import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { tierCheckMiddleware } from '../middleware/tier-check.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import Joi from 'joi';

const router = Router();
const notificationController = new NotificationController();

// Validation schemas
const sendNotificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid('email', 'sms', 'push', 'webhook').required(),
  title: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  caseId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional()
});

const sendEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(5000).optional(),
  template: Joi.string().valid('case-submitted', 'tier-upgraded', 'document-ready', 'escalation-alert').optional(),
  templateData: Joi.object().optional(),
  caseId: Joi.string().uuid().optional()
}).xor('message', 'template'); // Either message or template required

const sendSMSSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
  }),
  message: Joi.string().min(10).max(160).required().messages({
    'string.max': 'SMS message cannot exceed 160 characters'
  }),
  caseId: Joi.string().uuid().optional()
});

const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid('Pending', 'Sent', 'Failed', 'Read').optional(),
  type: Joi.string().valid('email', 'sms', 'push', 'webhook').optional()
});

const bulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).optional(),
  type: Joi.string().valid('email', 'sms', 'push').required(),
  title: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  filters: Joi.object({
    tier: Joi.string().valid('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4').optional(),
    status: Joi.string().optional(),
    lastActive: Joi.date().optional()
  }).optional(),
  metadata: Joi.object().optional()
}).or('userIds', 'filters'); // Either userIds or filters required

const scheduleNotificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid('email', 'sms', 'push').required(),
  title: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  scheduledFor: Joi.date().greater('now').required().messages({
    'date.greater': 'Scheduled time must be in the future'
  }),
  caseId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional()
});

const webhookSchema = Joi.object({
  url: Joi.string().uri().required(),
  payload: Joi.object().required(),
  headers: Joi.object().optional(),
  caseId: Joi.string().uuid().optional()
});

const updatePreferencesSchema = Joi.object({
  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  pushEnabled: Joi.boolean().optional(),
  caseUpdates: Joi.boolean().optional(),
  escalationAlerts: Joi.boolean().optional(),
  documentReady: Joi.boolean().optional(),
  tierChanges: Joi.boolean().optional()
});

// Apply authentication to all routes
router.use(authMiddleware);

// Basic notification sending - Tier 2+ only (to prevent spam)
router.post('/',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }),
  validationMiddleware(sendNotificationSchema),
  notificationController.sendNotification
);

// Email sending - Tier 2+ only
router.post('/email',
  tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }),
  validationMiddleware(sendEmailSchema),
  notificationController.sendEmail
);

// SMS sending - Tier 3+ only (higher cost)
router.post('/sms',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 3 }),
  validationMiddleware(sendSMSSchema),
  notificationController.sendSMS
);

// Webhook sending - Tier 3+ only
router.post('/webhook',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }),
  validationMiddleware(webhookSchema),
  notificationController.sendWebhook
);

// Get user's notifications
router.get('/',
  validationMiddleware(getNotificationsSchema, 'query'),
  notificationController.getNotifications
);

// Mark notification as read
router.put('/:id/read',
  notificationController.markAsRead
);

// Mark all notifications as read
router.put('/read-all',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }),
  notificationController.markAllAsRead
);

// Delete notification
router.delete('/:id',
  notificationController.deleteNotification
);

// Notification statistics
router.get('/stats',
  notificationController.getNotificationStats
);

// Bulk notifications - Tier 4 only (admin feature)
router.post('/bulk',
  tierCheckMiddleware(['Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 2 }),
  validationMiddleware(bulkNotificationSchema),
  notificationController.sendBulkNotification
);

// Schedule notification - Tier 3+ only
router.post('/schedule',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 }),
  validationMiddleware(scheduleNotificationSchema),
  notificationController.scheduleNotification
);

// Get scheduled notifications
router.get('/scheduled',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  notificationController.getScheduledNotifications
);

// Cancel scheduled notification
router.delete('/scheduled/:id',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  notificationController.cancelScheduledNotification
);

// Notification preferences
router.get('/preferences',
  notificationController.getNotificationPreferences
);

router.put('/preferences',
  validationMiddleware(updatePreferencesSchema),
  notificationController.updateNotificationPreferences
);

// Retry failed notification - Tier 3+ only
router.post('/:id/retry',
  tierCheckMiddleware(['Tier 3', 'Tier 4']),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 3 }),
  notificationController.retryFailedNotification
);

export default router;