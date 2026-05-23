import express from "express";
import { body, param } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { isProjectMember, isSameId, requireProjectAccess } from "../utils/access.js";

export const projectRoutes = express.Router();

async function withProjectStats(projects) {
  const ids = projects.map((project) => project._id);
  const taskStats = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    {
      $group: {
        _id: "$project",
        taskCount: { $sum: 1 },
        doneCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "done"] }, 1, 0]
          }
        }
      }
    }
  ]);
  const statsByProject = new Map(taskStats.map((item) => [String(item._id), item]));

  return projects.map((project) => {
    const data = project.toJSON();
    const stats = statsByProject.get(String(project._id));
    return {
      ...data,
      memberCount: project.members.length,
      taskCount: stats?.taskCount || 0,
      doneCount: stats?.doneCount || 0
    };
  });
}

projectRoutes.get("/", protect, async (req, res, next) => {
  try {
    const query =
      req.user.role === "admin"
        ? { organization: req.organizationId }
        : { organization: req.organizationId, "members.user": req.user._id };
    const projects = await Project.find(query)
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    res.json({ projects: await withProjectStats(projects) });
  } catch (error) {
    next(error);
  }
});

projectRoutes.post(
  "/",
  protect,
  [
    body("name").trim().isLength({ min: 2, max: 160 }).withMessage("Name must be 2-160 characters"),
    body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description is too long"),
    body("dueDate").optional({ values: "falsy" }).isISO8601().withMessage("Due date must be valid")
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only the organization admin can create projects" });
      }

      const project = await Project.create({
        name: req.body.name,
        description: req.body.description || "",
        owner: req.user._id,
        organization: req.organizationId,
        dueDate: req.body.dueDate || undefined,
        members: [{ user: req.user._id, role: "owner" }]
      });

      await project.populate("owner", "name email role");
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  }
);

projectRoutes.get(
  "/:projectId/members",
  protect,
  [param("projectId").isMongoId().withMessage("Valid project id is required")],
  validate,
  async (req, res, next) => {
    try {
      const project = await requireProjectAccess(req.params.projectId, req.user);
      await project.populate("members.user", "name email role");

      res.json({
        members: project.members.map((member) => ({
          _id: member.user._id,
          name: member.user.name,
          email: member.user.email,
          globalRole: member.user.role,
          projectRole: member.role,
          joinedAt: member.joinedAt
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

projectRoutes.post(
  "/:projectId/members",
  protect,
  [
    param("projectId").isMongoId().withMessage("Valid project id is required"),
    body("userId").isMongoId().withMessage("Valid user id is required")
  ],
  validate,
  async (req, res, next) => {
    try {
      const [project, user] = await Promise.all([
        Project.findOne({ _id: req.params.projectId, organization: req.organizationId }),
        User.findOne({ _id: req.body.userId, organization: req.organizationId })
      ]);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only the organization admin can add members" });
      }

      if (!isProjectMember(project, user._id)) {
        project.members.push({ user: user._id, role: isSameId(project.owner, user._id) ? "owner" : "member" });
        await project.save();
      }

      res.status(201).json({ member: user });
    } catch (error) {
      next(error);
    }
  }
);
