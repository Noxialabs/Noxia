import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '../middleware/error.middleware';
import { APIResponse, PaginatedResponse } from '../types';
import { logger } from '../utils/logger.utils';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userId, type, title, message, caseId, metadata } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required'
      } as APIResponse);
    }

    const notification = await this.notificationService.sendNotification({
      userId,
      type,
      title,
      message,
      caseId,
      metadata
    });

    logger.info(`Notification sent: ${type} to user ${userId}`);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    } as APIResponse);
  });

  sendEmail = asyncHandler(async (req: Request, res: Response) => {
    const { to, subject, message, template, templateData, caseId } = req.body;

    if (!to || !subject || (!message && !template)) {
      return res.status(400).json({
        success: false,
        message: 'to, subject, and message/template are required'
      } as APIResponse);
    }

    const emailResult = await this.notificationService.sendEmail({
      to,
      subject,
      message,
      template,
      templateData,
      caseId
    });

    logger.info(`Email sent to: ${to}`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: emailResult
    } as APIResponse);
  });

  sendSMS = asyncHandler(async (req: Request, res: Response) => {
    const { to, message, caseId } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'to and message are required'
      } as APIResponse);
    }

    const smsResult = await this.notificationService.sendSMS({
      to,
      message,
      caseId
    });

    logger.info(`SMS sent to: ${to}`);

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: smsResult
    } as APIResponse);
  });

  getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const filters = {
      userId,
      ...(status && { status }),
      ...(type && { type })
    };

    const { notifications, total } = await this.notificationService.getNotifications(filters, page, limit);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    } as PaginatedResponse<any>);
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    const updated = await this.notificationService.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      } as APIResponse);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    } as APIResponse);
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const count = await this.notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`
    } as APIResponse);
  });

  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    const deleted = await this.notificationService.deleteNotification(notificationId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      } as APIResponse);
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    } as APIResponse);
  });

  getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const stats = await this.notificationService.getNotificationStats(userId);

    res.json({
      success: true,
      data: stats
    } as APIResponse);
  });

  sendBulkNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userIds, type, title, message, filters, metadata } = req.body;

    if ((!userIds || userIds.length === 0) && !filters) {
      return res.status(400).json({
        success: false,
        message: 'Either userIds array or filters must be provided'
      } as APIResponse);
    }

    const result = await this.notificationService.sendBulkNotification({
      userIds,
      type,
      title,
      message,
      filters,
      metadata
    });

    logger.info(`Bulk notification sent to ${result.sentCount} users`);

    res.json({
      success: true,
      message: 'Bulk notification sent successfully',
      data: result
    } as APIResponse);
  });

  sendWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { url, payload, headers, caseId } = req.body;

    if (!url || !payload) {
      return res.status(400).json({
        success: false,
        message: 'url and payload are required'
      } as APIResponse);
    }

    const webhookResult = await this.notificationService.sendWebhook({
      url,
      payload,
      headers,
      caseId
    });

    logger.info(`Webhook sent to: ${url}`);

    res.json({
      success: true,
      message: 'Webhook sent successfully',
      data: webhookResult
    } as APIResponse);
  });

  scheduleNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userId, type, title, message, scheduledFor, caseId, metadata } = req.body;

    if (!userId || !type || !title || !message || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, message, and scheduledFor are required'
      } as APIResponse);
    }

    const scheduledNotification = await this.notificationService.scheduleNotification({
      userId,
      type,
      title,
      message,
      scheduledFor: new Date(scheduledFor),
      caseId,
      metadata
    });

    logger.info(`Notification scheduled for user ${userId} at ${scheduledFor}`);

    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      data: scheduledNotification
    } as APIResponse);
  });

  cancelScheduledNotification = asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.id;
    const userId = (req as any).userId;

    const cancelled = await this.notificationService.cancelScheduledNotification(notificationId, userId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled notification not found'
      } as APIResponse);
    }

    res.json({
      success: true,
      message: 'Scheduled notification cancelled successfully'
    } as APIResponse);
  });

  getScheduledNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { notifications, total } = await this.notificationService.getScheduledNotifications(userId, page, limit);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    } as APIResponse);
  });

  updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const preferences = req.body;

    const updatedPreferences = await this.notificationService.updateNotificationPreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updatedPreferences
    } as APIResponse);
  });

  getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const preferences = await this.notificationService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    } as APIResponse);
  });

  retryFailedNotification = asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.id;
    const userId = (req as any).userId;

    const retryResult = await this.notificationService.retryFailedNotification(notificationId, userId);

    if (!retryResult) {
      return res.status(404).json({
        success: false,
        message: 'Failed notification not found'
      } as APIResponse);
    }

    logger.info(`Notification retry initiated: ${notificationId}`);

    res.json({
      success: true,
      message: 'Notification retry initiated',
      data: retryResult
    } as APIResponse);
  });
}