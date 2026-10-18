# Secure Auth

A full-stack authentication demo with an Angular 19 single-page app and a NestJS 10 API. The backend uses MongoDB for users and sessions, Redis for request counters, and JWT access tokens paired with rotating opaque refresh tokens.

This repository is a development project, not a production-ready security package. See [Security status](#security-status) before deploying it.

## Features

- Account registration and password verification with bcrypt (cost 12).
- Short-lived JWT access tokens held in frontend memory.
- Opaque refresh tokens in HttpOnly cookies; token hashes are stored in MongoDB and rotated on refresh.
- Session records, current-session logout, logout-all, and refresh-token reuse detection.
- Role-based authorization for the admin users endpoint.
- Redis-backed counters for registration, login, and refresh requests.
- Request DTO validation with whitelisting and rejection of unknown fields.
- Angular login, registration, dashboard, and admin routes.

## Project Layout

```text
secure-auth/
├── backend/                 # NestJS API
│   └── src/
│       ├── auth/            # Authentication, JWT, guards, and DTOs
│       ├── users/           # User model and service
│       ├── sessions/        # Session and refresh-token persistence
│       └── redis/           # Redis client and request counters
├── frontend/                # Angular SPA
│   └── src/app/
│       ├── core/auth/       # Auth service, guards, and HTTP interceptors
│       └── pages/           # Login, register, dashboard, and admin views
└── docker-compose.yml       # Local MongoDB and Redis services
```

## Requirements

- Node.js and npm
- Docker with the Docker Compose plugin, or local MongoDB and Redis instances

## Run Locally

Run commands from the repository root (the directory containing `docker-compose.yml`).

1. Start MongoDB and Redis:

   ```bash
   docker compose up -d
   ```

2. Configure and start the backend:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run start:dev
   ```

   On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed. The API listens at `http://localhost:3000` by default. Replace `JWT_ACCESS_SECRET` in `.env` with a strong random secret.

3. Configure and start the frontend in a second terminal:

   The frontend imports `src/environments/environment.ts`, but that file is not currently included in this repository. Create it with the local API URL before building or serving:

   ```ts
   export const environment = {
     apiUrl: 'http://localhost:3000',
   };
   ```

   Then run:

   ```bash
   cd frontend
   npm install
   npm start
   ```

   The Angular app is served at `http://localhost:4200` by default.

To stop the local database services, run `docker compose down` from the repository root. The MongoDB data volume is retained; add `-v` only when you intend to delete that data.

## Available Scripts

| Directory | Command | Purpose |
| --------- | ------- | ------- |
| `backend` | `npm run start:dev` | Start NestJS with watch mode |
| `backend` | `npm run build` | Compile the backend |
| `backend` | `npm run start:prod` | Run the compiled backend |
| `frontend` | `npm start` | Start Angular development server |
| `frontend` | `npm run build` | Build the Angular app |

## API

All endpoints use the `/auth` prefix. Routes marked JWT require a bearer access token in the `Authorization` header; registration, login, and refresh are public at the JWT-guard level.

| Method | Endpoint | Access | Purpose |
| ------ | -------- | ------ | ------- |
| `POST` | `/auth/register` | Public | Create a user account |
| `POST` | `/auth/login` | Public | Verify credentials and create a session |
| `POST` | `/auth/refresh` | Refresh cookie | Rotate refresh token and issue an access token |
| `POST` | `/auth/logout` | JWT | Revoke the current session |
| `POST` | `/auth/logout-all` | JWT | Revoke all sessions for the current user |
| `GET` | `/auth/me` | JWT | Return the authenticated user claims |
| `GET` | `/auth/sessions` | JWT | List active sessions for the current user |
| `GET` | `/auth/users` | JWT, admin role | List users |

Login returns an access token and user data in its JSON response and sets `refresh_token` and `csrf_token` cookies. Refresh uses the refresh cookie and returns a new access token. The Angular auth interceptor attaches access tokens to API requests and attempts refresh after an unauthorized response.

## Configuration

Backend settings are loaded from `backend/.env`:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `3000` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/secure_auth` | MongoDB connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_ACCESS_SECRET` | None | Secret used to sign access tokens; set a strong value |
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | Access token lifetime |
| `NODE_ENV` | `development` | In production, refresh cookies are marked `Secure` |
| `FRONTEND_ORIGIN` | `http://localhost:4200` | Allowed browser origin for credentialed CORS |

Set the frontend `environment.apiUrl` to the base API URL (without the `/auth` suffix).

## Roles

New accounts receive the `user` role. The `/auth/users` endpoint requires `admin`. For local development, an administrator can be assigned directly in MongoDB:

```javascript
db.users.updateOne(
  { email: 'admin@example.com' },
  { $set: { role: 'admin' } }
)
```

## Security Status

- Angular route guards are for navigation and user experience; backend authorization is the security boundary.
- Access tokens are kept in memory rather than local storage. A page reload clears the token and requires the refresh flow to restore access.
- Refresh tokens are opaque random values, stored as hashes in MongoDB, and sent in HttpOnly cookies.
- The backend defines a double-submit `CsrfGuard`, and the frontend has a CSRF interceptor. **The guard is not currently registered in the NestJS application**, so unsafe API requests are not presently protected by that backend check. Wire and test the guard before relying on CSRF protection.
- Cookies use `SameSite=Strict`; `Secure` is enabled when `NODE_ENV=production`. Cross-site deployments need a deliberate cookie and CSRF configuration.
- The admin role example updates the database directly; do not expose database access or use manual role changes as a production provisioning process.
- Use HTTPS, production-grade secrets, monitored database/cache services, and deployment-specific CORS/cookie settings before exposing the app publicly.

## License

No license is currently specified in this repository.
