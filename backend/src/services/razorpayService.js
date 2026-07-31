import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Support Mock Mode if keys are not set or equal to template placeholders
export const isMockMode = !keyId || keyId.startsWith('your_') || !keySecret || keySecret.startsWith('your_');

let razorpayInstance = null;

if (!isMockMode) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('💳 Razorpay SDK initialized successfully in Real Mode.');
  } catch (err) {
    console.warn('⚠️ Razorpay initialization failed. Defaulting to Mock Mode.', err.message);
  }
} else {
  console.log('🧱 Razorpay starting in Mock Mode for testing.');
}

/**
 * Creates a generic transaction order on Razorpay.
 * @param {Number} amount - Amount in INR.
 * @param {String} receipt - Unique identifier reference.
 * @returns {Promise<Object>}
 */
export const createRazorpayOrder = async (amount, receipt) => {
  if (isMockMode || !razorpayInstance) {
    // Generate simulated order
    const mockOrderId = `mock_order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      id: mockOrderId,
      amount: amount * 100, // in paisa
      currency: 'INR',
      receipt,
      status: 'created',
      isMock: true
    };
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paisa
      currency: 'INR',
      receipt: String(receipt)
    };
    const order = await razorpayInstance.orders.create(options);
    return {
      ...order,
      isMock: false
    };
  } catch (error) {
    console.error('❌ Razorpay Order Creation Error:', error.message);
    throw new Error(`Razorpay order creation failed: ${error.message}`);
  }
};

/**
 * Verifies the validity of a Razorpay payment signature.
 * @param {String} orderId - Razorpay order ID.
 * @param {String} paymentId - Razorpay payment ID.
 * @param {String} signature - Razorpay transaction signature.
 * @returns {Boolean}
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (isMockMode) {
    // Mock signature verification always succeeds for testing keys
    return orderId.startsWith('mock_') && paymentId.startsWith('mock_');
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('❌ Razorpay Signature Verification Exception:', error.message);
    return false;
  }
};

/**
 * Fetches transaction details directly from the Razorpay API.
 * @param {String} paymentId - Razorpay payment ID.
 * @returns {Promise<Object>}
 */
export const fetchRazorpayPayment = async (paymentId) => {
  if (isMockMode || !razorpayInstance) {
    return {
      id: paymentId,
      status: 'captured',
      amount: 500000,
      order_id: 'mock_order_id'
    };
  }

  try {
    return await razorpayInstance.payments.fetch(paymentId);
  } catch (error) {
    console.error('❌ Razorpay Fetch Payment Error:', error.message);
    throw new Error(`Razorpay fetch payment failed: ${error.message}`);
  }
};

/**
 * Validates the Razorpay webhook raw signature string using the Webhook Secret key.
 * @param {Buffer|String} rawBody - Raw body payload.
 * @param {String} signature - Signature header value.
 * @param {String} secret - Secret webhook key.
 * @returns {Boolean}
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (isMockMode) {
    return true; // Webhook check defaults to success in mock mode
  }

  try {
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString() : rawBody;
    return Razorpay.validateWebhookSignature(bodyStr, signature, secret);
  } catch (error) {
    console.error('❌ Webhook signature validation exception:', error.message);
    return false;
  }
};

/**
 * Fetches all payment transactions associated with a specific Razorpay order ID.
 * @param {String} orderId - Razorpay order ID.
 * @returns {Promise<Object>}
 */
export const fetchPaymentsForOrder = async (orderId) => {
  if (isMockMode || !razorpayInstance) {
    return {
      items: [{
        id: 'mock_pay_reconcile',
        status: 'captured',
        amount: 500000,
        order_id: orderId
      }]
    };
  }

  try {
    return await razorpayInstance.orders.fetchPayments(orderId);
  } catch (error) {
    console.error('❌ Razorpay Fetch Payments for Order Error:', error.message);
    throw new Error(`Razorpay fetch payments for order failed: ${error.message}`);
  }
};
