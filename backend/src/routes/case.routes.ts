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
  escalationLevel: Joi.string().valid("Basic", "Priority", "Urgent").optional(),
  search: Joi.string().min(3).max(100).optional(),
});

router.post(
  "/",
  optionalAuthMiddleware,
  validationMiddleware(submitCaseSchema),
  //tierCheckMiddleware(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']), // All tiers can submit cases
  caseController.submitCase
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(getCasesSchema, "query"),
  caseController.getCases
);

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  caseController.getCaseStats
);
router.get(
  "/dashboard-stats",
  authMiddleware,
  adminMiddleware,
  caseController.getDashboardStats
);

router.get("/:id", authMiddleware, adminMiddleware, caseController.getCaseById);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(updateCaseSchema),
  caseController.updateCase
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  //tierCheckMiddleware(["Tier 3", "Tier 4"]), // Higher tiers can delete cases
  caseController.deleteCase
);

router.post(
  "/:id/escalate",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(escalateCaseSchema),
  caseController.escalateCase
);

router.post(
  "/:id/escalate/preview",
  authMiddleware,
  adminMiddleware,
  caseController.previewEscalation
);

export default router;
