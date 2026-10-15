# Anjuman Bashindgan-E-Bihar

A full-stack community assistance platform for **Anjuman Bashindgan-E-Bihar**, designed to help individuals and families apply for support, track their requests, donate securely, and communicate with the organisation online.

The platform supports community assistance across **medical care, education/scholarships, livelihood support, and essential travel assistance**, with separate experiences for applicants and administrators.

> **Project status:** Active development

---

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [How the Platform Works](#how-the-platform-works)
- [Project Structure](#project-structure)
- [Database Overview](#database-overview)
- [Application Status Flow](#application-status-flow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Security](#security)
- [Donation System](#donation-system)
- [Admin Portal](#admin-portal)
- [Development Notes](#development-notes)
- [Repository](#repository)

---

## About the Project

**Anjuman Bashindgan-E-Bihar** is a community-support organisation serving people through humanitarian, healthcare, education, livelihood, travel, and welfare initiatives.

This project provides a digital system through which users can:

- Learn about the organisation and its work.
- Register and sign in securely.
- Apply for different types of assistance.
- Upload supporting documents.
- Track application status.
- View application history.
- Donate through UPI or Razorpay.
- Submit enquiries through the contact system.

Administrators can manage applications, users, donations, and enquiries from a protected admin portal.

---

## Key Features

### Public Website

- Responsive organisation website.
- About and organisation information.
- Service information.
- Community impact and activity sections.
- Gallery.
- FAQ.
- Contact/enquiry form.
- Donation page.
- Assistance application entry points.

### Authentication

- User registration.
- User login.
- User logout.
- Authenticated session lookup.
- JWT-based authentication.
- Role-based access for users and administrators.
- Authentication rate limiting.

### Assistance Applications

The system currently supports these application categories:

- **Medical Assistance**
- **Scholarship / Education Assistance**
- **Livelihood Assistance**
- **Travel Assistance**

Applicants can:

1. Sign in.
2. Submit an assistance request.
3. Upload supporting documents.
4. Receive a unique application/reference record.
5. View their submitted applications.
6. Open application details.
7. Track the current status and status history.
8. Securely download their submitted documents.

### Application Status Tracking

Applications support the following lifecycle:

```text
PENDING
   │
   ▼
UNDER_REVIEW
   │
   ├──────────────► REJECTED
   │
   ▼
APPROVED
   │
   ▼
COMPLETED
```

Every administrative status change can be recorded in application status history.

### Donations

The platform supports:

- Razorpay orders.
- Razorpay payment verification.
- Razorpay webhooks.
- Direct UPI donation references.
- Donation status tracking.
- Admin-side donation management.

Donation states include:

```text
PENDING
VERIFIED
FAILED
REFUNDED
```

### Contact & Enquiries

Visitors can submit enquiries through the website.

Enquiries can be managed by administrators using:

```text
NEW
READ
RESOLVED
```

### Admin Portal

Protected administrator functionality includes:

- Admin identity/session verification.
- Dashboard overview.
- Application listing.
- Application detail view.
- Application status changes.
- Secure application document downloads.
- User listing.
- User activation/deactivation.
- Donation listing.
- UPI donation verification/status management.
- Enquiry listing.
- Enquiry detail view.
- Enquiry status management.

---

## Technology Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| HTML5 | Page structure |
| CSS3 | Styling and responsive layout |
| Vanilla JavaScript | Client-side interactions and API integration |

The frontend is served as static files by the Express application.

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | Server runtime |
| Express 5 | HTTP server and API |
| Prisma 7 | ORM and database access |
| PostgreSQL | Primary relational database |
| Zod | Request/data validation |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| Multer | Document uploads |
| Razorpay | Online payments |
| Helmet | HTTP security headers |
| CORS | Origin control |
| express-rate-limit | Abuse/rate limiting |
| Morgan | Request logging |
| cookie-parser | Cookie handling |

---

## How the Platform Works

### Applicant Flow

```text
Visitor
  │
  ├── Browse Website
  │
  ├── Learn About Services
  │
  ├── Donate
  │
  └── Apply for Assistance
          │
          ▼
      Register / Login
          │
          ▼
      Choose Assistance Type
          │
          ├── Medical
          ├── Scholarship
          ├── Livelihood
          └── Travel
          │
          ▼
      Fill Application
          │
          ▼
      Upload Documents
          │
          ▼
      Submit Application
          │
          ▼
      Application Created
          │
          ▼
      Track Status
          │
          ▼
      Admin Review
          │
          ▼
      Final Decision
```

### Admin Flow

```text
Admin Login
    │
    ▼
Admin Dashboard
    │
    ├── Applications
    │     ├── Review details
    │     ├── Download documents
    │     ├── Add notes
    │     └── Update status
    │
    ├── Users
    │     └── Activate / deactivate users
    │
    ├── Donations
    │     └── Review payment status
    │
    └── Enquiries
          └── Review and resolve messages
```

---

## Project Structure

```text
ngoWebsite/
│
└── anjuman-ngo/
    │
    ├── client/
    │   ├── assets/
    │   │   └── images/
    │   ├── css/
    │   ├── js/
    │   ├── admin/
    │   ├── index.html
    │   └── ...public and authenticated pages
    │
    ├── server/
    │   ├── prisma/
    │   │   ├── migrations/
    │   │   ├── schema.prisma
    │   │   └── seed.js
    │   ├── scripts/
    │   ├── src/
    │   │   ├── controllers/
    │   │   ├── generated/
    │   │   ├── lib/
    │   │   ├── middleware/
    │   │   ├── routes/
    │   │   └── app.js
    │   ├── .env.example
    │   ├── package.json
    │   ├── prisma.config.ts
    │   └── server.js
    │
    └── README.md
```

---

## Database Overview

The project uses PostgreSQL through Prisma.

### Core Models

```text
User
 │
 ├── Application[]
 ├── Donation[]
 └── ApplicationStatusHistory[]

Application
 │
 ├── User
 ├── ApplicationDocument[]
 └── ApplicationStatusHistory[]

Donation
 │
 └── User? (optional)

ContactMessage
```

### Roles

```text
USER
ADMIN
```

### Supported Branches

The current database schema includes:

```text
NAGPADA
DHARAVI
```

### Application Types

```text
MEDICAL
SCHOLARSHIP
LIVELIHOOD
TRAVEL
```

### Document Types

```text
IDENTITY
SUPPORTING
MEDICAL
EDUCATION
INCOME
TRAVEL
OTHER
```

---

## Application Status Flow

```text
                 ┌──────────────┐
                 │   PENDING    │
                 └──────┬───────┘
                        │
                        ▼
               ┌────────────────┐
               │ UNDER_REVIEW   │
               └───────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        ┌──────────┐      ┌──────────┐
        │ APPROVED │      │ REJECTED │
        └────┬─────┘      └──────────┘
             │
             ▼
        ┌───────────┐
        │ COMPLETED │
        └───────────┘
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AmanatShaikh/ngoWebsite.git
cd ngoWebsite/anjuman-ngo
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Create the Environment File

```bash
cp .env.example .env
```

Then configure the values in `.env`.

---

## Environment Variables

Example development configuration:

```env
NODE_ENV=development
PORT=5500

DATABASE_URL="postgresql://anjuman_app:password@localhost:5432/anjuman_ngo"

# prisma.config.ts reads this for migration workflows
SHADOW_DATABASE_URL="postgresql://anjuman_app:password@localhost:5432/anjuman_ngo_shadow"

CLIENT_ORIGIN="http://localhost:5500,http://127.0.0.1:5500"

JWT_SECRET="replace-with-a-long-random-secret"
JWT_COOKIE_NAME="anjuman_session"

ADMIN_NAME="Administrator"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"

UPI_ID="your-official-upi-id"
UPI_PAYEE_NAME="Anjuman Bashindgan-E-Bihar"

RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
```

> Never commit the real `.env` file, JWT secret, database password, Razorpay secret, webhook secret, or production admin password.

### Generate a JWT Secret

```bash
openssl rand -base64 48
```

---

## Database Setup

### Create PostgreSQL Databases

```sql
CREATE DATABASE anjuman_ngo;
CREATE DATABASE anjuman_ngo_shadow;
```

### Generate Prisma Client

```bash
npm run db:generate
```

### Run Development Migrations

```bash
npm run db:migrate
```

### Deploy Existing Migrations

```bash
npm run db:deploy
```

### Seed the Initial Admin

Configure these values first:

```env
ADMIN_NAME=
ADMIN_USERNAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

The configured admin password must contain at least 12 characters.

Then run:

```bash
npm run db:seed
```

### Open Prisma Studio

```bash
npm run db:studio
```

---

## Running the Project

The Express server serves both the backend API and static frontend.

```bash
cd server
npm run dev
```

Default local URLs:

```text
Website: http://localhost:5500
API:     http://localhost:5500/api
Health:  http://localhost:5500/api/health
```

Production-style start command:

```bash
npm start
```

---

## Available Scripts

Run these commands from `anjuman-ngo/server`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server in watch mode |
| `npm start` | Start the application server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run Prisma development migrations |
| `npm run db:deploy` | Deploy existing migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Create/update the configured admin account |
| `npm run db:seed:applications` | Seed test applications |
| `npm run db:validate` | Validate the Prisma schema |

---

## API Overview

Base URL:

```text
/api
```

### Health

```http
GET /api/health
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Applications

All application routes require authentication.

```http
POST /api/applications
GET  /api/applications/my
GET  /api/applications/:id
GET  /api/applications/:id/documents/:documentId/download
```

### Donations

```http
GET  /api/donations/config
POST /api/donations/razorpay/order
POST /api/donations/razorpay/verify
POST /api/donations/upi/reference
POST /api/donations/webhook
```

### Contact

```http
POST /api/contact
```

### Admin

All admin routes require an authenticated administrator.

```http
GET   /api/admin/me
GET   /api/admin/overview

GET   /api/admin/applications
GET   /api/admin/applications/:id
GET   /api/admin/applications/:id/documents/:documentId/download
PATCH /api/admin/applications/:id/status

GET   /api/admin/users
PATCH /api/admin/users/:id/status

GET   /api/admin/donations
PATCH /api/admin/donations/:id/status

GET   /api/admin/enquiries
GET   /api/admin/enquiries/:id
PATCH /api/admin/enquiries/:id/status
```

---

## Security

The backend includes several security controls:

- Helmet security headers and Content Security Policy.
- Configurable CORS origins.
- Authentication rate limiting.
- Donation rate limiting.
- Contact-form rate limiting.
- bcrypt password hashing.
- JWT authentication.
- User/admin authorization middleware.
- Protected application and admin document download routes.
- Multer upload validation and file-size handling.

The server currently reports a maximum document size of:

```text
5 MB per document
```

Keep these values secret:

- `JWT_SECRET`
- Database credentials
- Admin credentials
- Razorpay key secret
- Razorpay webhook secret

---

## Donation System

### Razorpay Flow

```text
Donor
  │
  ▼
Request Razorpay Order
  │
  ▼
Backend Creates Order
  │
  ▼
Razorpay Checkout
  │
  ▼
Payment
  │
  ├── Frontend Verification
  │
  └── Razorpay Webhook
  │
  ▼
Donation Status Updated
```

### UPI Flow

```text
Donor
  │
  ▼
View UPI Details
  │
  ▼
Complete UPI Payment
  │
  ▼
Submit UPI Reference
  │
  ▼
Donation = PENDING
  │
  ▼
Admin Reviews Payment
  │
  ▼
VERIFIED / FAILED
```

---

## Admin Portal

The admin portal acts as the operational dashboard for the organisation.

### Applications

Admins can:

- View assistance applications.
- Open application details.
- Download submitted documents.
- Update application status.
- Maintain application status history.

### Users

Admins can:

- View registered users.
- Activate or deactivate accounts.

### Donations

Admins can:

- View donation records.
- Review direct UPI submissions.
- Update applicable donation statuses.

### Enquiries

Admins can:

- View contact submissions.
- Open enquiry details.
- Mark enquiries as read or resolved.

---

## Development Notes

### Frontend and Backend Are Served Together

The current project does not require a separate frontend development server.

```text
Browser
   │
   ▼
Express :5500
   │
   ├── Static Frontend
   │
   └── /api/*
          │
          ▼
       Prisma
          │
          ▼
      PostgreSQL
```

### Database Health Check

```http
GET /api/health
```

The endpoint checks database connectivity rather than only confirming that the HTTP server is running.

### Graceful Shutdown

The server handles `SIGINT` and `SIGTERM` and disconnects Prisma before exiting.

### Prisma Shadow Database

`prisma.config.ts` currently reads both:

```text
DATABASE_URL
SHADOW_DATABASE_URL
```

If development migrations fail because a shadow database is unavailable, verify that `SHADOW_DATABASE_URL` points to a valid development shadow database.

---

## Repository

GitHub repository:

```text
https://github.com/AmanatShaikh/ngoWebsite
```

Main application directory:

```text
anjuman-ngo/
```

---

## Contributing

When contributing:

1. Create a feature/fix branch.
2. Keep credentials and secrets out of Git.
3. Validate database changes before committing.
4. Test applicant and admin flows.
5. Verify authentication and authorization on protected endpoints.
6. Test Prisma migrations against a development database.
7. Keep UI changes responsive across mobile and desktop.

---

## License

No explicit software license is currently documented in this project README.

If the repository is intended for open-source reuse, add a `LICENSE` file and update this section with the selected license.

---

## Maintainer

Repository maintained under the **AmanatShaikh** GitHub account.

For organisation-related enquiries, use the contact information published through the Anjuman Bashindgan-E-Bihar website/platform.
