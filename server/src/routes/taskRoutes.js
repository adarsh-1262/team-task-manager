import express from "express";
import { body, param, query } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { isProjectMember, isSameId, requireProjectAccess } from "../utils/access.js";

export const taskRoutes = express.Router();

const taskPopulate = [
  { path: "project", select: "name dueDate owner" },
  { path: "assignee", select: "name email role" },
  { path: "creator", select: "name email role" }
];

function accessibleProjectFilter(user) {
  const organization = user.organization?._id || user.organization;
  return user.role === "admin" ? null : Project.find({ organization, "members.user": user._id }).select("_id");
}

taskRoutes.get(
  "/",
  protect,
  [
    query("projectId").optional().isMongoId().withMessage("Valid project id is required"),
    query("status").optional().isIn(["todo", "in_progress", "review", "done"]).withMessage("Invalid status")
  ],
  validate,
  async (req, res, next) => {
    try {
      const filter = {};
      filter.organization = req.organizationId;

      if (req.query.projectId) {
        await requireProjectAccess(req.query.projectId, req.user);
        filter.project = req.query.projectId;
      } else {
        const memberProjects = await accessibleProjectFilter(req.user);
        if (memberProjects) filter.project = { $in: memberProjects.map((project) => project._id) };
      }

      if (req.query.status) filter.status = req.query.status;

      const tasks = await Task.find(filter)
        .populate(taskPopulate)
        .sort({ status: 1, dueDate: 1, createdAt: -1 });

      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  }
);

taskRoutes.post(
  "/",
  protect,
  [
    body("projectId").isMongoId().withMessage("Valid project id is required"),
    body("title").trim().isLength({ min: 2, max: 180 }).withMessage("Title must be 2-180 characters"),
    body("description").optional().trim().isLength({ max: 1200 }).withMessage("Description is too long"),
    body("assigneeId").optional({ values: "falsy" }).isMongoId().withMessage("Valid assignee id is required"),
    body("status").optional().isIn(["todo", "in_progress", "review", "done"]).withMessage("Invalid status"),
    body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
    body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be valid")
  ],
  validate,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.body.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (!isSameId(project.organization, req.organizationId)) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only the organization admin can create tasks" });
      }

      if (req.body.assigneeId && !isProjectMember(project, req.body.assigneeId)) {
        return res.status(400).json({ message: "Assignee must be a project member" });
      }

      const task = await Task.create({
        project: project._id,
        organization: req.organizationId,
        title: req.body.title,
        description: req.body.description || "",
        assignee: req.body.assigneeId || null,
        creator: req.user._id,
        status: req.body.status || "todo",
        priority: req.body.priority || "medium",
        dueDate: req.body.dueDate || undefined
      });

      await task.populate(taskPopulate);
      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  }
);

taskRoutes.put(
  "/:taskId",
  protect,
  [param("taskId").isMongoId().withMessage("Valid task id is required")],
  validate,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const project = await requireProjectAccess(task.project, req.user);
      const canManageTask = req.user.role === "admin";
      const updates = {};

      if (req.body.status) {
        if (!["todo", "in_progress", "review", "done"].includes(req.body.status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        if (!canManageTask && !isSameId(task.assignee, req.user._id)) {
          return res.status(403).json({ message: "Members can only update assigned task status" });
        }

        updates.status = req.body.status;
      }

      if (canManageTask) {
        if (req.body.title !== undefined) updates.title = req.body.title;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.priority !== undefined) updates.priority = req.body.priority;
        if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate || null;
        if (req.body.assigneeId !== undefined) {
          if (req.body.assigneeId && !isProjectMember(project, req.body.assigneeId)) {
            return res.status(400).json({ message: "Assignee must be a project member" });
          }
          updates.assignee = req.body.assigneeId || null;
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No permitted changes supplied" });
      }

      const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, updates, {
        new: true,
        runValidators: true
      }).populate(taskPopulate);

      res.json({ task: updatedTask });
    } catch (error) {
      next(error);
    }
  }
);

taskRoutes.delete(
  "/:taskId",
  protect,
  [param("taskId").isMongoId().withMessage("Valid task id is required")],
  validate,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await requireProjectAccess(task.project, req.user);
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only the organization admin can delete tasks" });
      }

      await task.deleteOne();

      res.json({ message: "Task deleted" });
    } catch (error) {
      next(error);
    }
  }
);
