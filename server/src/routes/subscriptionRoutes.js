import express from "express";
import { body, validationResult } from "express-validator";
import { protect, requireAdmin } from "../middleware/auth.js";
import { Subscription } from "../models/Subscription.js";
import { Payment } from "../models/Payment.js";
import { Invoice } from "../models/Invoice.js";
import { User } from "../models/User.js";
import {
  getPricing,
  getNextRenewalDate,
  needsUpgrade,
  generateInvoiceNumber,
  PRICING_CONFIG
} from "../utils/pricing.js";
import {
  createOrder,
  generateCheckoutOptions,
  verifyPaymentSignature,
  fetchPayment
} from "../utils/razorpay.js";

export const subscriptionRoutes = express.Router();

// Get current subscription details
subscriptionRoutes.get("/current", protect, async (req, res, next) => {
  try {
    console.log(`Fetching subscription for org ${req.organizationId}`);
    
    const subscription = await Subscription.findOne({ organization: req.organizationId }).populate("plan");

    if (!subscription) {
      // Return free tier if no subscription exists
      const memberCount = await User.countDocuments({ organization: req.organizationId });
      const pricing = getPricing(memberCount, "monthly");

      console.log(`No subscription found for org ${req.organizationId}, returning free tier. Members: ${memberCount}`);

      return res.json({
        subscription: null,
        plan: pricing,
        status: "free",
        memberCount
      });
    }

    // Always fetch fresh member count from database
    const memberCount = await User.countDocuments({ organization: req.organizationId });
    const pricingPlan = getPricing(memberCount, subscription.billingCycle);

    console.log(`Subscription found for org ${req.organizationId}:`, {
      status: subscription.status,
      tier: subscription.currentTier,
      billingCycle: subscription.billingCycle,
      currentPrice: subscription.currentPrice,
      memberCount: memberCount,
      memberLimit: subscription.memberLimit
    });

    res.json({
      subscription,
      plan: pricingPlan,
      memberCount
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    next(error);
  }
});

// Create payment order (for checkout)
subscriptionRoutes.post(
  "/create-order",
  protect,
  requireAdmin,
  [
    body("memberCount").isInt({ min: 1 }).withMessage("Invalid member count"),
    body("billingCycle").isIn(["monthly", "annual"]).withMessage("Invalid billing cycle")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { memberCount, billingCycle } = req.body;
      // Force minimum paid tier pricing even for small teams
      const pricing = getPricing(memberCount, billingCycle, true);

      console.log(`Creating order for org ${req.organizationId}, amount: ${pricing.totalPrice}`);

      // Create Razorpay order
      const order = await createOrder(pricing.totalPrice, PRICING_CONFIG.CURRENCY, `Team Task Manager - ${billingCycle} subscription`);

      if (!order || !order.id) {
        console.error("Order creation failed:", order);
        return res.status(500).json({ message: "Failed to create payment order" });
      }

      // Generate checkout options
      const checkoutOptions = generateCheckoutOptions(
        order,
        req.organizationId,
        req.user.email,
        req.user.phone || ""
      );

      console.log(`Order created successfully: ${order.id}`);

      res.json({
        order,
        checkoutOptions,
        pricing,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error("Order creation error:", error);
      next(error);
    }
  }
);

// Verify payment and create subscription
subscriptionRoutes.post(
  "/verify-payment",
  protect,
  requireAdmin,
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
    body("memberCount").isInt({ min: 1 }).withMessage("Invalid member count"),
    body("billingCycle").isIn(["monthly", "annual"]).withMessage("Invalid billing cycle")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId, paymentId, signature, memberCount, billingCycle } = req.body;

      console.log(`Verifying payment for org ${req.organizationId}:`, { orderId, paymentId });

      // Verify payment signature
      const isValid = verifyPaymentSignature(orderId, paymentId, signature);

      if (!isValid) {
        console.error("Signature verification failed for payment:", paymentId);
        return res.status(400).json({ message: "Invalid payment signature - signature mismatch" });
      }

      console.log("Signature verified, fetching payment details...");

      // Fetch payment details from Razorpay
      const paymentDetails = await fetchPayment(paymentId);

      console.log("Payment details fetched:", { status: paymentDetails.status, amount: paymentDetails.amount });

      if (paymentDetails.status !== "captured") {
        console.error(`Payment status is ${paymentDetails.status}, expected 'captured'`);
        return res.status(400).json({ message: `Payment not captured. Status: ${paymentDetails.status}` });
      }

      // Use forceMinimumPaid=true to match what create-order used
      // This ensures paid subscriptions get at least Tier 2 pricing
      let pricing = getPricing(memberCount, billingCycle, true);

      // If pricing returned free tier but payment was made, use the actual payment amount
      // This handles cases where memberCount < 4 but user paid for upgrade
      if (pricing.type === "free" && paymentDetails.amount > 0) {
        console.log("Payment made for free tier user, upgrading to paid tier pricing");
        // Recalculate with forced minimum of Tier 2 (4+ members)
        pricing = getPricing(Math.max(memberCount, 4), billingCycle, false);
      }

      // Validate pricing object
      if (!pricing || pricing.memberLimit === undefined) {
        console.error("Invalid pricing object:", pricing);
        return res.status(500).json({ message: "Failed to calculate pricing" });
      }

      // Use actual payment amount from Razorpay, not calculated price
      // This is more reliable than relying on our pricing calculation
      const actualAmount = paymentDetails.amount / 100; // Convert from paise to rupees
      
      console.log("Pricing calculated:", { 
        actualAmount, 
        calculatedPrice: pricing.totalPrice, 
        memberLimit: pricing.memberLimit, 
        tier: pricing.tier, 
        type: pricing.type 
      });

      // Create or update subscription
      let subscription = await Subscription.findOne({ organization: req.organizationId });

      if (!subscription) {
        subscription = new Subscription({
          organization: req.organizationId,
          status: "active",
          billingCycle,
          currentPrice: actualAmount,  // Use actual payment amount
          memberCount,
          memberLimit: pricing.memberLimit,
          currentTier: pricing.tier,
          renewalDate: getNextRenewalDate(billingCycle),
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId
        });
      } else {
        subscription.status = "active";
        subscription.billingCycle = billingCycle;
        subscription.currentPrice = actualAmount;  // Use actual payment amount
        subscription.memberCount = memberCount;
        subscription.memberLimit = pricing.memberLimit;
        subscription.currentTier = pricing.tier;
        subscription.renewalDate = getNextRenewalDate(billingCycle);
        subscription.razorpayPaymentId = paymentId;
        subscription.razorpayOrderId = orderId;
      }

      console.log("Subscription object before save:", {
        organization: subscription.organization,
        currentPrice: subscription.currentPrice,
        memberLimit: subscription.memberLimit,
        status: subscription.status,
        tier: subscription.currentTier
      });

      await subscription.save();
      console.log("Subscription saved:", subscription._id);

      // Create payment record
      const payment = new Payment({
        organization: req.organizationId,
        subscription: subscription._id,
        amount: paymentDetails.amount / 100, // Convert from paise
        currency: paymentDetails.currency,
        status: "successful",
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        billingCycle,
        description: `${billingCycle} subscription for ${memberCount} members`
      });

      await payment.save();
      console.log("Payment record created:", payment._id);

      // Create invoice
      const invoice = new Invoice({
        organization: req.organizationId,
        subscription: subscription._id,
        payment: payment._id,
        invoiceNumber: generateInvoiceNumber(),
        amount: paymentDetails.amount / 100,  // Use actual payment amount
        gst: 0,  // GST already included in payment amount from Razorpay
        totalAmount: paymentDetails.amount / 100,  // Total is the actual payment
        billingPeriodStart: new Date(),
        billingPeriodEnd: subscription.renewalDate,
        dueDate: subscription.renewalDate,
        status: "paid",
        memberCount,
        billingCycle
      });

      await invoice.save();
      console.log("Invoice created:", invoice._id);

      res.json({
        message: "Payment verified and subscription created",
        subscription,
        payment,
        invoice
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      next(error);
    }
  }
);

// Upgrade subscription
subscriptionRoutes.post("/upgrade", protect, requireAdmin, async (req, res, next) => {
  try {
    const memberCount = await User.countDocuments({ organization: req.organizationId });

    const subscription = await Subscription.findOne({ organization: req.organizationId });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const pricing = getPricing(memberCount, subscription.billingCycle);

    // Check if upgrade needed
    if (pricing.tier === subscription.currentTier) {
      return res.status(400).json({ message: "No upgrade needed" });
    }

    // Calculate price difference for proration
    const oldPrice = subscription.currentPrice;
    const newPrice = pricing.totalPrice;
    const priceDifference = newPrice - oldPrice;

    // Create order for price difference
    const order = await createOrder(
      Math.abs(priceDifference),
      PRICING_CONFIG.CURRENCY,
      `Upgrade to ${pricing.tier} tier`
    );

    res.json({
      order,
      pricing,
      priceDifference,
      message: "Upgrade order created"
    });
  } catch (error) {
    next(error);
  }
});

// Get billing history
subscriptionRoutes.get("/history", protect, requireAdmin, async (req, res, next) => {
  try {
    const payments = await Payment.find({ organization: req.organizationId })
      .sort({ createdAt: -1 })
      .limit(12);

    const invoices = await Invoice.find({ organization: req.organizationId })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({
      payments,
      invoices
    });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
subscriptionRoutes.post("/cancel", protect, requireAdmin, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ organization: req.organizationId });

    if (!subscription) {
      return res.status(404).json({ message: "No subscription found" });
    }

    subscription.status = "cancelled";
    subscription.cancellationDate = new Date();

    await subscription.save();

    res.json({
      message: "Subscription cancelled",
      subscription
    });
  } catch (error) {
    next(error);
  }
});

// Get pricing plans
subscriptionRoutes.get("/pricing/plans", async (req, res, next) => {
  try {
    const plans = [
      { tier: 1, type: "free", memberLimit: 3, monthlyPrice: 0, annualPrice: 0 },
      { tier: 2, type: "pro", memberLimit: 10, monthlyPrice: 1000, annualPrice: 10200 },
      { tier: 3, type: "pro", memberLimit: 20, monthlyPrice: 2000, annualPrice: 20400 },
      { tier: 4, type: "pro", memberLimit: 30, monthlyPrice: 3000, annualPrice: 30600 },
      { tier: 5, type: "pro", memberLimit: 40, monthlyPrice: 4000, annualPrice: 40800 }
    ];

    res.json({ plans });
  } catch (error) {
    next(error);
  }
});
