import express from "express";
import { protect } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

export const dashboardRoutes = express.Router();

dashboardRoutes.get("/", protect, async (req, res, next) => {
  try {
    const projectFilter =
      req.user.role === "admin"
        ? { organization: req.organizationId }
        : { organization: req.organizationId, "members.user": req.user._id };
    const projects = await Project.find(projectFilter).select("_id");
    const projectIds = projects.map((project) => project._id);
    const baseTaskFilter = { organization: req.organizationId, project: { $in: projectIds } };
    const now = new Date();

    const [tasks, byStatus] = await Promise.all([
      Task.find(baseTaskFilter)
        .populate([
          { path: "project", select: "name" },
          { path: "assignee", select: "name email role" }
        ])
        .sort({ dueDate: 1, createdAt: -1 }),
      Task.aggregate([
        { $match: baseTaskFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };

    byStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== "done");
    const myTasks = tasks.filter((task) => String(task.assignee?._id) === String(req.user._id));

    res.json({
      summary: {
        projects: projects.length,
        tasks: tasks.length,
        assignedToMe: myTasks.length,
        overdue: overdueTasks.length,
        completed: statusCounts.done
      },
      byStatus: statusCounts,
      overdueTasks: overdueTasks.slice(0, 8),
      myTasks: myTasks.slice(0, 8)
    });
  } catch (error) {
    next(error);
  }
});
