import express from "express";
import { body } from "express-validator";
import { protect, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Invite } from "../models/Invite.js";
import { User } from "../models/User.js";
import { sendInviteEmail } from "../utils/email.js";

export const inviteRoutes = express.Router();

inviteRoutes.get("/", protect, requireAdmin, async (req, res, next) => {
  try {
    const invites = await Invite.find({ organization: req.organizationId })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ invites });
  } catch (error) {
    next(error);
  }
});

inviteRoutes.post(
  "/",
  protect,
  requireAdmin,
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required")],
  validate,
  async (req, res, next) => {
    try {
      const existingUser = await User.findOne({ email: req.body.email });

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      await Invite.updateMany(
        { organization: req.organizationId, email: req.body.email, status: "pending" },
        { status: "revoked" }
      );

      const invite = await Invite.create({
        organization: req.organizationId,
        email: req.body.email,
        invitedBy: req.user._id
      });

      const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}?invite=${invite.token}`;

      // Send invite email
      try {
        await sendInviteEmail(req.body.email, inviteUrl, req.user.name);
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Don't fail the request if email fails, but log the error
      }

      res.status(201).json({
        invite,
        inviteUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

// Resend invite email
inviteRoutes.post("/:inviteId/resend", protect, requireAdmin, async (req, res, next) => {
  try {
    const invite = await Invite.findOne({
      _id: req.params.inviteId,
      organization: req.organizationId
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Can only resend pending invites" });
    }

    const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}?invite=${invite.token}`;

    // Send invite email
    try {
      await sendInviteEmail(invite.email, inviteUrl, req.user.name);
      res.json({ message: "Invite email resent", invite });
    } catch (emailError) {
      console.error("Failed to resend invite email:", emailError);
      res.status(500).json({ message: "Failed to send email" });
    }
  } catch (error) {
    next(error);
  }
});

// Revoke invite
inviteRoutes.put("/:inviteId/revoke", protect, requireAdmin, async (req, res, next) => {
  try {
    const invite = await Invite.findOne({
      _id: req.params.inviteId,
      organization: req.organizationId
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Can only revoke pending invites" });
    }

    invite.status = "revoked";
    await invite.save();

    res.json({ message: "Invite revoked", invite });
  } catch (error) {
    next(error);
  }
});
