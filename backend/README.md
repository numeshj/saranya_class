# Tuition Center Backend

Initial scaffold with JWT auth, role-based access, security middleware.

## Env Vars

```
MONGO_URI=mongodb://127.0.0.1:27017/tuition_center
PORT=4000
CORS_ORIGINS=http://localhost:5173
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
# Optional MySQL (Prisma) dual persistence
MYSQL_URL="mysql://root:228646@localhost:3306/tuition_center"
```

## Tech Stack / Languages

- Runtime Language: JavaScript (Node.js, modern ECMAScript modules)
- Backend Framework: Express.js
- Databases: MongoDB (Mongoose ODM) primary, optional MySQL via Prisma ORM
- Auth & Security: JWT (access + refresh), Argon2 password hashing, optional TOTP 2FA (speakeasy), rate limiting, helmet, xss-clean
- Validation: Zod & express-validator (transitioning to Zod-first)
- Realtime: Server-Sent Events (SSE) for notifications
- Metrics: prom-client (optional)
- Containerization: Docker, docker-compose
- Package Manager: npm

## Architecture Overview

Layered concerns:
1. API Layer (Express routes) - input validation & HTTP mapping
2. Middleware - auth, rate limits, error handling
3. Services / Repositories - persistence abstraction (Mongo or Prisma)
4. Data Models - Mongoose schemas & Prisma schema (code-first migrations)
5. Security - central token issuance, rotation, refresh persistence, lockout, password reset tokens, 2FA secrets
6. Observability - health endpoint, metrics endpoint, structured event emission for SSE

Dual Persistence Strategy:
- Mongo remains authoritative for current domain entities.
- Prisma (MySQL) provides relational schema (roles, users, sessions) enabling potential full migration or hybrid use.
- Repository layer (`src/services/userRepo.js`) chooses Prisma when `MYSQL_URL` is configured, else Mongo fallback.

## Database Initialization (MySQL)
1. Ensure MySQL running and create database:
	```sql
	CREATE DATABASE tuition_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
	```
2. Set `MYSQL_URL` in `.env`.
3. Generate client & apply migrations:
	```bash
	npm run prisma:generate
	npm run prisma:migrate
	npm run prisma:seed
	```

## Mongo Seed
```
npm run seed
```

## Auth Flow Summary
- Register/Login -> issue short-lived access (15m) & refresh (7d)
- Refresh endpoint rotates refresh token (revokes previous)
- Logout revokes provided refresh token
- Lockout after 5 failed attempts (15 min)
- 2FA setup (admin/management) creates TOTP secret; verify endpoint checks token
- Password reset token (one-time, 30 min) invalidates sessions by bumping refresh version

## Tables (Prisma)
- roles(id, name)
- users(id, firstName, lastName, email, passwordHash, ...)
- user_roles(userId, roleId, assignedAt)
- user_sessions(id, userId, tokenHash, expiresAt, revokedAt)
- password_reset_token(id, userId, tokenHash, expiresAt, usedAt)

## Collections (Mongo)
- users, subjects, grades, classes, sessions, exams, marks, homework, submissions, refresh tokens, password reset tokens.

## Security Highlights
- Argon2id hashing, JWT secrets rotated via env, token version invalidation
- Rate limiting global (200 / 15m) plus account lockout
- XSS mitigation, HTTP headers via helmet, input validation via Zod
- Sensitive tokens stored hashed (refresh, reset)

## Next Steps (Planned)
- Expand repository layer for all entities to enable full MySQL switch
- Add automated test suite (mongodb-memory-server + Prisma test schema)
- Add GraphQL or gRPC facade (optional)
- Implement WebSocket gateway (optional) in addition to SSE


## Run

Install deps and start dev server.
