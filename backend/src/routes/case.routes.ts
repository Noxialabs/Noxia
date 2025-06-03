import { Router } from "express";
import { CaseController } from "../controllers/case.controller";
import {
  adminMiddleware,
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware";
import { validationMiddleware } from "../middleware/validation.middleware";
import { tierCheckMiddleware } from "../middleware/tier-check.middleware";
import Joi from "joi";

const router = Router();
const caseController = new CaseController();

// Validation schemas
const submitCaseSchema = Joi.object({
  clientName: Joi.string().min(2).max(255).required().messages({
    "string.min": "Client name must be at least 2 characters",
    "string.max": "Client name cannot exceed 255 characters",
    "any.required": "Client name is required",
  }),
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().min(50).max(5000).required().messages({
    "string.min": "Case description must be at least 50 characters",
    "string.max": "Case description cannot exceed 5000 characters",
    "any.required": "Case description is required",
  }),
  jurisdiction: Joi.string().max(100).optional(),
  attachments: Joi.array().items(Joi.object()).optional(),
});

const updateCaseSchema = Joi.object({
  clientName: Joi.string().min(2).max(255).optional(),
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().min(50).max(5000).optional(),
  jurisdiction: Joi.string().max(100).optional(),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Escalated", "Closed")
    .optional(),
  priority: Joi.string().valid("Low", "Normal", "High", "Critical").optional(),
  attachments: Joi.array().items(Joi.object()).optional(),
});

const escalateCaseSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required().messages({
    "string.min": "Escalation reason must be at least 10 characters",
    "any.required": "Escalation reason is required",
  }),
  priority: Joi.string().valid("High", "Critical").optional(),
});

const getCasesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Escalated", "Closed")
    .optional(),
  priority: Joi.string().valid("Low", "Normal", "High", "Critical").optional(),
  search: Joi.string().min(3).max(100).optional(),
});

// Apply authentication to all routes
//router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     CaseSubmissionRequest:
 *       type: object
 *       required:
 *         - clientName
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Title of the case
 *           example: "Test title"
 *         clientName:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *           description: Name of the client filing the case
 *           example: "John Doe"
 *         description:
 *           type: string
 *           minLength: 50
 *           maxLength: 5000
 *           description: Detailed case description
 *           example: "This case involves alleged police misconduct during a traffic stop on Main Street. The officer used excessive force without proper justification, and there were multiple witnesses present during the incident."
 *         jurisdiction:
 *           type: string
 *           maxLength: 100
 *           description: Legal jurisdiction
 *           example: "New York County"
 *     CaseUpdateRequest:
 *       type: object
 *       properties:
 *         clientName:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *         description:
 *           type: string
 *           minLength: 50
 *           maxLength: 5000
 *         jurisdiction:
 *           type: string
 *           maxLength: 100
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Escalated, Closed]
 *         priority:
 *           type: string
 *           enum: [Low, Normal, High, Critical]
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *     EscalationRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *           description: Reason for escalation
 *           example: "Case requires immediate attention due to potential safety concerns"
 *         priority:
 *           type: string
 *           enum: [High, Critical]
 *           description: New priority level after escalation
 *     CaseStats:
 *       type: object
 *       properties:
 *         totalCases:
 *           type: integer
 *           description: Total number of cases
 *         casesByStatus:
 *           type: object
 *           properties:
 *             pending:
 *               type: integer
 *             inProgress:
 *               type: integer
 *             completed:
 *               type: integer
 *             escalated:
 *               type: integer
 *             closed:
 *               type: integer
 *         casesByPriority:
 *           type: object
 *           properties:
 *             low:
 *               type: integer
 *             normal:
 *               type: integer
 *             high:
 *               type: integer
 *             critical:
 *               type: integer
 *         averageResolutionTime:
 *           type: number
 *           description: Average resolution time in days
 *         escalationRate:
 *           type: number
 *           description: Percentage of cases that get escalated
 */

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Submit a new case
 *     description: Submit a new legal case. Available to all authenticated users (Tier 1-4).
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaseSubmissionRequest'
 *     responses:
 *       201:
 *         description: Case submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Case'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   code: "VALIDATION_ERROR"
 *                   details:
 *                     clientName: "Client name must be at least 2 characters"
 *                     description: "Case description must be at least 50 characters"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient tier access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  optionalAuthMiddleware,
  validationMiddleware(submitCaseSchema),
  //tierCheckMiddleware(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']), // All tiers can submit cases
  caseController.submitCase
);

