/**
 * @module billing.service
 * @description Business logic for billing and subscription management.
 * Called by: billing.controller
 * Calls: billing.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Subscription plans
const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 999,
    currency: 'INR',
    billing_cycle: 'monthly',
    employees: 50,
    features: ['basic_attendance', 'basic_reports', 'single_branch'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 2999,
    currency: 'INR',
    billing_cycle: 'monthly',
    employees: 500,
    features: ['advanced_attendance', 'advanced_reports', 'multi_branch', 'leave_management'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    currency: 'INR',
    billing_cycle: 'monthly',
    employees: 5000,
    features: ['all_features', 'custom_branding', 'api_access', '24_7_support'],
  },
};

/**
 * List available plans
 */
const listPlans = async () => {
  return Object.values(PLANS);
};

/**
 * Get organization's current subscription
 */
const getSubscription = async (orgId, billingRepository) => {
  const subscription = await billingRepository.findSubscriptionByOrgId(orgId);
  if (!subscription) {
    return {
      planId: null,
      status: 'no_subscription',
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }
  return formatSubscription(subscription);
};

/**
 * Create Razorpay order for subscription
 */
const createOrder = async (orgId, data, billingRepository) => {
  const { planId } = data;

  if (!PLANS[planId]) {
    throw new AppError('BILL_001', 'Invalid plan ID', 400);
  }

  const plan = PLANS[planId];

  // Check if org already has active subscription
  const existing = await billingRepository.findSubscriptionByOrgId(orgId);
  if (existing && existing.status === 'active') {
    throw new AppError('BILL_002', 'Organization already has active subscription', 409);
  }

  // Create Razorpay order
  const razorpay = await import('../../config/razorpay.js');
  const order = await razorpay.createOrder({
    amount: plan.price,
    currency: plan.currency,
    receipt: `ORG_${orgId}_${Date.now()}`,
    notes: { org_id: orgId, plan_id: planId },
  });

  // Store order in database
  const dbOrder = await billingRepository.createOrder({
    id: order.id,
    org_id: orgId,
    plan_id: planId,
    amount: plan.price,
    currency: plan.currency,
    status: 'pending',
  });

  return formatOrder(dbOrder);
};

/**
 * Verify payment and activate subscription
 */
const verifyPayment = async (orgId, data, billingRepository) => {
  const { orderId, paymentId, signature } = data;

  if (!orderId || !paymentId || !signature) {
    throw new AppError('VAL_001', 'orderId, paymentId, and signature are required', 400);
  }

  // Find order
  const order = await billingRepository.findOrderById(orgId, orderId);
  if (!order) {
    throw new AppError('BILL_003', 'Order not found', 404);
  }

  // Verify signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const data_string = orderId + '|' + paymentId;
  const generated_signature = crypto
    .createHmac('sha256', keySecret)
    .update(data_string)
    .digest('hex');

  if (generated_signature !== signature) {
    throw new AppError('BILL_004', 'Invalid payment signature', 400);
  }

  // Check if payment already processed
  const existing = await billingRepository.findPaymentByPaymentId(paymentId);
  if (existing) {
    throw new AppError('BILL_005', 'Payment already processed', 409);
  }

  // Update order status
  await billingRepository.updateOrder(orgId, orderId, {
    status: 'completed',
    payment_id: paymentId,
  });

  // Create or update subscription
  const currentDate = new Date();
  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + 1);

  let subscription = await billingRepository.findSubscriptionByOrgId(orgId);
  if (subscription) {
    subscription = await billingRepository.updateSubscription(orgId, {
      plan_id: order.plan_id,
      status: 'active',
      current_period_start: currentDate,
      current_period_end: endDate,
    });
  } else {
    subscription = await billingRepository.createSubscription({
      id: uuidv4(),
      org_id: orgId,
      plan_id: order.plan_id,
      status: 'active',
      current_period_start: currentDate,
      current_period_end: endDate,
      auto_renew: true,
    });
  }

  return formatSubscription(subscription);
};

/**
 * Upgrade to higher plan
 */
const upgradePlan = async (orgId, data, billingRepository) => {
  const { newPlanId } = data;

  if (!PLANS[newPlanId]) {
    throw new AppError('BILL_001', 'Invalid plan ID', 400);
  }

  const subscription = await billingRepository.findSubscriptionByOrgId(orgId);
  if (!subscription) {
    throw new AppError('BILL_006', 'No active subscription found', 404);
  }

  // Check if new plan is higher tier
  const planOrder = { starter: 1, professional: 2, enterprise: 3 };
  if (planOrder[newPlanId] <= planOrder[subscription.plan_id]) {
    throw new AppError('BILL_007', 'Can only upgrade to higher plan', 400);
  }

  const updated = await billingRepository.updateSubscription(orgId, {
    plan_id: newPlanId,
  });

  return formatSubscription(updated);
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (orgId, data, billingRepository) => {
  const { reason } = data;

  const subscription = await billingRepository.findSubscriptionByOrgId(orgId);
  if (!subscription) {
    throw new AppError('BILL_006', 'No active subscription found', 404);
  }

  await billingRepository.updateSubscription(orgId, {
    status: 'cancelled',
    cancellation_reason: reason || null,
    cancelled_at: new Date(),
  });
};

/**
 * List invoices
 */
const listInvoices = async (orgId, filters, billingRepository) => {
  const { page, limit } = filters;
  const offset = (page - 1) * limit;

  const result = await billingRepository.listInvoicesPaginated(orgId, {
    offset,
    limit,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    invoices: result.invoices.map(inv => formatInvoice(inv)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

const formatSubscription = (sub) => ({
  planId: sub.plan_id,
  status: sub.status,
  currentPeriodStart: sub.current_period_start,
  currentPeriodEnd: sub.current_period_end,
  autoRenew: sub.auto_renew,
  createdAt: sub.created_at,
});

const formatOrder = (order) => ({
  id: order.id,
  orgId: order.org_id,
  planId: order.plan_id,
  amount: order.amount,
  currency: order.currency,
  status: order.status,
  createdAt: order.created_at,
});

const formatInvoice = (inv) => ({
  id: inv.id,
  planId: inv.plan_id,
  amount: inv.amount,
  currency: inv.currency,
  startDate: inv.period_start,
  endDate: inv.period_end,
  status: inv.status,
  createdAt: inv.created_at,
});

module.exports = {
  listPlans,
  getSubscription,
  createOrder,
  verifyPayment,
  upgradePlan,
  cancelSubscription,
  listInvoices,
};