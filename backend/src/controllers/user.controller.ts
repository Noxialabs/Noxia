import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { asyncHandler } from "../middleware/error.middleware";
import { APIResponse, PaginatedResponse } from "../types";
import {
  UserUpdateRequest,
  UserSearchFilters,
  User,
  UserResponse,
} from "../types/user.types";
import { logger } from "../utils/logger.utils";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users with filtering and pagination
   */
  getUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const filters: UserSearchFilters = {
        page: page,
        limit: limit,
        search: req.query.search as string,
        role: req.query.role as any,
        tier: req.query.tier as any,
        is_active:
          req.query.is_active === "true"
            ? true
            : req.query.is_active === "false"
            ? false
            : undefined,
        created_from: req.query.created_from as string,
        created_to: req.query.created_to as string,
      };

      const { users, total } = await this.userService.getUsers(filters);

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      } as PaginatedResponse<UserResponse>);
    }
  );

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      } as APIResponse);
    }
  );

  /**
   * Update user
   */
  updateUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const updateData: UserUpdateRequest = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete (updateData as any).password_hash;
      delete (updateData as any).email_verification_token;
      delete (updateData as any).password_reset_token;

      try {
        const updatedUser = await this.userService.updateUser(id, updateData);

        if (!updatedUser) {
          res.status(404).json({
            success: false,
            message: "User not found",
            code: "USER_NOT_FOUND",
          } as APIResponse);
          return;
        }

        res.json({
          success: true,
          message: "User updated successfully",
          data: updatedUser,
        } as APIResponse);
      } catch (error: any) {
        if (error.message === "No fields to update") {
          res.status(400).json({
            success: false,
            message: "No valid fields provided for update",
            code: "NO_UPDATE_FIELDS",
          } as APIResponse);
          return;
        }
        throw error;
      }
    }
  );

  /**
   * Delete user (soft delete)
   */
  deleteUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "User not found or cannot be deleted",
          code: "USER_NOT_FOUND_OR_PROTECTED",
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        message: "User deactivated successfully",
        data: { deletedUserId: id },
      } as APIResponse);
    }
  );

  /**
   * Hard delete user (permanent deletion)
   */
  hardDeleteUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const deleted = await this.userService.hardDeleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "User not found or cannot be deleted",
          code: "USER_NOT_FOUND_OR_PROTECTED",
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        message: "User permanently deleted",
        data: { deletedUserId: id },
      } as APIResponse);
    }
  );

  /**
   * Activate user
   */
  activateUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const user = await this.userService.activateUser(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        message: "User activated successfully",
        data: user,
      } as APIResponse);
    }
  );

  /**
   * Change user role
   */
  changeUserRole = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "admin", "super_admin"].includes(role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role. Must be one of: user, admin, super_admin",
          code: "INVALID_ROLE",
        } as APIResponse);
        return;
      }

      try {
        const user = await this.userService.changeUserRole(id, role);

        if (!user) {
          res.status(404).json({
            success: false,
            message: "User not found",
            code: "USER_NOT_FOUND",
          } as APIResponse);
          return;
        }

        res.json({
          success: true,
          message: "User role updated successfully",
          data: user,
        } as APIResponse);
      } catch (error: any) {
        if (error.message === "Cannot demote super admin") {
          res.status(403).json({
            success: false,
            message: "Cannot change super admin role",
            code: "SUPER_ADMIN_PROTECTION",
          } as APIResponse);
          return;
        }
        throw error;
      }
    }
  );

  /**
   * Get user statistics
   */
  getUserStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const stats = await this.userService.getUserStats();

      res.json({
        success: true,
        message: "User statistics retrieved successfully",
        data: stats,
      } as APIResponse);
    }
  );
}
