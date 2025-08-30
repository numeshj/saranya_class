# Tuition Center Full Stack

Monorepo containing backend (Express/Mongo) and frontend (React/Vite) for tuition center management.

## High-Level Planned Modules

- User & Role Management (guest/student/parent/teacher/management/admin)
- Subjects & Grades
- Classes & Scheduling (sessions)
- Enrollment & Attendance
- Exams, Marks/Grades, Reports
- Homework & Submissions
- Notifications & Alerts (Lottie-enhanced UI feedback)
- JWT Auth with Refresh, Role-Based Access, Security Hardening
- Password Reset, Account Lockout, 2FA (TOTP)
- Real-time Notifications (SSE)
- Metrics endpoint (Prometheus)
- Reporting (attendance %, exam performance)

This commit provides initial auth scaffolding; further domain models and UI modules to be implemented next.

## Docker Quick Start

```
docker compose up --build
```

Frontend: http://localhost:5173  Backend API: http://localhost:4000

## Languages & Frameworks
- Frontend Language: TypeScript (React + Vite)
- Backend Language: JavaScript (Node.js / Express)
- Database Layers: MongoDB (NoSQL) with Mongoose, MySQL (SQL) with Prisma ORM (code-first)

## Key Backend Modules
Auth, Users, Roles, Academic (Subjects, Grades, Classes, Sessions, Exams, Marks, Homework, Submissions), Reports, Metrics, Notifications.

## Security Features
- JWT access & refresh (rotation)
- Argon2 password hashing
- Account lockout
- Password reset tokens (hashed)
- Optional TOTP 2FA
- Rate limiting, Helmet, XSS clean, CSP placeholder

## Realtime & Observability
- SSE event stream for notifications
- Prometheus metrics endpoint (/api/metrics)
- Health endpoint (/health)

## Development Scripts
```
cd backend
npm install
npm run dev
# Prisma (MySQL) optional
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Frontend Dev
```
cd frontend
npm install
npm run dev
```

## Planned Enhancements
- Complete UI for remaining modules (classes, exams, attendance, homework submissions)
- Test coverage (unit + integration)
- Role-based navigation refinement
- Performance & index tuning
- Full MySQL migration path

