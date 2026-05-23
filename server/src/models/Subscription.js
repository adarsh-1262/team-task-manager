import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan"
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "past_due"],
      default: "active"
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly"
    },
    currentPrice: {
      type: Number,
      required: true
    },
    memberCount: {
      type: Number,
      default: 1
    },
    memberLimit: {
      type: Number,
      required: true
    },
    currentTier: {
      type: Number,
      default: 1
    },
    startDate: {
      type: Date,
      default: () => new Date()
    },
    renewalDate: {
      type: Date,
      required: true
    },
    cancellationDate: Date,
    razorpaySubscriptionId: String,
    razorpayCustomerId: String,
    razorpayPaymentId: String,
    razorpayOrderId: String
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
