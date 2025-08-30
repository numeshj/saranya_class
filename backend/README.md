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

## Run

Install deps and start dev server.
