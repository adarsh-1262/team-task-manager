import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CheckCircle2,
  FolderKanban,
  ListTodo,
  LogOut,
  Pencil,
  Plus,
  Save,
  Shield,
  Trash2,
  UserPlus,
  CreditCard
} from "lucide-react";
import { BillingDashboard } from "./BillingDashboard.jsx";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const statusLabels = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("ttm_user"));
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("ttm_token"));
  const [user, setUser] = useState(getStoredUser());
  const [authMode, setAuthMode] = useState("login");
  const [inviteToken, setInviteToken] = useState(new URLSearchParams(window.location.search).get("invite") || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [adminTab, setAdminTab] = useState("create");

  const isAdmin = user?.role === "admin";
  const manageableProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter((project) => isAdmin || project.owner?._id === user._id || project.owner === user._id);
  }, [isAdmin, projects, user]);
  const selectedManageProjectId = manageableProjects.some((project) => project._id === selectedProjectId)
    ? selectedProjectId
    : manageableProjects[0]?._id || "";

  async function request(path, options = {}, authToken = token) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return payload;
  }

  function saveSession(payload) {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem("ttm_token", payload.token);
    localStorage.setItem("ttm_user", JSON.stringify(payload.user));
  }

  function logout() {
    setToken(null);
    setUser(null);
    setDashboard(null);
    setProjects([]);
    setTasks([]);
    localStorage.removeItem("ttm_token");
    localStorage.removeItem("ttm_user");
  }

  async function loadMembers(projectId = selectedProjectId, authToken = token) {
    if (!projectId || !authToken) {
      setMembers([]);
      return;
    }
    const payload = await request(`/projects/${projectId}/members`, {}, authToken);
    setMembers(payload.members);
  }

  async function loadData(activeUser = user, authToken = token) {
    if (!authToken || !activeUser) return;
    const [dashboardPayload, projectPayload, taskPayload, userPayload, invitePayload] = await Promise.all([
      request("/dashboard", {}, authToken),
      request("/projects", {}, authToken),
      request("/tasks", {}, authToken),
      request("/users", {}, authToken),
      activeUser.role === "admin" ? request("/invites", {}, authToken) : Promise.resolve({ invites: [] })
    ]);

    setDashboard(dashboardPayload);
    setProjects(projectPayload.projects);
    setTasks(taskPayload.tasks);
    setUsers(userPayload.users);
    setInvites(invitePayload.invites);

    const nextProjectId = selectedProjectId || projectPayload.projects[0]?._id || "";
    setSelectedProjectId(nextProjectId);
    if (nextProjectId) {
      const memberPayload = await request(`/projects/${nextProjectId}/members`, {}, authToken);
      setMembers(memberPayload.members);
    }
  }

  async function runAction(action, successText) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await action();
      if (result?.token && result?.user) {
        await loadData(result.user, result.token);
      } else if (token && user) {
        await loadData(user, token);
      }
      setMessage(successText || "");
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (inviteToken) setAuthMode("invite");
  }, [inviteToken]);

  useEffect(() => {
    if (!token) return;
    runAction(async () => {
      const payload = await request("/auth/me", {}, token);
      setUser(payload.user);
      localStorage.setItem("ttm_user", JSON.stringify(payload.user));
      await loadData(payload.user, token);
    });
  }, []);

  useEffect(() => {
    if (!token || adminTab !== "create" || !selectedManageProjectId) return;
    if (selectedProjectId === selectedManageProjectId) return;
    setSelectedProjectId(selectedManageProjectId);
    loadMembers(selectedManageProjectId);
  }, [adminTab, selectedManageProjectId, selectedProjectId, token]);

  const selectedTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter((task) => task.project?._id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  if (!token || !user) {
    return (
      <main className="shell authShell">
        <section className="authCopy">
          <div className="brand">
            <span className="brandMark">TT</span>
            <div>
              <h1>Team Task Manager</h1>
              <p>MERN project workspace for teams, tasks, role-based access, and progress tracking.</p>
            </div>
          </div>
          <div className="featureGrid">
            <Feature icon={<Shield />} title="RBAC" text="Admin and Member access." />
            <Feature icon={<FolderKanban />} title="Projects" text="Teams and ownership." />
            <Feature icon={<CheckCircle2 />} title="Tasks" text="Status and overdue tracking." />
          </div>
        </section>
        <section className="panel authPanel">
          <div className="tabs">
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
              Login
            </button>
            <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
              Register org
            </button>
            <button className={authMode === "invite" ? "active" : ""} onClick={() => setAuthMode("invite")}>
              Join invite
            </button>
          </div>
          <Notice error={error} message={message} />
          <AuthForm
            mode={authMode}
            loading={loading}
            onSubmit={(form) =>
              runAction(async () => {
                const path =
                  authMode === "login"
                    ? "/auth/login"
                    : authMode === "register"
                      ? "/auth/register-organization"
                      : "/auth/accept-invite";
                const payload = await request(path, {
                  method: "POST",
                  body: JSON.stringify(form)
                }, null);
                saveSession(payload);
                if (authMode === "invite") {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  setInviteToken("");
                }
                return payload;
              }, "Welcome")
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">TT</span>
          <div>
            <h1>Team Task Manager</h1>
            <p>
              {user.name} - {user.role}
            </p>
          </div>
        </div>
        <button className="secondary iconButton" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <Notice error={error} message={message} />
      <Stats dashboard={dashboard} />

      {isAdmin && (
        <div className="dashboardTabs">
          <button className={adminTab === "create" ? "active" : ""} onClick={() => setAdminTab("create")}>
            <Plus size={18} />
            Create
          </button>
          <button className={adminTab === "tasks" ? "active" : ""} onClick={() => setAdminTab("tasks")}>
            <ListTodo size={18} />
            Tasks
          </button>
          <button className={adminTab === "billing" ? "active" : ""} onClick={() => setAdminTab("billing")}>
            <CreditCard size={18} />
            Billing
          </button>
        </div>
      )}

      {isAdmin && adminTab === "create" ? (
        <section className="createGrid">
          <div className="createColumn">
            <CreateProjectForm
              loading={loading}
              onSubmit={(form) =>
                runAction(
                  () =>
                    request("/projects", {
                      method: "POST",
                      body: JSON.stringify(form)
                    }),
                  "Project created"
                )
              }
            />
            <TeamForm
              users={users}
              projects={manageableProjects}
              members={selectedManageProjectId ? members : []}
              selectedProjectId={selectedManageProjectId}
              loading={loading}
              onProjectChange={async (projectId) => {
                setSelectedProjectId(projectId);
                await loadMembers(projectId);
              }}
              onSubmit={(form) =>
                runAction(async () => {
                  setSelectedProjectId(form.projectId);
                  await request(`/projects/${form.projectId}/members`, {
                    method: "POST",
                    body: JSON.stringify({ userId: form.userId })
                  });
                }, "Member added")
              }
            />
          </div>
          <div className="createColumn">
            <CreateTaskForm
              projects={manageableProjects}
              members={selectedManageProjectId ? members : []}
              selectedProjectId={selectedManageProjectId}
              loading={loading}
              onProjectChange={async (projectId) => {
                setSelectedProjectId(projectId);
                await loadMembers(projectId);
              }}
              onSubmit={(form) =>
                runAction(
                  () =>
                    request("/tasks", {
                      method: "POST",
                      body: JSON.stringify(form)
                    }),
                  "Task created"
                )
              }
            />
            <InviteMemberForm
              loading={loading}
              invites={invites}
              onSubmit={(form) =>
                runAction(
                  () =>
                    request("/invites", {
                      method: "POST",
                      body: JSON.stringify(form)
                    }),
                  "Invite created"
                )
              }
              onResend={(inviteId) =>
                runAction(
                  () =>
                    request(`/invites/${inviteId}/resend`, {
                      method: "POST"
                    }),
                  "Invite email resent"
                )
              }
              onRevoke={(inviteId) =>
                runAction(
                  () =>
                    request(`/invites/${inviteId}/revoke`, {
                      method: "PUT"
                    }),
                  "Invite revoked"
                )
              }
            />
          </div>
        </section>
      ) : adminTab === "billing" ? (
        <BillingDashboard token={token} />
      ) : (
        <section className="layout">
          <aside className="sidebar">
            <section className="panel">
              <div className="panelHead">
                <h2>Projects</h2>
                <FolderKanban size={18} />
              </div>
              <ProjectList
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelect={async (projectId) => {
                  setSelectedProjectId(projectId);
                  await loadMembers(projectId);
                }}
              />
            </section>

            <section className="panel">
              <div className="panelHead">
                <h2>Status</h2>
                <ListTodo size={18} />
              </div>
              <StatusBars counts={dashboard?.byStatus} />
            </section>
          </aside>

          <section className="content">
            <section className="panel">
              <div className="panelHead">
                <div>
                  <h2>Tasks</h2>
                  <p>{selectedProjectId ? "Filtered by selected project" : "All accessible tasks"}</p>
                </div>
                <ListTodo size={18} />
              </div>
              <TaskList
                tasks={selectedTasks}
                user={user}
                members={members}
                loading={loading}
                onStatusChange={(taskId, status) =>
                  runAction(
                    () =>
                      request(`/tasks/${taskId}`, {
                        method: "PUT",
                        body: JSON.stringify({ status })
                      }),
                    "Task updated"
                  )
                }
                onTaskEdit={(taskId, form) =>
                  runAction(
                    () =>
                      request(`/tasks/${taskId}`, {
                        method: "PUT",
                        body: JSON.stringify(form)
                      }),
                    "Task updated"
                  )
                }
                onTaskDelete={(taskId) =>
                  runAction(
                    () =>
                      request(`/tasks/${taskId}`, {
                        method: "DELETE"
                      }),
                    "Task deleted"
                  )
                }
              />
            </section>

            <section className="panel">
              <div className="panelHead">
                <h2>Overdue</h2>
              </div>
              <MiniTaskList tasks={dashboard?.overdueTasks || []} empty="No overdue tasks." />
            </section>
          </section>
        </section>
      )}
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Notice({ error, message }) {
  if (error) return <div className="notice error">{error}</div>;
  if (message) return <div className="notice success">{message}</div>;
  return null;
}

function AuthForm({ mode, loading, onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
  };

  return (
    <form className="formGrid" onSubmit={handleSubmit}>
      {mode === "register" && (
        <>
          <label>
            Organization
            <input name="organizationName" required minLength="2" />
          </label>
          <label>
            Name
            <input name="name" required minLength="2" />
          </label>
        </>
      )}
      {mode === "invite" && (
        <>
          <label>
            Invite token
            <input name="token" required defaultValue={new URLSearchParams(window.location.search).get("invite") || ""} />
          </label>
          <label>
            Name
            <input name="name" required minLength="2" />
          </label>
        </>
      )}
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" required minLength="8" />
      </label>
      <button disabled={loading}>
        {mode === "login" ? "Login" : mode === "register" ? "Register organization" : "Join organization"}
      </button>
    </form>
  );
}

function Stats({ dashboard }) {
  const summary = dashboard?.summary || {};
  const stats = [
    ["Projects", summary.projects || 0],
    ["Tasks", summary.tasks || 0],
    ["Mine", summary.assignedToMe || 0],
    ["Overdue", summary.overdue || 0],
    ["Done", summary.completed || 0]
  ];

  return (
    <section className="stats">
      {stats.map(([label, value]) => (
        <article className="stat" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

function ProjectList({ projects, selectedProjectId, onSelect }) {
  if (!projects.length) return <div className="empty">No projects yet.</div>;

  return (
    <div className="list">
      {projects.map((project) => (
        <button
          className={`projectCard ${selectedProjectId === project._id ? "active" : ""}`}
          key={project._id}
          onClick={() => onSelect(project._id)}
        >
          <strong>{project.name}</strong>
          <span>{project.description || "No description"}</span>
          <small>
            {project.memberCount} members - {project.doneCount}/{project.taskCount} done
          </small>
        </button>
      ))}
    </div>
  );
}

function StatusBars({ counts = {} }) {
  const total = Math.max(1, Object.values(counts).reduce((sum, value) => sum + value, 0));

  return (
    <div className="bars">
      {Object.entries(statusLabels).map(([status, label]) => {
        const count = counts[status] || 0;
        return (
          <div className="barRow" key={status}>
            <span>{label}</span>
            <div className="bar">
              <i style={{ width: `${(count / total) * 100}%` }} />
            </div>
            <b>{count}</b>
          </div>
        );
      })}
    </div>
  );
}

function InviteMemberForm({ loading, invites, onSubmit, onResend, onRevoke }) {
  const [copiedId, setCopiedId] = useState("");
  const [expandedId, setExpandedId] = useState("");

  const copyToClipboard = (inviteId, token) => {
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(""), 2000);
  };

  return (
    <section className="panel">
      <div className="panelHead">
        <h2>Invite member</h2>
        <UserPlus size={18} />
      </div>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
          event.currentTarget.reset();
        }}
      >
        <label>
          Member email
          <input name="email" type="email" required />
        </label>
        <button disabled={loading}>Create invite</button>
      </form>
      <div className="inviteList">
        {invites.length ? (
          invites.map((invite) => (
            <div className="inviteItem" key={invite._id}>
              <div className="inviteItemHeader">
                <div>
                  <strong>{invite.email}</strong>
                  <span className={`status ${invite.status}`}>{invite.status}</span>
                </div>
                <small>{new Date(invite.createdAt).toLocaleDateString()}</small>
              </div>
              {expandedId === invite._id && (
                <div className="inviteItemActions">
                  <button
                    type="button"
                    className="secondary small"
                    onClick={() => copyToClipboard(invite._id, invite.token)}
                    disabled={loading}
                  >
                    {copiedId === invite._id ? "Copied!" : "Copy Link"}
                  </button>
                  {invite.status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="secondary small"
                        onClick={() => onResend(invite._id)}
                        disabled={loading}
                      >
                        Resend Email
                      </button>
                      <button
                        type="button"
                        className="danger small"
                        onClick={() => {
                          if (window.confirm(`Revoke invite for ${invite.email}?`)) {
                            onRevoke(invite._id);
                          }
                        }}
                        disabled={loading}
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                className="tertiary small"
                onClick={() => setExpandedId(expandedId === invite._id ? "" : invite._id)}
              >
                {expandedId === invite._id ? "Hide" : "Show"} actions
              </button>
            </div>
          ))
        ) : (
          <div className="empty">No invites yet.</div>
        )}
      </div>
    </section>
  );
}

function CreateProjectForm({ loading, onSubmit }) {
  return (
    <section className="panel">
      <div className="panelHead">
        <h2>Create project</h2>
        <Plus size={18} />
      </div>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
          event.currentTarget.reset();
        }}
      >
        <label>
          Name
          <input name="name" required minLength="2" />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <label>
          Due date
          <input name="dueDate" type="date" />
        </label>
        <button disabled={loading}>Create project</button>
      </form>
    </section>
  );
}

function TeamForm({ users, projects, members, selectedProjectId, loading, onProjectChange, onSubmit }) {
  const currentProjectId = selectedProjectId || projects[0]?._id || "";

  return (
    <section className="panel">
      <div className="panelHead">
        <h2>Team</h2>
        <UserPlus size={18} />
      </div>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
        }}
      >
        <label>
          Project
          <select
            name="projectId"
            value={currentProjectId}
            onChange={(event) => onProjectChange(event.target.value)}
            required
          >
            {!projects.length && <option value="">Create a project first</option>}
            {projects.map((project) => (
              <option value={project._id} key={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          User
          <select name="userId" required>
            {!users.length && <option value="">No users available</option>}
            {users.map((teamUser) => (
              <option value={teamUser._id} key={teamUser._id}>
                {teamUser.name} ({teamUser.role})
              </option>
            ))}
          </select>
        </label>
        <button disabled={loading || !projects.length || !users.length}>Add member</button>
      </form>
      <div className="chips">
        {members.length ? (
          members.map((member) => (
            <span className="chip" key={member._id}>
              {member.name} - {member.projectRole}
            </span>
          ))
        ) : (
          <span className="empty">No members loaded.</span>
        )}
      </div>
    </section>
  );
}

function CreateTaskForm({ projects, members, selectedProjectId, loading, onProjectChange, onSubmit }) {
  const currentProjectId = selectedProjectId || projects[0]?._id || "";

  return (
    <section className="panel">
      <div className="panelHead">
        <h2>Create task</h2>
        <Plus size={18} />
      </div>
      <form
        className="formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          const form = Object.fromEntries(new FormData(event.currentTarget));
          onSubmit({
            ...form,
            assigneeId: form.assigneeId || null,
            projectId: form.projectId || selectedProjectId
          });
          event.currentTarget.reset();
        }}
      >
        <label>
          Project
          <select
            name="projectId"
            value={currentProjectId}
            onChange={(event) => onProjectChange(event.target.value)}
            required
          >
            {!projects.length && <option value="">Create a project first</option>}
            {projects.map((project) => (
              <option value={project._id} key={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input name="title" required minLength="2" />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <div className="two">
          <label>
            Assignee
            <select name="assigneeId">
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option value={member._id} key={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            Status
            <select name="status" defaultValue="todo">
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input name="dueDate" type="date" />
          </label>
        </div>
        <button disabled={loading || !projects.length}>Create task</button>
      </form>
    </section>
  );
}

function TaskList({ tasks, user, members, loading, onStatusChange, onTaskEdit, onTaskDelete }) {
  const [editingTaskId, setEditingTaskId] = useState("");

  if (!tasks.length) return <div className="empty">No tasks match this view.</div>;

  return (
    <div className="taskList">
      {tasks.map((task) => {
        const canManageTask = user.role === "admin" || task.project?.owner?._id === user._id || task.project?.owner === user._id;
        const canUpdate = canManageTask || task.assignee?._id === user._id;
        const isEditing = editingTaskId === task._id;

        return (
          <article className="taskCard" key={task._id}>
            <div className="taskTop">
              <div>
                <h3>{task.title}</h3>
                <p>{task.description || "No description"}</p>
              </div>
              <div className="chips">
                <span className={`chip ${task.status}`}>{statusLabels[task.status]}</span>
                <span className={`chip ${task.priority}`}>{priorityLabels[task.priority]}</span>
              </div>
            </div>
            <div className="chips">
              <span className="chip">{task.project?.name}</span>
              <span className="chip">{task.assignee?.name || "Unassigned"}</span>
              {task.dueDate && <span className="chip">Due {formatDate(task.dueDate)}</span>}
            </div>
            {canManageTask && (
              <div className="adminActions">
                <button className="secondary" type="button" onClick={() => setEditingTaskId(isEditing ? "" : task._id)}>
                  <Pencil size={16} />
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                <button
                  className="danger"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (window.confirm(`Delete task "${task.title}"?`)) {
                      onTaskDelete(task._id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
            {isEditing && (
              <form
                className="editTaskForm"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = Object.fromEntries(new FormData(event.currentTarget));
                  onTaskEdit(task._id, {
                    ...form,
                    assigneeId: form.assigneeId || null,
                    dueDate: form.dueDate || ""
                  });
                  setEditingTaskId("");
                }}
              >
                <label>
                  Title
                  <input name="title" defaultValue={task.title} required minLength="2" />
                </label>
                <label>
                  Description
                  <textarea name="description" defaultValue={task.description || ""} />
                </label>
                <div className="two">
                  <label>
                    Assignee
                    <select name="assigneeId" defaultValue={task.assignee?._id || ""}>
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option value={member._id} key={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select name="priority" defaultValue={task.priority}>
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="two">
                  <label>
                    Status
                    <select name="status" defaultValue={task.status}>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Due date
                    <input name="dueDate" type="date" defaultValue={toInputDate(task.dueDate)} />
                  </label>
                </div>
                <button disabled={loading}>
                  <Save size={16} />
                  Save changes
                </button>
              </form>
            )}
            {canUpdate && (
              <form
                className="statusForm"
                onSubmit={(event) => {
                  event.preventDefault();
                  onStatusChange(task._id, new FormData(event.currentTarget).get("status"));
                }}
              >
                <label>
                  Status
                  <select name="status" defaultValue={task.status}>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary" disabled={loading}>
                  Update
                </button>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}

function MiniTaskList({ tasks, empty }) {
  if (!tasks.length) return <div className="empty">{empty}</div>;
  return (
    <div className="chips">
      {tasks.map((task) => (
        <span className="chip high" key={task._id}>
          {task.title} - {formatDate(task.dueDate)}
        </span>
      ))}
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

createRoot(document.getElementById("root")).render(<App />);
