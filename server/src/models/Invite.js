import crypto from "crypto";
import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(24).toString("hex")
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending"
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    acceptedAt: Date
  },
  { timestamps: true }
);

inviteSchema.index({ organization: 1, email: 1, status: 1 });

export const Invite = mongoose.model("Invite", inviteSchema);
