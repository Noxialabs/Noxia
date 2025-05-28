import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { asyncHandler } from '../middleware/error.middleware';
import { APIResponse, AIClassificationRequest } from '../types';
import { logger } from '../utils/logger.utils';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  classifyText = asyncHandler(async (req: Request, res: Response) => {
    const { text, context, caseId }: AIClassificationRequest = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for classification'
      } as APIResponse);
    }

    const startTime = Date.now();
    
    try {
      const classification = await this.aiService.classifyText(text, context);
      const processingTime = Date.now() - startTime;

      // Log classification for analytics
      await this.aiService.logClassification({
        inputText: text,
        caseId,
        ...classification,
        processingTimeMs: processingTime,
        userId: (req as any).userId
      });

      logger.info(`AI classification completed in ${processingTime}ms`);

      res.json({
        success: true,
        data: {
          ...classification,
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        }
      } as APIResponse);
    } catch (error) {
      logger.error('AI classification failed:', error);
      
      // Return fallback classification
      res.json({
        success: true,
        data: {
          issueCategory: 'Other',
          escalationLevel: 'Basic',
          confidence: 0.1,
          suggestedActions: ['Manual review required', 'Contact support'],
          urgencyScore: 5,
          processingTimeMs: Date.now() - startTime,
          fallback: true
        }
      } as APIResponse);
    }
  });

  reclassifyCase = asyncHandler(async (req: Request, res: Response) => {
    const { caseId } = req.params;
    const { text, context } = req.body;

    const classification = await this.aiService.classifyText(text, context);
    
    // Update case with new classification
    const updatedClassification = await this.aiService.updateCaseClassification(caseId, classification);

    logger.info(`Case ${caseId} reclassified`);

    res.json({
      success: true,
      message: 'Case reclassified successfully',
      data: updatedClassification
    } as APIResponse);
  });

  getClassificationHistory = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = (req as any).userId;

    const history = await this.aiService.getClassificationHistory(userId, page, limit);

    res.json({
      success: true,
      data: history.classifications,
      pagination: {
        page,
        limit,
        total: history.total,
        totalPages: Math.ceil(history.total / limit),
        hasNext: page * limit < history.total,
        hasPrev: page > 1
      }
    } as APIResponse);
  });

  getClassificationStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const timeframe = req.query.timeframe as string || '30d';

    const stats = await this.aiService.getClassificationStats(userId, timeframe);

    res.json({
      success: true,
      data: stats
    } as APIResponse);
  });

  analyzeEscalation = asyncHandler(async (req: Request, res: Response) => {
    const { subject, body, customerTier, urgency, context } = req.body;

    const analysis = await this.aiService.analyzeEscalation({
      subject,
      body,
      customerTier,
      urgency,
      context
    });

    res.json({
      success: true,
      data: analysis
    } as APIResponse);
  });

  generateSummary = asyncHandler(async (req: Request, res: Response) => {
    const { caseId } = req.params;
    const userId = (req as any).userId;

    const summary = await this.aiService.generateCaseSummary(caseId, userId);

    res.json({
      success: true,
      data: {
        caseId,
        summary,
        generatedAt: new Date().toISOString()
      }
    } as APIResponse);
  });
}
