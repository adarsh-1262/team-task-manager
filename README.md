# Team Task Manager

A comprehensive team collaboration and task management platform with integrated billing and subscription system using Razorpay.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Subscription System](#subscription-system)
- [Database Models](#database-models)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

Team Task Manager is a full-stack application that enables organizations to:
- Create and manage projects and tasks
- Collaborate with team members
- Track task progress and status
- Manage team subscriptions with tiered pricing
- Generate invoices and payment records
- Scale teams based on subscription tier

The application uses a modern tech stack with Node.js/Express backend, React frontend, and MongoDB database, integrated with Razorpay for payment processing.

---

## ✨ Features

### Project & Task Management
- ✅ Create, read, update, and delete projects
- ✅ Organize tasks by status (To Do, In Progress, Review, Done)
- ✅ Set task priorities (Low, Medium, High)
- ✅ Assign tasks to team members
- ✅ Set due dates and track overdue tasks
- ✅ Task filtering and sorting
- ✅ Dashboard with task statistics

### Team Management
- ✅ Create organization and invite team members
- ✅ Role-based access control (Admin, Member)
- ✅ Admin dashboard with team overview
- ✅ Invite management with email notifications
- ✅ Member status tracking

### Subscription & Billing
- ✅ Tiered pricing model (Free, Tier 2, 3, 4, 5)
- ✅ Monthly and annual billing cycles
- ✅ Razorpay payment integration
- ✅ Automated subscription management
- ✅ Payment history and invoices
- ✅ Member limit enforcement based on tier
- ✅ GST calculation (18%)

### Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Organization isolation
- ✅ Role-based authorization
- ✅ CORS protection
- ✅ Helmet.js security headers

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Razorpay** - Payment gateway
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Razorpay SDK** - Payment processing
- **Express Validator** - Input validation

### DevTools
- **Morgan** - HTTP logging
- **Helmet** - Security headers
- **CORS** - Cross-origin handling
- **Nodemon** - Development auto-reload

---

## 📁 Project Structure

```
Team Task Manager/
├── client/                          # Frontend (React)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── src/
│       ├── main.jsx                 # Main React component
│       ├── BillingDashboard.jsx     # Subscription/billing UI
│       └── styles.css               # Global styles
│
├── server/                          # Backend (Node.js/Express)
│   ├── package.json
│   ├── src/
│   │   ├── server.js                # Express app setup
│   │   ├── config/
│   │   │   └── db.js                # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   ├── subscription.js      # Subscription checks
│   │   │   └── validate.js          # Input validation
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── Organization.js      # Organization schema
│   │   │   ├── Project.js           # Project schema
│   │   │   ├── Task.js              # Task schema
│   │   │   ├── Subscription.js      # Subscription schema
│   │   │   ├── Payment.js           # Payment schema
│   │   │   ├── Invoice.js           # Invoice schema
│   │   │   ├── Invite.js            # Invite schema
│   │   │   ├── Plan.js              # Plan schema
│   │   │   └── Organization.js      # Organization schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Auth endpoints
│   │   │   ├── userRoutes.js        # User endpoints
│   │   │   ├── projectRoutes.js     # Project endpoints
│   │   │   ├── taskRoutes.js        # Task endpoints
│   │   │   ├── subscriptionRoutes.js # Subscription endpoints
│   │   │   ├── dashboardRoutes.js   # Dashboard endpoints
│   │   │   └── inviteRoutes.js      # Invite endpoints
│   │   └── utils/
│   │       ├── token.js             # JWT signing
│   │       ├── pricing.js           # Tier pricing logic
│   │       ├── razorpay.js          # Razorpay integration
│   │       ├── email.js             # Email notifications
│   │       └── access.js            # Access control
│
└── README.md                        # This file
```

---

## 🚀 Installation

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- MongoDB 4.x or higher
- Razorpay account (for payment testing)

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_jwt_secret_key_here_change_in_production
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
NODE_ENV=development
EOF

# Start the server
npm start
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/team-task-manager

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Optional
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys
3. Copy Test Key ID and Secret
4. Add to your .env file
5. For production, use Live Key ID and Secret

### MongoDB Setup

**Local MongoDB:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

### Production Mode

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register-organization` | Register new organization |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/accept-invite` | Accept team invite |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all org members |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member to project |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription/current` | Get current subscription |
| POST | `/api/subscription/create-order` | Create payment order |
| POST | `/api/subscription/verify-payment` | Verify payment |
| GET | `/api/subscription/history` | Get billing history |
| POST | `/api/subscription/cancel` | Cancel subscription |
| GET | `/api/subscription/pricing/plans` | Get pricing plans |

### Invites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invites` | Get org invites |
| POST | `/api/invites` | Create new invite |
| POST | `/api/invites/:id/resend` | Resend invite |
| PUT | `/api/invites/:id/revoke` | Revoke invite |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard summary |

---

## 💳 Subscription System

### Tiers and Pricing

| Tier | Type | Members | Monthly | Annual | GST (18%) |
|------|------|---------|---------|--------|-----------|
| 1 | Free | 1-3 | ₹0 | ₹0 | ₹0 |
| 2 | Pro | 4-10 | ₹1,000 | ₹10,200 | ₹1,180/1,836 |
| 3 | Pro | 11-20 | ₹2,000 | ₹20,400 | ₹2,360/3,672 |
| 4 | Pro | 21-30 | ₹3,000 | ₹30,600 | ₹3,540/5,508 |
| 5 | Pro | 31-40 | ₹4,000 | ₹40,800 | ₹4,720/7,344 |

*Annual plans include 15% discount*

### Subscription Flow

1. **User initiates upgrade** → Clicks "Upgrade Now" or "Manage Subscription"
2. **Select tier and billing cycle** → Choose Tier 3, Monthly/Annual
3. **Create order** → Backend calculates price and creates Razorpay order
4. **Payment** → User completes payment with Razorpay
5. **Verify payment** → Backend verifies signature and captures payment
6. **Update subscription** → Saves tier, member limit, renewal date to database
7. **Create records** → Payment and Invoice records created
8. **Refresh UI** → Frontend fetches updated subscription and displays new tier

### Subscription Data Structure

```javascript
{
  organization: ObjectId,
  currentTier: 3,
  memberLimit: 20,
  currentPrice: 2360,
  status: "active",
  billingCycle: "monthly",
  memberCount: 15,
  startDate: Date,
  renewalDate: Date,
  razorpayPaymentId: String,
  razorpayOrderId: String
}
```

### Payment Verification

The system uses HMAC-SHA256 signature verification:

```javascript
const signature = crypto
  .createHmac('sha256', razorpaySecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (signature !== receivedSignature) {
  return error("Payment verification failed");
}
```

### Important: Tier Capture in Frontend

The frontend must capture the selected tier **at the moment of payment initiation** due to React closure limitations with async operations:

```javascript
// ✅ CORRECT - Capture tier now
const selectedTierForPayment = plan.tier;
const handler = (tier) => async (response) => {
  handlePaymentSuccess(response, tier);
};

// ❌ WRONG - Tier will be undefined later
handler: handlePaymentSuccess  // selectedPlan is stale
```

---

## 📊 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  organization: ObjectId (ref: Organization),
  role: "admin" | "member",
  createdAt: Date,
  updatedAt: Date
}
```

### Organization
```javascript
{
  name: String,
  admin: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription
```javascript
{
  organization: ObjectId (ref: Organization, unique),
  plan: ObjectId (ref: Plan),
  status: "active" | "cancelled" | "expired" | "past_due",
  billingCycle: "monthly" | "annual",
  currentPrice: Number,
  memberCount: Number,
  memberLimit: Number,
  currentTier: Number,
  startDate: Date,
  renewalDate: Date,
  cancellationDate: Date,
  razorpaySubscriptionId: String,
  razorpayCustomerId: String,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment
```javascript
{
  organization: ObjectId (ref: Organization),
  subscription: ObjectId (ref: Subscription),
  amount: Number,
  currency: String,
  status: "pending" | "successful" | "failed" | "refunded",
  razorpayPaymentId: String,
  razorpayOrderId: String,
  paymentMethod: String,
  billingCycle: "monthly" | "annual",
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Invoice
```javascript
{
  organization: ObjectId (ref: Organization),
  subscription: ObjectId (ref: Subscription),
  payment: ObjectId (ref: Payment),
  invoiceNumber: String (unique),
  amount: Number,
  gst: Number,
  totalAmount: Number,
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  dueDate: Date,
  status: "draft" | "issued" | "paid" | "overdue",
  pdfUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```javascript
{
  name: String,
  description: String,
  organization: ObjectId (ref: Organization),
  owner: ObjectId (ref: User),
  members: [{ user: ObjectId, role: String }],
  createdAt: Date,
  updatedAt: Date
}
```

### Task
```javascript
{
  title: String,
  description: String,
  project: ObjectId (ref: Project),
  organization: ObjectId (ref: Organization),
  status: "todo" | "in_progress" | "review" | "done",
  priority: "low" | "medium" | "high",
  assignee: ObjectId (ref: User),
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Invite
```javascript
{
  organization: ObjectId (ref: Organization),
  email: String,
  token: String,
  status: "pending" | "accepted" | "rejected" | "revoked",
  expiresAt: Date,
  acceptedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: ObjectId,
  organizationId: ObjectId,
  email: String,
  role: "admin" | "member",
  iat: Number,
  exp: Number
}
```

### Access Control

**Public Endpoints:**
- POST /api/auth/register-organization
- POST /api/auth/login
- POST /api/auth/accept-invite
- GET /api/subscription/pricing/plans

**Protected Endpoints (requires JWT):**
- All other endpoints

**Admin-Only Endpoints:**
- POST /api/projects
- POST /api/tasks
- POST /api/subscription/*
- GET /api/subscription/history
- POST /api/invites

---

## 📝 Common Tasks

### Add a Team Member

1. Admin → Create tab
2. Enter member email
3. Click "Send Invite"
4. Member receives email with invite link
5. Member clicks link and accepts invite
6. Member can now access projects and tasks

### Upgrade Subscription

1. Admin → Billing tab
2. Current subscription shown with member count
3. Click "Upgrade Now" or "Manage Subscription"
4. Select desired tier and billing cycle
5. Click "Choose Plan"
6. Complete payment with Razorpay
7. Dashboard updates to show new tier

### Create a Project

1. Admin → Create tab
2. Enter project name and description
3. Click "Create Project"
4. Add members to project
5. Members can now create tasks in the project

### Assign a Task

1. Select project from sidebar
2. Click "+ Task" button
3. Fill task details (title, description, assignee, due date)
4. Click "Create Task"
5. Task appears in task view
6. Assignee gets notified (in production)

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Problem:** `MongooseError: connect ECONNREFUSED`

**Solutions:**
1. Check MongoDB is running: `mongosh`
2. Verify MONGODB_URI is correct
3. If using MongoDB Atlas, ensure IP is whitelisted
4. Check username/password in connection string

### Payment Gateway Error

**Problem:** `Razorpay order creation failed`

**Solutions:**
1. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
2. Ensure you're using test keys for development
3. Check Razorpay account has API access enabled
4. Verify amount is in valid range (₹1 to ₹15,00,000)

### CORS Error

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
1. Ensure frontend URL is in allowedOrigins in server.js
2. Check CORS middleware is configured
3. Verify CLIENT_URL in .env matches frontend URL

### Subscription Tier Not Updating

**Problem:** Frontend still shows old tier after payment

**Solutions:**
1. Check browser console for errors
2. Verify selectedTier is sent in /verify-payment request
3. Check server logs - should show `"selectedTier": 3` (not undefined)
4. Verify subscription was saved to database
5. Try clicking "Refresh Data" button in Billing Dashboard

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port
PORT=3000 npm start
```

### JWT Token Expired

**Problem:** `JsonWebTokenError: jwt expired`

**Solutions:**
1. Log out and log back in
2. Clear localStorage
3. Token expires after 7 days (configurable in token.js)
4. Refresh token endpoint can be added if needed

---

## 📈 Performance Tips

1. **Database Indexing**: Indexes are created on commonly queried fields
2. **Pagination**: Implement for large datasets
3. **Caching**: Add Redis for subscription data
4. **CDN**: Serve static assets from CDN in production
5. **Compression**: Enable gzip compression in production
6. **Rate Limiting**: Add rate limiter for API endpoints

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Add rate limiting to auth endpoints
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] Enable MongoDB authentication
- [ ] Use Razorpay live keys only in production
- [ ] Implement request logging and monitoring
- [ ] Regular security audits

---

## 📚 API Examples

### Register Organization
```bash
curl -X POST http://localhost:5000/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Tech Startup",
    "name": "John Doe",
    "email": "john@startup.com",
    "password": "SecurePassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@startup.com",
    "password": "SecurePassword123"
  }'
```

### Get Current Subscription
```bash
curl -X GET http://localhost:5000/api/subscription/current \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Payment Order
```bash
curl -X POST http://localhost:5000/api/subscription/create-order \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "memberCount": 15,
    "billingCycle": "monthly",
    "selectedTier": 3
  }'
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m "Add amazing feature"`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Code Style
- Use 2-space indentation
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Add comments for complex logic
- Keep functions small and focused

---

## 📄 License

This project is proprietary and confidential.

---

## 📞 Support

For issues and questions:
1. Check this README and troubleshooting section
2. Check server logs: `console.log()` statements are throughout the code
3. Check browser console: DevTools → Console
4. Check database: `mongosh` → query collections
5. Check Razorpay dashboard: Verify payments and orders

---

## 🎉 Acknowledgments

- Built with React, Node.js, Express, and MongoDB
- Payment processing by Razorpay
- Icons by Lucide React
- Security by Helmet.js and bcryptjs

---

## 📝 Changelog

### v1.0.0 (Current)
- Initial release
- User authentication and authorization
- Project and task management
- Team member invitations
- Subscription system with tiered pricing
- Razorpay payment integration
- Payment history and invoicing
- Dashboard with statistics
- Fixed React closure issue in payment flow
- Added tier validation and debugging

---

## 🚀 Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Email notifications for task assignments
- [ ] File attachments for tasks and projects
- [ ] Advanced analytics and reporting
- [ ] Custom roles and permissions
- [ ] Automated subscription renewal
- [ ] Payment retry mechanism
- [ ] Refund handling
- [ ] Mobile app (React Native)
- [ ] Dark mode UI
- [ ] Integration with Slack, GitHub, etc.
- [ ] Automated backups
- [ ] Multi-language support

---

**Last Updated:** May 25, 2026
**Maintained by:** Team Task Manager Development Team
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
