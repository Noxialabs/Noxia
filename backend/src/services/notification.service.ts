// src/services/notification.service.ts
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { logger } from '../utils/logger.utils';
import axios from 'axios';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  caseId?: string;
  metadata?: any;
}

interface EmailData {
  to: string;
  subject: string;
  message?: string;
  template?: string;
  templateData?: any;
  caseId?: string;
}

interface SMSData {
  to: string;
  message: string;
  caseId?: string;
}

interface WebhookData {
  url: string;
  payload: any;
  headers?: any;
  caseId?: string;
}

interface BulkNotificationData {
  userIds?: string[];
  type: string;
  title: string;
  message: string;
  filters?: any;
  metadata?: any;
}

interface ScheduledNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  scheduledFor: Date;
  caseId?: string;
  metadata?: any;
}

export class NotificationService {
  
  async sendNotification(data: NotificationData): Promise<any> {
    try {
      const notificationId = uuidv4();
      
      const result = await query(`
        INSERT INTO notifications (
          id, user_id, type, title, message, case_id, metadata, 
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        notificationId,
        data.userId,
        data.type,
        data.title,
        data.message,
        data.caseId || null,
        JSON.stringify(data.metadata || {})
      ]);

      logger.info(`Notification sent: ${data.type} to user ${data.userId}`);
      return this.mapNotificationRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  async sendEmail(data: EmailData): Promise<any> {
    try {
      // Log email attempt
      const emailId = uuidv4();
      await query(`
        INSERT INTO email_logs (
          id, recipient, subject, message, template, template_data,
          case_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      `, [
        emailId,
        data.to,
        data.subject,
        data.message || null,
        data.template || null,
        JSON.stringify(data.templateData || {}),
        data.caseId || null
      ]);

      // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate success
      const emailSent = await this.simulateEmailSend(data);

      if (emailSent) {
        await query(`
          UPDATE email_logs SET status = 'sent', sent_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [emailId]);

        logger.info(`Email sent to: ${data.to}`);
        return { id: emailId, status: 'sent', recipient: data.to };
      } else {
        await query(`
          UPDATE email_logs SET status = 'failed', error_message = 'Email service unavailable'
          WHERE id = $1
        `, [emailId]);
        throw new Error('Failed to send email');
      }
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendSMS(data: SMSData): Promise<any> {
    try {
      const smsId = uuidv4();
      await query(`
        INSERT INTO sms_logs (
          id, recipient, message, case_id, status, created_at
        ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
      `, [
        smsId,
        data.to,
        data.message,
        data.caseId || null
      ]);

      // Simulate SMS sending (integrate with Twilio, AWS SNS, etc.)
      const smsSent = await this.simulateSMSSend(data);

      if (smsSent) {
        await query(`
          UPDATE sms_logs SET status = 'sent', sent_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [smsId]);

        logger.info(`SMS sent to: ${data.to}`);
        return { id: smsId, status: 'sent', recipient: data.to };
      } else {
        await query(`
          UPDATE sms_logs SET status = 'failed', error_message = 'SMS service unavailable'
          WHERE id = $1
        `, [smsId]);
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      logger.error('SMS sending failed:', error);
      throw error;
    }
  }

  async sendWebhook(data: WebhookData): Promise<any> {
    try {
      const webhookId = uuidv4();
      await query(`
        INSERT INTO webhook_logs (
          id, url, payload, headers, case_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP)
      `, [
        webhookId,
        data.url,
        JSON.stringify(data.payload),
        JSON.stringify(data.headers || {}),
        data.caseId || null
      ]);

      try {
        const response = await axios.post(data.url, data.payload, {
          headers: data.headers || {},
          timeout: 10000
        });

        await query(`
          UPDATE webhook_logs SET 
            status = 'sent', 
            response_status = $1,
            response_data = $2,
            sent_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [
          response.status,
          JSON.stringify(response.data),
          webhookId
        ]);

        logger.info(`Webhook sent to: ${data.url}`);
        return { 
          id: webhookId, 
          status: 'sent', 
          url: data.url,
          responseStatus: response.status 
        };
      } catch (webhookError: any) {
        await query(`
          UPDATE webhook_logs SET 
            status = 'failed', 
            error_message = $1,
            response_status = $2
          WHERE id = $3
        `, [
          webhookError.message,
          webhookError.response?.status || null,
          webhookId
        ]);
        throw webhookError;
      }
    } catch (error) {
      logger.error('Webhook sending failed:', error);
      throw error;
    }
  }

  async getNotifications(filters: any, page: number = 1, limit: number = 20): Promise<{ notifications: any[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        values.push(filters.userId);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      if (filters.type) {
        whereClause += ` AND type = $${paramIndex}`;
        values.push(filters.type);
        paramIndex++;
      }

      const countResult = await query(`
        SELECT COUNT(*) FROM notifications ${whereClause}
      `, values);

      const notificationsResult = await query(`
        SELECT * FROM notifications 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...values, limit, offset]);

      return {
        notifications: notificationsResult.rows.map(row => this.mapNotificationRow(row)),
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(`
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND status != 'read'
      `, [notificationId, userId]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await query(`
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND status != 'read'
      `, [userId]);

      return result.rowCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      return false;
    }
  }

  async getNotificationStats(userId: string): Promise<any> {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as unread,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent
        FROM notifications 
        WHERE user_id = $1
      `, [userId]);

      return {
        total: parseInt(result.rows[0].total),
        unread: parseInt(result.rows[0].unread),
        read: parseInt(result.rows[0].read),
        recent: parseInt(result.rows[0].recent)
      };
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  async sendBulkNotification(data: BulkNotificationData): Promise<any> {
    try {
      let targetUserIds = data.userIds || [];

      // If filters provided, get user IDs based on filters
      if (data.filters && (!data.userIds || data.userIds.length === 0)) {
        const userResult = await query(`
          SELECT id FROM users 
          WHERE is_active = true
          ${data.filters.tier ? `AND tier = '${data.filters.tier}'` : ''}
          ${data.filters.emailVerified ? 'AND email_verified = true' : ''}
        `);
        targetUserIds = userResult.rows.map(row => row.id);
      }

      if (targetUserIds.length === 0) {
        return { sentCount: 0, failedCount: 0 };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const userId of targetUserIds) {
        try {
          await this.sendNotification({
            userId,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata
          });
          sentCount++;
        } catch (error) {
          failedCount++;
          logger.warn(`Failed to send notification to user ${userId}:`, error);
        }
      }

      return { sentCount, failedCount, totalTargeted: targetUserIds.length };
    } catch (error) {
      logger.error('Bulk notification failed:', error);
      throw error;
    }
  }

  async scheduleNotification(data: ScheduledNotificationData): Promise<any> {
    try {
      const notificationId = uuidv4();
      
      const result = await query(`
        INSERT INTO scheduled_notifications (
          id, user_id, type, title, message, scheduled_for, 
          case_id, metadata, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        notificationId,
        data.userId,
        data.type,
        data.title,
        data.message,
        data.scheduledFor,
        data.caseId || null,
        JSON.stringify(data.metadata || {})
      ]);

      return this.mapScheduledNotificationRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelScheduledNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(`
        UPDATE scheduled_notifications 
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND status = 'scheduled'
      `, [notificationId, userId]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to cancel scheduled notification:', error);
      return false;
    }
  }

  async getScheduledNotifications(userId: string, page: number = 1, limit: number = 10): Promise<{ notifications: any[], total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countResult = await query(`
        SELECT COUNT(*) FROM scheduled_notifications 
        WHERE user_id = $1 AND status = 'scheduled'
      `, [userId]);

      const notificationsResult = await query(`
        SELECT * FROM scheduled_notifications 
        WHERE user_id = $1 AND status = 'scheduled'
        ORDER BY scheduled_for ASC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return {
        notifications: notificationsResult.rows.map(row => this.mapScheduledNotificationRow(row)),
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Failed to get scheduled notifications:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: any): Promise<any> {
    try {
      const result = await query(`
        INSERT INTO notification_preferences (user_id, preferences, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET preferences = $2, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [userId, JSON.stringify(preferences)]);

      return {
        userId,
        preferences: JSON.parse(result.rows[0].preferences),
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const result = await query(`
        SELECT * FROM notification_preferences WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        // Return default preferences
        return {
          userId,
          preferences: {
            email: true,
            sms: false,
            push: true,
            inApp: true
          }
        };
      }

      return {
        userId,
        preferences: JSON.parse(result.rows[0].preferences),
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  async retryFailedNotification(notificationId: string, userId: string): Promise<any> {
    try {
      const result = await query(`
        SELECT * FROM notifications 
        WHERE id = $1 AND user_id = $2 AND status = 'failed'
      `, [notificationId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const notification = result.rows[0];
      
      // Retry the notification
      await this.sendNotification({
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        caseId: notification.case_id,
        metadata: JSON.parse(notification.metadata || '{}')
      });

      // Update original notification status
      await query(`
        UPDATE notifications 
        SET status = 'retried', retry_count = COALESCE(retry_count, 0) + 1
        WHERE id = $1
      `, [notificationId]);

      return { id: notificationId, status: 'retried' };
    } catch (error) {
      logger.error('Failed to retry notification:', error);
      return null;
    }
  }

  // Helper methods
  private async simulateEmailSend(data: EmailData): Promise<boolean> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.random() > 0.1; // 90% success rate
  }

  private async simulateSMSSend(data: SMSData): Promise<boolean> {
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return Math.random() > 0.05; // 95% success rate
  }

  private mapNotificationRow(row: any): any {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      caseId: row.case_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      createdAt: row.created_at,
      readAt: row.read_at
    };
  }

  private mapScheduledNotificationRow(row: any): any {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      scheduledFor: row.scheduled_for,
      caseId: row.case_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      createdAt: row.created_at,
      cancelledAt: row.cancelled_at
    };
  }
}