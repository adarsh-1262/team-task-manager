import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription"
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending"
    },
    razorpayPaymentId: String,
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentMethod: String,
    description: String,
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"]
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    }
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);
