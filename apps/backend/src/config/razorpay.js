/**
 * @module razorpay
 * @description Razorpay payment gateway configuration for subscription plans and billing.
 */
const Razorpay = require('razorpay');

const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

// Validate required credentials
if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
  console.warn('⚠️  Razorpay credentials not configured. Payment processing will fail.');
}

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: razorpayConfig.keyId,
  key_secret: razorpayConfig.keySecret,
});

/**
 * Create a subscription order
 * @param {object} params - Order parameters { amount, currency, receipt, customer_id, notes }
 * @returns {Promise} Order details
 */
const createOrder = async (params) => {
  try {
    const order = await razorpay.orders.create({
      amount: params.amount * 100,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      customer_notify: 1,
      notes: params.notes || {},
    });
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
};

/**
 * Create a customer in Razorpay
 * @param {object} params - Customer parameters { email, contact, name }
 * @returns {Promise} Customer details
 */
const createCustomer = async (params) => {
  try {
    const customer = await razorpay.customers.create({
      email: params.email,
      contact: params.contact,
      name: params.name,
    });
    return customer;
  } catch (error) {
    console.error('Razorpay customer creation error:', error);
    throw error;
  }
};

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise} Payment details
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw error;
  }
};

/**
 * Verify payment signature (for webhook validation)
 * @param {object} params - { order_id, payment_id, signature }
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (params) => {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', razorpayConfig.keySecret);
    hmac.update(params.order_id + '|' + params.payment_id);
    const generated_signature = hmac.digest('hex');
    return generated_signature === params.signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
};

module.exports.createOrder = createOrder;
module.exports.createCustomer = createCustomer;
module.exports.fetchPayment = fetchPayment;
module.exports.verifyPaymentSignature = verifyPaymentSignature;
module.exports = razorpayConfig;
