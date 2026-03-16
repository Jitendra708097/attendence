/**
 * @module notification.service
 * @description Business logic for notification management.
 * Called by: notification.controller
 * Calls: notification.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

/**
 * List notifications with pagination and optional filters
 */
const listNotifications = async (orgId, empId, filters, notifRepository) => {
  const { page, limit, unreadOnly } = filters;
  const offset = (page - 1) * limit;

  const result = await notifRepository.listNotificationsPaginated(orgId, empId, {
    offset,
    limit,
    unreadOnly,
  });

  const unreadCount = await notifRepository.countUnreadNotifications(orgId, empId);
  const totalPages = Math.ceil(result.total / limit);

  return {
    notifications: result.notifications.map(n => formatNotification(n)),
    pagination: { page, limit, total: result.total, totalPages },
    unreadCount,
  };
};

/**
 * Get notification by ID
 */
const getNotificationById = async (orgId, empId, notifId, notifRepository) => {
  const notification = await notifRepository.findNotificationById(orgId, empId, notifId);
  if (!notification) {
    throw new AppError('NOT_001', 'Notification not found', 404);
  }

  // Auto-mark as read when viewed
  if (!notification.is_read) {
    try {
      const result = await notifRepository.markAsRead(orgId, empId, notifId);
      if (!result) {
        throw new AppError('NOT_002', 'Failed to mark notification as read', 500);
      }
    } catch (err) {
      // Log error but don't fail the request - user should still see the notification
      console.error('Error marking notification as read:', err);
    }
  }

  return formatNotification(notification);
};

/**
 * Mark notification as read
 */
const markAsRead = async (orgId, empId, notifId, notifRepository) => {
  const notification = await notifRepository.findNotificationById(orgId, empId, notifId);
  if (!notification) {
    throw new AppError('NOT_001', 'Notification not found', 404);
  }

  const updated = await notifRepository.markAsRead(orgId, empId, notifId);
  return formatNotification(updated);
};

/**
 * Mark all notifications as read for employee
 */
const markAllAsRead = async (orgId, empId, notifRepository) => {
  await notifRepository.markAllAsRead(orgId, empId);
};

/**
 * Delete notification
 */
const deleteNotification = async (orgId, empId, notifId, notifRepository) => {
  const notification = await notifRepository.findNotificationById(orgId, empId, notifId);
  if (!notification) {
    throw new AppError('NOT_001', 'Notification not found', 404);
  }

  await notifRepository.deleteNotification(orgId, empId, notifId);
};

/**
 * Create notification (internal use by other modules)
 */
const createNotification = async (orgId, empId, data, notifRepository) => {
  const { notificationType, title, message, actionUrl, actionType, actionData } = data;

  if (!notificationType || !title || !message) {
    throw new AppError('VAL_001', 'notificationType, title, and message are required', 400);
  }

  const notification = await notifRepository.createNotification({
    id: uuidv4(),
    org_id: orgId,
    emp_id: empId,
    notification_type: notificationType,
    title,
    message,
    action_url: actionUrl || null,
    action_type: actionType || null,
    action_data: actionData || {},
    is_read: false,
    fcm_sent: false,
  });

  return formatNotification(notification);
};

const formatNotification = (notif) => ({
  id: notif.id,
  notificationType: notif.notification_type,
  title: notif.title,
  message: notif.message,
  actionUrl: notif.action_url,
  actionType: notif.action_type,
  actionData: notif.action_data,
  isRead: notif.is_read,
  readAt: notif.read_at,
  sentAt: notif.sent_at,
  fcmSent: notif.fcm_sent,
  createdAt: notif.created_at,
});

module.exports = {
  listNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};