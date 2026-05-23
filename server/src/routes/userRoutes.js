import express from "express";
import { protect } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const userRoutes = express.Router();

userRoutes.get("/", protect, async (_req, res, next) => {
  try {
    const users = await User.find({ organization: _req.organizationId }).sort({ name: 1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});
