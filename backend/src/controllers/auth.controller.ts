import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";
import {
  APIResponse,
  User,
  UserRegistrationRequest,
  UserLoginRequest,
} from "../types";
import { logger } from "../utils/logger.utils";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password, ethAddress }: UserRegistrationRequest = req.body;

      // Check if user exists
      const existingUser = await this.authService.findUserByEmail(email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User already exists with this email",
        } as APIResponse);
        return;
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await this.authService.createUser({
        email,
        passwordHash: hashedPassword,
        ethAddress,
        tier: "Tier 1",
        isActive: true,
      });

      // Generate JWT token
      //@ts-ignore
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            ethAddress: user.ethAddress,
            tier: user.tier,
            createdAt: user.createdAt,
          },
          token,
        },
      } as APIResponse);
    }
  );

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password }: UserLoginRequest = req.body;

    // Find user
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as APIResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      } as APIResponse);
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash!);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as APIResponse);
      return;
    }

    // Generate JWT token
    //@ts-ignore
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Update last login
    await this.authService.updateLastLogin(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          ethAddress: user.ethAddress,
          tier: user.tier,
          createdAt: user.createdAt,
        },
        token,
      },
    } as APIResponse);
  });

  profile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).userId;

    const user = await this.authService.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as APIResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ethAddress: user.ethAddress,
        tier: user.tier,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    } as APIResponse);
  });

  updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).userId;
      const { ethAddress } = req.body;

      const updatedUser = await this.authService.updateUser(userId, {
        ethAddress,
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          ethAddress: updatedUser.ethAddress,
          tier: updatedUser.tier,
        },
      } as APIResponse);
    }
  );

  changePassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).userId;
      const { currentPassword, newPassword } = req.body;

      const user = await this.authService.findUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        } as APIResponse);
        return;
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.passwordHash!
      );
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        } as APIResponse);
        return;
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await this.authService.updateUser(userId, {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: "Password changed successfully",
      } as APIResponse);
    }
  );

  
}
