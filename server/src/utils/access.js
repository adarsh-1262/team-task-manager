import mongoose from "mongoose";
import { Project } from "../models/Project.js";

export function isSameId(left, right) {
  return String(left) === String(right);
}

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function isProjectMember(project, userId) {
  return project.members.some((member) => isSameId(member.user?._id || member.user, userId));
}

export async function requireProjectAccess(projectId, user) {
  const project = await Project.findOne({
    _id: projectId,
    organization: user.organization?._id || user.organization
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "admin" || isProjectMember(project, user._id)) {
    return project;
  }

  const error = new Error("You are not a member of this project");
  error.statusCode = 403;
  throw error;
}
