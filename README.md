# Team Task Manager - MERN Stack

A MERN stack multi-tenant web app where organizations manage projects, team members, tasks, and progress with organization-scoped Admin/Member access control.

## Tech Stack

- MongoDB + Mongoose
- Express.js + Node.js
- React + Vite
- JWT authentication
- bcrypt password hashing
- REST APIs

## Features

- Register Organization flow creates a new organization and its single Admin
- Members join only through an invite created by their organization Admin
- Admins can create projects, invite users, add project members, and create/assign/edit/delete tasks
- Members belong to one organization and can only access that organization's data
- Member project/task visibility is based on project membership
- Members can update status only for tasks assigned to them
- Dashboard tabs for creation workflow and task tracking
- Dashboard for project count, task count, assigned tasks, completed tasks, and overdue tasks
- Server-side validations and MongoDB relationships

## Project Structure

```text
.
|-- client/              # React + Vite frontend
|   `-- src/
|       |-- main.jsx
|       `-- styles.css
|-- server/              # Express + MongoDB backend
|   `-- src/
|       |-- config/
|       |-- middleware/
|       |-- models/
|       |-- routes/
|       |-- utils/
|       `-- server.js
|-- package.json
`-- README.md
```

## Setup

Create the backend environment file:

```powershell
copy server\.env.example server\.env
```

Update `server/.env` if needed:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/team_task_manager
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Install dependencies:

```powershell
npm install
npm run install:all
```

Run MongoDB locally, then start both apps:

```powershell
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

## API Routes

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register-organization` | Public | Create organization and Admin |
| POST | `/api/auth/accept-invite` | Public with invite token | Join organization as Member |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Authenticated | Current user |
| GET | `/api/users` | Authenticated | List users for team assignment |
| GET | `/api/invites` | Admin | List organization invites |
| POST | `/api/invites` | Admin | Create member invite |
| GET | `/api/projects` | Authenticated | List visible projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:projectId/members` | Project member/Admin | List project members |
| POST | `/api/projects/:projectId/members` | Admin | Add project member |
| GET | `/api/tasks` | Authenticated | List visible tasks |
| POST | `/api/tasks` | Admin | Create task |
| PUT | `/api/tasks/:taskId` | Admin or assigned member | Update task |
| DELETE | `/api/tasks/:taskId` | Admin | Delete task |
| GET | `/api/dashboard` | Authenticated | Dashboard metrics |

## MongoDB Relationships

- `Organization`: tenant boundary and single Admin reference
- `Invite`: email invite token for member onboarding
- `User`: account profile, organization reference, organization role, hashed password
- `Project`: organization, owner, and embedded project members
- `Task`: organization, project, creator, and assignee references

## Validation And RBAC

- `express-validator` validates request bodies and route params.
- `protect` middleware verifies JWT tokens.
- Organization checks isolate all projects, users, tasks, and invites by tenant.
- Admin checks protect invite, project, team, and task management.
- Project access is checked before reading project-specific members or tasks.
- Task assignees must belong to the selected project.
# team-task-manager
