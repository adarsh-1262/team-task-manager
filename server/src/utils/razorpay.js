import Razorpay from "razorpay";
import crypto from "crypto";
import { generateInvoiceNumber } from "./pricing.js";

// Don't cache the instance - reinitialize each time to pick up latest env vars
export function initializeRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }
  
  const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  
  console.log(`[Razorpay] Initialized with KEY_ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 15)}...`);
  return razorpayInstance;
}

/**
 * Create a Razorpay order for one-time payment
 */
export async function createOrder(amount, currency = "INR", description = "") {
  try {
    const razorpay = initializeRazorpay();

    const options = {
      amount: Math.round(amount * 100), // Amount in paise (1 rupee = 100 paise)
      currency,
      description,
      notes: {
        type: "subscription"
      }
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}

/**
 * Create a recurring subscription order (for monthly/annual billing)
 */
export async function createSubscriptionOrder(customerId, amount, currency = "INR", billingCycle = "monthly") {
  try {
    const razorpay = initializeRazorpay();

    // Calculate interval (in months)
    const interval = billingCycle === "monthly" ? 1 : 12;
    const period = billingCycle === "monthly" ? "monthly" : "yearly";

    const options = {
      plan_id: customerId, // Using customer ID as placeholder for plan
      customer_notify: 1,
      quantity: 1,
      total_count: 0, // Infinite recurring
      description: `${period.charAt(0).toUpperCase() + period.slice(1)} Team Task Manager subscription`
    };

    // For now, we'll use simple orders. Full subscription API needs plan_id
    const order = await createOrder(amount, currency, `Subscription - ${period}`);

    return {
      ...order,
      period,
      interval
    };
  } catch (error) {
    console.error("Error creating subscription order:", error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const message = orderId + "|" + paymentId;

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(message)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
}

/**
 * Verify webhook signature from Razorpay
 */
export function verifyWebhookSignature(body, signature) {
  try {
    const keySecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(JSON.stringify(body))
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPayment(paymentId) {
  try {
    const razorpay = initializeRazorpay();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Error fetching payment:", error);
    throw error;
  }
}

/**
 * Fetch order details from Razorpay
 */
export async function fetchOrder(orderId) {
  try {
    const razorpay = initializeRazorpay();
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentId, amount = null) {
  try {
    const razorpay = initializeRazorpay();

    const options = amount ? { amount: Math.round(amount * 100) } : {};

    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error("Error refunding payment:", error);
    throw error;
  }
}

/**
 * Generate Razorpay checkout options for frontend
 */
export function generateCheckoutOptions(order, organizationId, userEmail, userPhone) {
  return {
    key: process.env.RAZORPAY_KEY_ID,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    name: "Team Task Manager",
    description: "Organization Subscription",
    // Don't include customer_id - Razorpay only accepts pre-existing customer IDs
    // Instead, use notes to store our reference
    prefill: {
      email: userEmail,
      contact: userPhone || ""
    },
    theme: {
      color: "#3b82f6"
    },
    receipt: generateInvoiceNumber(),
    notes: {
      organizationId: organizationId.toString(),
      invoiceNumber: generateInvoiceNumber()
    },
    // Enable multiple payment methods
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
      emandate: false
    }
  };
}
