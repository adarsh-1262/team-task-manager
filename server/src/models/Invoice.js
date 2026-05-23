import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment"
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    gst: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    billingPeriodStart: {
      type: Date,
      required: true
    },
    billingPeriodEnd: {
      type: Date,
      required: true
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "overdue"],
      default: "issued"
    },
    pdfUrl: String,
    memberCount: Number,
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"]
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1 });

export const Invoice = mongoose.model("Invoice", invoiceSchema);
