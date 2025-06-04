// src/controllers/case.controller.ts
import { Request, Response } from "express";
import { CaseService } from "../services/case.service";
import { AIService } from "../services/ai.service";
import { asyncHandler } from "../middleware/error.middleware";
import { query } from "../database/connection";

import {
  APIResponse,
  PaginatedResponse,
  Case,
  CaseSubmissionRequest,
} from "../types";
import { logger } from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";

export class CaseController {
  private caseService: CaseService;
  private aiService: AIService;

  constructor() {
    this.caseService = new CaseService();
    this.aiService = new AIService();
  }

  submitCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const {
      clientName,
      description,
      jurisdiction,
      title,
    }: CaseSubmissionRequest = req.body;

    const attachments = "[]";
    // Generate unique case reference
    const caseRef = `999P-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    // Get AI classification
    const classification = await this.aiService.classifyText(description);

    // Create case
    const newCase = await this.caseService.createCase({
      title,
      caseRef,
      userId,
      clientName,
      description,
      jurisdiction,
      issueCategory: classification.issueCategory,
      escalationLevel: classification.escalationLevel,
      aiConfidence: classification.confidence,
      urgencyScore: classification.urgencyScore,
      suggestedActions: JSON.stringify(classification.suggestedActions),
      status: "Pending",
      priority: this.determinePriority(classification.urgencyScore),
      attachments,
      metadata: JSON.stringify({
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        submissionSource: "web",
      }),
    });

    logger.info(`New case submitted: ${caseRef} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: "Case submitted successfully",
      data: {
        case: newCase,
        classification,
      },
    } as APIResponse);
  });

  getCases = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId?.toString(); //(req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const filters = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const { cases, total } = await this.caseService.getCases(
      filters,
      page,
      limit
    );

    res.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    } as PaginatedResponse<Case>);
  });

  getCaseById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;

    const caseData = await this.caseService.getCaseById(caseId, userId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      } as APIResponse);
    }

    res.json({
      success: true,
      data: caseData,
    } as APIResponse);
  });

  updateCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;
    const updates = req.body;

    // Verify case ownership
    const existingCase = await this.caseService.getCaseById(caseId, userId);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      } as APIResponse);
    }

    const updatedCase = await this.caseService.updateCase(caseId, {
      ...updates,
      updatedAt: new Date(),
    });

    logger.info(`Case updated: ${existingCase.caseRef} by user ${userId}`);

    res.json({
      success: true,
      message: "Case updated successfully",
      data: updatedCase,
    } as APIResponse);
  });

  deleteCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;

    // Verify case ownership
    const existingCase = await this.caseService.getCaseById(caseId, userId);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      } as APIResponse);
    }

    await this.caseService.deleteCase(caseId);

    logger.info(`Case deleted: ${existingCase.caseRef} by user ${userId}`);

    res.json({
      success: true,
      message: "Case deleted successfully",
    } as APIResponse);
  });

  getCaseStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const stats = await this.caseService.getCaseStats(userId);

    res.json({
      success: true,
      data: stats,
    } as APIResponse);
  });
  escalateCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;
    const { reason, priority } = req.body;

    try {
      const result = await this.caseService.escalateCase(caseId, userId, {
        reason,
        priority: priority || "High",
        escalatedBy: userId,
        escalatedAt: new Date(),
      });

      logger.info(`Case escalated: ${result.case.caseRef} by user ${userId}`);

      res.json({
        success: true,
        message: "Case escalated successfully",
        data: {
          case: result.case,
          aiAnalysis: {
            shouldEscalate: result.aiAnalysis.shouldEscalate,
            confidence: result.aiAnalysis.confidence,
            recommendation: result.aiAnalysis.recommendation,
            suggestedPriority: result.aiAnalysis.suggestedPriority,
            riskFactors: result.aiAnalysis.riskFactors,
          },
          escalationApproved: result.escalationApproved,
        },
      } as APIResponse);
    } catch (error: any) {
      // Handle specific escalation errors
      if (error.message.includes("AI analysis advises against escalation")) {
        res.status(400).json({
          success: false,
          message: "Escalation denied by AI analysis",
          code: "AI_ESCALATION_DENIED",
          details: {
            reason: error.message,
          },
        } as APIResponse);
        return;
      }

      if (error.message === "Case is already escalated") {
        res.status(400).json({
          success: false,
          message: "Case is already escalated",
          code: "ALREADY_ESCALATED",
        } as APIResponse);
        return;
      }

      if (error.message === "Cannot escalate closed or completed case") {
        res.status(400).json({
          success: false,
          message: "Cannot escalate closed or completed case",
          code: "INVALID_CASE_STATUS",
        } as APIResponse);
        return;
      }

      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  });

  /**
   * Preview what AI thinks about escalating a case without actually doing it
   */
  previewEscalation = asyncHandler(async (req: Request, res: Response) => {
    const caseId = req.params.id;
    const { reason } = req.body;

    // Get the current case data
    const currentCaseResult = await query(`SELECT * FROM cases WHERE id = $1`, [
      caseId,
    ]);

    if (currentCaseResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Case not found",
        code: "CASE_NOT_FOUND",
      } as APIResponse);
      return;
    }

    const currentCase = this.caseService.mapDatabaseCase(
      currentCaseResult.rows[0]
    );

    // Get AI analysis without actually escalating
    const aiService = new AIService();
    const aiAnalysis = await aiService.analyzeEscalation({
      title: currentCase.title,
      description: currentCase.description,
      currentPriority: currentCase.priority,
      currentStatus: currentCase.status,
      issueCategory: currentCase.issueCategory,
      jurisdiction: currentCase.jurisdiction,
      submissionDate: currentCase.submissionDate,
      userReason: reason,
    });

    res.json({
      success: true,
      message: "Escalation analysis completed",
      data: {
        currentCase: {
          id: currentCase.id,
          caseRef: currentCase.caseRef,
          status: currentCase.status,
          priority: currentCase.priority,
        },
        aiAnalysis,
        recommendation:
          aiAnalysis.shouldEscalate && aiAnalysis.confidence >= 0.6
            ? "APPROVE_ESCALATION"
            : aiAnalysis.shouldEscalate && aiAnalysis.confidence >= 0.4
            ? "CONDITIONAL_APPROVAL"
            : "REVIEW_REQUIRED",
      },
    } as APIResponse);
  });

  private determinePriority(
    urgencyScore: number
  ): "Low" | "Normal" | "High" | "Critical" {
    if (urgencyScore >= 9) return "Critical";
    if (urgencyScore >= 7) return "High";
    if (urgencyScore >= 4) return "Normal";
    return "Low";
  }
}