/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Get all cases with filtering and pagination
 *     description: Retrieve cases with optional filtering by status, priority, and search terms. Supports pagination.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of cases per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Escalated, Closed]
 *         description: Filter by case status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Normal, High, Critical]
 *         description: Filter by case priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description: Search term for case title and description (minimum 3 characters)
 *     responses:
 *       200:
 *         description: Cases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         cases:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Case'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 10
 *                             total:
 *                               type: integer
 *                               example: 25
 *                             totalPages:
 *                               type: integer
 *                               example: 3
 *                             hasNext:
 *                               type: boolean
 *                               example: true
 *                             hasPrev:
 *                               type: boolean
 *                               example: false
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(getCasesSchema, "query"),
  caseController.getCases
);

/**
 * @swagger
 * /api/cases/stats:
 *   get:
 *     summary: Get case statistics
 *     description: Retrieve comprehensive statistics about cases including counts by status, priority, and performance metrics.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Case statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CaseStats'
 *             example:
 *               success: true
 *               message: "Case statistics retrieved successfully"
 *               data:
 *                 totalCases: 156
 *                 casesByStatus:
 *                   pending: 45
 *                   inProgress: 32
 *                   completed: 67
 *                   escalated: 8
 *                   closed: 4
 *                 casesByPriority:
 *                   low: 23
 *                   normal: 98
 *                   high: 28
 *                   critical: 7
 *                 averageResolutionTime: 12.5
 *                 escalationRate: 15.2
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  caseController.getCaseStats
);

/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Get case by ID
 *     description: Retrieve detailed information about a specific case by its unique identifier.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique case identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Case retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Case'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Case not found"
 *               code: "CASE_NOT_FOUND"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authMiddleware, adminMiddleware, caseController.getCaseById);

/**
 * @swagger
 * /api/cases/{id}:
 *   put:
 *     summary: Update case details
 *     description: Update case information including status, priority, and other details. Users can only update their own cases unless they have appropriate permissions.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique case identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaseUpdateRequest'
 *           example:
 *             status: "In Progress"
 *             priority: "High"
 *             description: "Updated case description with additional details about the incident."
 *     responses:
 *       200:
 *         description: Case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Case'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Cannot update this case
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(updateCaseSchema),
  caseController.updateCase
);

/**
 * @swagger
 * /api/cases/{id}:
 *   delete:
 *     summary: Delete case (Tier 3-4 only)
 *     description: Permanently delete a case. Only available to users with Tier 3 or Tier 4 access levels.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique case identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Case deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Case deleted successfully"
 *               data:
 *                 deletedCaseId: "550e8400-e29b-41d4-a716-446655440000"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient tier access (requires Tier 3 or 4)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Access denied. Tier 3 or higher required."
 *               code: "INSUFFICIENT_TIER"
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  //tierCheckMiddleware(["Tier 3", "Tier 4"]), // Higher tiers can delete cases
  caseController.deleteCase
);

/**
 * @swagger
 * /api/cases/{id}/escalate:
 *   post:
 *     summary: Escalate case (Tier 2-4 only)
 *     description: Escalate a case to higher priority with justification. Available to users with Tier 2, 3, or 4 access levels.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique case identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EscalationRequest'
 *           example:
 *             reason: "Case involves potential safety threat that requires immediate attention from senior staff."
 *             priority: "Critical"
 *     responses:
 *       200:
 *         description: Case escalated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         case:
 *                           $ref: '#/components/schemas/Case'
 *                         escalation:
 *                           type: object
 *                           properties:
 *                             escalated_by:
 *                               type: string
 *                               format: uuid
 *                             escalated_at:
 *                               type: string
 *                               format: date-time
 *                             reason:
 *                               type: string
 *                             previous_priority:
 *                               type: string
 *                             new_priority:
 *                               type: string
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   code: "VALIDATION_ERROR"
 *                   details:
 *                     reason: "Escalation reason must be at least 10 characters"
 *               already_escalated:
 *                 value:
 *                   success: false
 *                   message: "Case is already escalated"
 *                   code: "ALREADY_ESCALATED"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient tier access (requires Tier 2 or higher)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Access denied. Tier 2 or higher required for case escalation."
 *               code: "INSUFFICIENT_TIER"
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/escalate",
  validationMiddleware(escalateCaseSchema),
  tierCheckMiddleware(["Tier 2", "Tier 3", "Tier 4"]), // Tier 1 cannot escalate
  caseController.escalateCase
);

export default router;
