# IAMLECON 2027 — Backend API & Services

> Complete backend service for the **IAMLECON 2027 Event Registration System** — featuring multipart registration submission, receipt screenshot storage via Cloudinary, data persistence with PostgreSQL & Prisma, JWT-authenticated admin verification panel, and transactional email delivery powered by Resend.

---

## 🚀 Features

- **Delegate Registration Submission**: Handles multipart form-data including payment screenshot upload.
- **Cloudinary Storage**: Securely uploads and limits receipts (max 5MB, JPG/PNG/WEBP/PDF).
- **PostgreSQL & Prisma ORM**: Fully typed schema with relations, enums, status tracking, and audit logging.
- **Transactional Emails (Resend)**:
  - 📩 **Registration Acknowledgment**: Sent immediately with unique reference number (`IAMLE27-{category}-{random}`).
  - 🎉 **Pass Confirmation**: Sent when admin verifies the transaction, generating an official Event Pass ID (`IAMLE27-PASS-{category}-{sequence}`).
  - ⚠️ **Rejection Notice**: Sent if payment details/receipt cannot be verified with the admin's notes.
- **Admin Verification Panel API**:
  - Secure login with bcrypt (12 rounds) & JWT tokens.
  - Filterable, paginated registration lists.
  - Single registration review with receipt preview URL.
  - Approve / Reject workflows with sequential Event Pass generation.
  - Live dashboard statistics (counts by category, status, recent applicants).
- **Security & Protection**:
  - Express Rate Limiter on registration and login endpoints.
  - Helmet security headers.
  - CORS whitelisting.
  - Zod validation for all incoming delegate data.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js (ES Modules)
- **Database**: PostgreSQL (v15+)
- **ORM**: Prisma Client & Migrations
- **Image CDN**: Cloudinary + Multer Storage Cloudinary
- **Email**: Resend SDK
- **Validation**: Zod
- **Auth**: JWT & bcryptjs

---

## 📂 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema & models
│   └── seed.js                    # Database seed script
├── src/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary SDK & Multer setup
│   │   ├── database.js            # Prisma client singleton
│   │   └── resend.js              # Resend email client
│   ├── controllers/
│   │   ├── admin.controller.js    # Login, verify, reject, list, stats
│   │   └── registration.controller.js # Submit registration & check status
│   ├── middleware/
│   │   ├── auth.middleware.js     # Admin JWT verification
│   │   ├── error.middleware.js    # Centralized error handler
│   │   └── rateLimiter.js         # Endpoint rate limiting
│   ├── routes/
│   │   ├── admin.routes.js        # Admin endpoints
│   │   └── registration.routes.js # Public registration endpoints
│   ├── services/
│   │   └── email.service.js       # Resend email templates & delivery
│   ├── validators/
│   │   └── registration.validator.js # Zod validation rules
│   └── app.js                     # Express app configuration
├── scripts/
│   └── createAdmin.js             # Initial admin account generator
├── .env.example                   # Environment configuration template
├── package.json
└── server.js                      # Application entry point
```

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your PostgreSQL, Cloudinary, and Resend credentials:
```bash
cp .env.example .env
```

### 3. Initialize Database
When your PostgreSQL database is reachable:
```bash
npx prisma migrate dev --name init
```
Generate the Prisma Client:
```bash
npx prisma generate
```

### 4. Create Initial Admin Account
```bash
npm run seed
# Default Admin:
# Username: admin
# Password: ChangeThisPassword! (or set ADMIN_INITIAL_PASSWORD in .env)
```

### 5. Start Development Server
```bash
npm run dev
# Server runs at http://localhost:4000
# Health check: http://localhost:4000/api/health
```

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/registrations` | Submit delegate registration (`multipart/form-data`) |
| `GET` | `/api/registrations/:refId/status` | Check registration status by reference ID |

### Admin Endpoints (Requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Admin login with username & password |
| `GET` | `/api/admin/dashboard/stats` | Dashboard metrics & category counts |
| `GET` | `/api/admin/registrations` | Paginated delegate list (`?status=&category=&search=&page=&limit=`) |
| `GET` | `/api/admin/registrations/:id` | Full registration details with receipt URL |
| `PATCH` | `/api/admin/registrations/:id/verify` | Approve registration & issue Event Pass |
| `PATCH` | `/api/admin/registrations/:id/reject` | Reject registration with reason |

