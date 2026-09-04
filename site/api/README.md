# goroutine-api

Minimal NestJS backend for the **goroutine** Go-learning app. Scope: email+password
auth (JWT) and cross-device **progress sync**. Grading is handled by the Go grader
(`site/grader`) — this service has no code runner.

> Progress currently lives in the web app's `localStorage`. These endpoints exist so
> that once a user logs in, that local progress can be pushed up (`PUT /me/progress`)
> and pulled back on another device (`GET /me/progress`).

## Stack

NestJS 10 · Prisma ORM + SQLite (`prisma/dev.db`) · `@nestjs/jwt` + `passport-jwt` +
`bcrypt` · `class-validator` (global `ValidationPipe`, whitelist). CORS enabled for the web app.

## Setup

```bash
npm install
npm run prisma:migrate   # creates dev.db, runs the init migration, generates the client
npm run start:dev        # http://localhost:4000
```

Build & run production: `npm run build && npm start`.

### Env vars (`.env`, see `.env.example`)

| var           | default                  | purpose                          |
| ------------- | ------------------------ | -------------------------------- |
| `DATABASE_URL`| `file:./dev.db`          | Prisma datasource                |
| `JWT_SECRET`  | `change-me-dev-secret`   | JWT signing secret               |
| `PORT`        | `4000`                   | HTTP port                        |
| `CORS_ORIGIN` | `http://localhost:3000`  | allowed origins (comma-separated)|
| `WEB_ORIGIN`  | `http://localhost:3000`  | frontend origin the OAuth callback redirects back to |
| `API_URL`     | `http://localhost:4000`  | this API's public base (used to build provider callback URLs) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | _(empty)_ | GitHub OAuth app creds (optional) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | _(empty)_ | Google OAuth client creds (optional) |

OAuth is **optional**: leave a provider's creds empty and the app still boots
normally. Its start route then returns `501 { message: "... OAuth не настроен" }`.

## Endpoints

All `/me/*` routes require `Authorization: Bearer <accessToken>`.

### Auth

```bash
# Register (409 if email exists) -> { accessToken, user }
curl -s -X POST http://localhost:4000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"password123","level":"beginner"}'

# Login (401 on bad creds) -> { accessToken, user }
curl -s -X POST http://localhost:4000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"password123"}'

# Current user -> { id, email, level }
curl -s http://localhost:4000/auth/me -H "authorization: Bearer $TOKEN"
```

### OAuth (GitHub / Google)

Browser-based flow (the frontend just links to the start URLs):

```
GET /auth/github           GET /auth/google            # start  -> 302 to provider
GET /auth/github/callback  GET /auth/google/callback   # provider redirects here
```

On success the callback issues the **same JWT** as email/password auth and
redirects the browser to `${WEB_ORIGIN}/auth/callback?token=<JWT>`. On failure it
redirects to `${WEB_ORIGIN}/auth/callback?error=oauth_failed`. A find-or-create
runs server-side: existing `(provider, providerId)` → reuse; matching email →
link the provider to that account; otherwise a new passwordless user is created.

#### Create a GitHub OAuth app

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL**: `http://localhost:3000`
3. **Authorization callback URL**: `http://localhost:4000/auth/github/callback`
4. Register, then copy the **Client ID** and a generated **Client Secret** into
   `.env` as `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

#### Create a Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services
   → OAuth consent screen**: choose **External**, fill in the app name/email, and
   add your own email (`skullkon@gmail.com`) as a **test user**.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   application type **Web application**.
3. **Authorized JavaScript origins**: `http://localhost:3000`
4. **Authorized redirect URIs**: `http://localhost:4000/auth/google/callback`
5. Create, then copy the **Client ID** and **Client Secret** into `.env` as
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

> Both providers allow plain `http://localhost` during development — no HTTPS or
> tunnel needed. Restart the API after editing `.env` so the strategies register.

### Progress

```bash
# Pull progress -> { solved: string[], solvedAt: {taskId: iso}, code: {taskId: src} }
curl -s http://localhost:4000/me/progress -H "authorization: Bearer $TOKEN"

# Bulk merge (idempotent; only mentioned tasks are touched)
curl -s -X PUT http://localhost:4000/me/progress \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"solved":["hello","loops"],"code":{"hello":"package main"}}'

# Single-task upsert
curl -s -X PUT http://localhost:4000/me/progress/hello \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"solved":true,"code":"package main"}'
```

## Docker

```bash
docker compose up --build   # api on :4000, sqlite persisted in a named volume
```

`Dockerfile` runs `prisma migrate deploy` on startup. See the comment in
`docker-compose.yml` / `prisma/schema.prisma` for the one-line switch to Postgres.

## Scripts

`build` · `start` · `start:dev` · `prisma:generate` · `prisma:migrate` · `prisma:studio`
