/**
 * @module notification.repository
 * @description Database operations for notifications.
 * Called by: notification.service
 */
const db = require('../../models/index.js');

const { Notification } = db;

/**
 * Find notification by ID for specific employee
 */
const findNotificationById = async (orgId, empId, notifId) => {
  return await Notification.findOne({
    where: { id: notifId, org_id: orgId, emp_id: empId },
  });
};

/**
 * List notifications with pagination and optional filters
 */
const listNotificationsPaginated = async (orgId, empId, options) => {
  const { offset, limit, unreadOnly } = options;

  const where = { org_id: orgId, emp_id: empId };
  if (unreadOnly) {
    where.is_read = false;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return {
    notifications: rows,
    total: count,
  };
};

/**
 * Count unread notifications for employee
 */
const countUnreadNotifications = async (orgId, empId) => {
  return await Notification.count({
    where: { org_id: orgId, emp_id: empId, is_read: false },
  });
};

/**
 * Create notification
 */
const createNotification = async (data) => {
  return await Notification.create(data);
};

/**
 * Mark notification as read
 */
const markAsRead = async (orgId, empId, notifId) => {
  const result = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { id: notifId, org_id: orgId, emp_id: empId }, returning: true }
  );
  return result[1][0] || null;
};

/**
 * Mark all notifications as read for employee
 */
const markAllAsRead = async (orgId, empId) => {
  return await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { org_id: orgId, emp_id: empId, is_read: false } }
  );
};

/**
 * Delete notification
 */
const deleteNotification = async (orgId, empId, notifId) => {
  return await Notification.destroy({
    where: { id: notifId, org_id: orgId, emp_id: empId },
  });
};

module.exports = {
  findNotificationById,
  listNotificationsPaginated,
  countUnreadNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};