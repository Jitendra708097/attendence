/**
 * @module billing.controller
 * @description Handles billing and subscription operations.
 */
const billingService = require('./billing.service.js');
const billingRepository = require('./billing.repository.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * GET /api/v1/billing/plans
 * List available subscription plans
 */
const listPlans = async (req, res, next) => {
  try {
    const plans = await billingService.listPlans();

    res.status(200).json({
      success: true,
      message: 'Plans retrieved',
      data: plans,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/billing/subscription
 * Get organization's current subscription
 */
const getSubscription = async (req, res, next) => {
  try {
    const orgId = req.org_id;

    const subscription = await billingService.getSubscription(orgId, billingRepository);

    res.status(200).json({
      success: true,
      message: 'Subscription retrieved',
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/billing/create-order
 * Create subscription order via Razorpay
 */
const createOrder = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { planId } = req.body;

    const order = await billingService.createOrder(orgId, { planId }, billingRepository);

    await logAudit(req, 'BILLING_ORDER_CREATED', 'Billing', order.id, { planId });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/billing/verify-payment
 * Verify payment and activate subscription
 */
const verifyPayment = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { orderId, paymentId, signature } = req.body;

    const subscription = await billingService.verifyPayment(
      orgId,
      { orderId, paymentId, signature },
      billingRepository
    );

    await logAudit(req, 'BILLING_PAYMENT_VERIFIED', 'Billing', orderId, { paymentId });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/billing/upgrade-plan
 * Upgrade to higher plan
 */
const upgradePlan = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { newPlanId } = req.body;

    const subscription = await billingService.upgradePlan(orgId, { newPlanId }, billingRepository);

    await logAudit(req, 'BILLING_PLAN_UPGRADED', 'Billing', orgId, { newPlanId });

    res.status(200).json({
      success: true,
      message: 'Plan upgraded successfully',
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/billing/cancel-subscription
 * Cancel subscription
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { reason } = req.body;

    await billingService.cancelSubscription(orgId, { reason }, billingRepository);

    await logAudit(req, 'BILLING_SUBSCRIPTION_CANCELLED', 'Billing', orgId, { reason });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/billing/invoices
 * List organization's invoices
 */
const listInvoices = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { page = 1, limit = 20 } = req.query;

    const result = await billingService.listInvoices(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }, billingRepository);

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved',
      data: {
        invoices: result.invoices,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPlans,
  getSubscription,
  createOrder,
  verifyPayment,
  upgradePlan,
  cancelSubscription,
  listInvoices,
};