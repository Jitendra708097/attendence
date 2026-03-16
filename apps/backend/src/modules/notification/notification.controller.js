/**
 * @module notification.controller
 * @description Handles notification operations.
 */
const notifService = require('./notification.service.js');
const notifRepository = require('./notification.repository.js');

/**
 * GET /api/v1/notifications
 * List user's notifications with pagination and filters
 */
const listNotifications = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user_id;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const result = await notifService.listNotifications(orgId, empId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true',
    }, notifRepository);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: {
        notifications: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notifications/:id
 * Get single notification by ID
 */
const getNotificationById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user_id;
    const { id } = req.params;

    const notification = await notifService.getNotificationById(orgId, empId, id, notifRepository);

    res.status(200).json({
      success: true,
      message: 'Notification retrieved',
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/notifications/:id/mark-read
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user_id;
    const { id } = req.params;

    const notification = await notifService.markAsRead(orgId, empId, id, notifRepository);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user_id;

    await notifService.markAllAsRead(orgId, empId, notifRepository);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user_id;
    const { id } = req.params;

    await notifService.deleteNotification(orgId, empId, id, notifRepository);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};