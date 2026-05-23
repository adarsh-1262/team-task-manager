import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Invite } from "../models/Invite.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { signToken } from "../utils/token.js";

export const authRoutes = express.Router();

authRoutes.post(
  "/register-organization",
  [
    body("organizationName")
      .trim()
      .isLength({ min: 2, max: 160 })
      .withMessage("Organization name must be 2-160 characters"),
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  ],
  validate,
  async (req, res, next) => {
    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const organization = await Organization.create({
        name: req.body.organizationName
      });

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: "admin",
        organization: organization._id
      });

      organization.admin = user._id;
      await organization.save();
      await user.populate("organization", "name admin");

      res.status(201).json({
        token: signToken(user),
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

authRoutes.post(
  "/accept-invite",
  [
    body("token").trim().notEmpty().withMessage("Invite token is required"),
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  ],
  validate,
  async (req, res, next) => {
    try {
      const invite = await Invite.findOne({
        token: req.body.token,
        status: "pending",
        expiresAt: { $gt: new Date() }
      }).populate("organization", "name admin");

      if (!invite) {
        return res.status(400).json({ message: "Invite is invalid or expired" });
      }

      if (invite.email !== req.body.email) {
        return res.status(400).json({ message: "Invite email does not match" });
      }

      const existingUser = await User.findOne({ email: req.body.email });

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: "member",
        organization: invite.organization._id
      });

      invite.status = "accepted";
      invite.acceptedAt = new Date();
      await invite.save();
      await user.populate("organization", "name admin");

      res.status(201).json({
        token: signToken(user),
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

authRoutes.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select("+password").populate("organization", "name admin");

      if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        token: signToken(user),
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

authRoutes.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});
