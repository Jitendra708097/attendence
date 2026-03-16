/**
 * @module billing.routes
 * @description Route definitions for billing endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const billingController = require('./billing.controller.js');
const { validate, createOrderValidator, verifyPaymentValidator, upgradePlanValidator  } = require('./billing.validator.js');

const router = Router();

// GET /api/v1/billing/plans - List available plans
router.get('/plans', billingController.listPlans);

// GET /api/v1/billing/subscription - Get current subscription
router.get(
  '/subscription',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  billingController.getSubscription
);

// POST /api/v1/billing/create-order - Create Razorpay order
router.post(
  '/create-order',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(createOrderValidator),
  billingController.createOrder
);

// POST /api/v1/billing/verify-payment - Verify payment
router.post(
  '/verify-payment',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(verifyPaymentValidator),
  billingController.verifyPayment
);

// POST /api/v1/billing/upgrade-plan - Upgrade plan
router.post(
  '/upgrade-plan',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(upgradePlanValidator),
  billingController.upgradePlan
);

// POST /api/v1/billing/cancel-subscription - Cancel subscription
router.post(
  '/cancel-subscription',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  billingController.cancelSubscription
);

// GET /api/v1/billing/invoices - List invoices
router.get(
  '/invoices',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  billingController.listInvoices
);

module.exports = router;
