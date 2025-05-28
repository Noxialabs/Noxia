

// src/controllers/case.controller.ts
import { Request, Response } from 'express';
import { CaseService } from '../services/case.service';
import { AIService } from '../services/ai.service';
import { asyncHandler } from '../middleware/error.middleware';
import { APIResponse, PaginatedResponse, Case, CaseSubmissionRequest } from '../types';
import { logger } from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';

export class CaseController {
  private caseService: CaseService;
  private aiService: AIService;

  constructor() {
    this.caseService = new CaseService();
    this.aiService = new AIService();
  }

  submitCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { clientName, description, jurisdiction, attachments }: CaseSubmissionRequest = req.body;

    // Generate unique case reference
    const caseRef = `999P-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Get AI classification
    const classification = await this.aiService.classifyText(description);

    // Create case
    const newCase = await this.caseService.createCase({
      caseRef,
      userId,
      clientName,
      description,
      jurisdiction,
      issueCategory: classification.issueCategory,
      escalationLevel: classification.escalationLevel,
      aiConfidence: classification.confidence,
      urgencyScore: classification.urgencyScore,
      suggestedActions: classification.suggestedActions,
      status: 'Pending',
      priority: this.determinePriority(classification.urgencyScore),
      attachments,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        submissionSource: 'web'
      }
    });

    logger.info(`New case submitted: ${caseRef} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Case submitted successfully',
      data: {
        case: newCase,
        classification
      }
    } as APIResponse);
  });

  getCases = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const filters = {
      userId,
      ...(status && { status }),
      ...(priority && { priority })
    };

    const { cases, total } = await this.caseService.getCases(filters, page, limit);

    res.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    } as PaginatedResponse<Case>);
  });

  getCaseById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;

    const caseData = await this.caseService.getCaseById(caseId, userId);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      } as APIResponse);
    }

    res.json({
      success: true,
      data: caseData
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
        message: 'Case not found'
      } as APIResponse);
    }

    const updatedCase = await this.caseService.updateCase(caseId, {
      ...updates,
      lastUpdated: new Date()
    });

    logger.info(`Case updated: ${existingCase.caseRef} by user ${userId}`);

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
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
        message: 'Case not found'
      } as APIResponse);
    }

    await this.caseService.deleteCase(caseId);

    logger.info(`Case deleted: ${existingCase.caseRef} by user ${userId}`);

    res.json({
      success: true,
      message: 'Case deleted successfully'
    } as APIResponse);
  });

  getCaseStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const stats = await this.caseService.getCaseStats(userId);

    res.json({
      success: true,
      data: stats
    } as APIResponse);
  });

  escalateCase = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const caseId = req.params.id;
    const { reason, priority } = req.body;

    const escalatedCase = await this.caseService.escalateCase(caseId, userId, {
      reason,
      priority: priority || 'High',
      escalatedBy: userId,
      escalatedAt: new Date()
    });

    logger.info(`Case escalated: ${escalatedCase.caseRef} by user ${userId}`);

    res.json({
      success: true,
      message: 'Case escalated successfully',
      data: escalatedCase
    } as APIResponse);
  });

  private determinePriority(urgencyScore: number): 'Low' | 'Normal' | 'High' | 'Critical' {
    if (urgencyScore >= 9) return 'Critical';
    if (urgencyScore >= 7) return 'High';
    if (urgencyScore >= 4) return 'Normal';
    return 'Low';
  }
}

// ===================================================