import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/auth.middleware";
import { validationMiddleware } from "../middleware/validation.middleware";
import Joi from "joi";

const router = Router();
const userController = new UserController();

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(20).optional(),
  organization: Joi.string().max(255).optional(),
  eth_address: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .allow(null),
  tier: Joi.string().valid("Tier 1", "Tier 2", "Tier 3", "Tier 4").optional(),
  role: Joi.string().valid("user", "admin").optional(),
  is_active: Joi.boolean().optional(),
});

const changeRoleSchema = Joi.object({
  role: Joi.string().valid("user", "admin").required(),
});

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().min(1).max(100).optional(),
  role: Joi.string().valid("user", "admin").optional(),
  tier: Joi.string().valid("Tier 1", "Tier 2", "Tier 3", "Tier 4").optional(),
  is_active: Joi.boolean().optional(),
  created_from: Joi.date().iso().optional(),
  created_to: Joi.date().iso().optional(),
});

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(getUsersSchema, "query"),
  userController.getUsers
);

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  userController.getUserStats
);

router.get("/:id", authMiddleware, adminMiddleware, userController.getUserById);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(updateUserSchema),
  userController.updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser
);

router.delete(
  "/:id/hard-delete",
  authMiddleware,
  adminMiddleware,
  userController.hardDeleteUser
);

router.post(
  "/:id/activate",
  authMiddleware,
  adminMiddleware,
  userController.activateUser
);

export default router;
