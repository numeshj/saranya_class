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
