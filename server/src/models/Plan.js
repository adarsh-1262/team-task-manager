import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    minMembers: {
      type: Number,
      required: true
    },
    maxMembers: {
      type: Number,
      required: true
    },
    monthlyPrice: {
      type: Number,
      required: true,
      default: 0
    },
    annualPrice: {
      type: Number,
      required: true
    },
    features: {
      type: [String],
      default: []
    },
    tier: {
      type: String,
      enum: ["free", "pro"],
      default: "pro"
    }
  },
  { timestamps: true }
);

export const Plan = mongoose.model("Plan", planSchema);
