/**
 * @module notification.routes
 * @description Route definitions for notification endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const notifController = require('./notification.controller.js');

const router = Router();

// GET /api/v1/notifications - List user's notifications
router.get('/', verifyJWT, orgGuard, notifController.listNotifications);

// GET /api/v1/notifications/:id - Get single notification
router.get('/:id', verifyJWT, orgGuard, notifController.getNotificationById);

// POST /api/v1/notifications/:id/mark-read - Mark as read
router.post('/:id/mark-read', verifyJWT, orgGuard, notifController.markAsRead);

// POST /api/v1/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', verifyJWT, orgGuard, notifController.markAllAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', verifyJWT, orgGuard, notifController.deleteNotification);

module.exports = router;
