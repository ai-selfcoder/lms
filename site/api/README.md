# goroutine-api

Minimal NestJS backend for the **goroutine** Go-learning app. Scope: email+password
auth (JWT) and cross-device **progress sync**. Grading is handled by the Go grader
(`site/grader`) — this service has no code runner.

> Progress and learning events start in the web app's `localStorage`. Once a user
> logs in, both are synced to the API for cross-device continuity and aggregate
> product analytics.

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
| `MENTOR_PROVIDER` | `deepseek` | AI review provider: `deepseek` or `anthropic` |
| `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` | _(empty)_ | Provider credentials (one is required for mentor reviews) |
| `MENTOR_RATE_LIMIT` | `5` | Maximum mentor reviews per account in the rolling window |
| `MENTOR_RATE_WINDOW_MS` | `600000` | Mentor rate-limit window in milliseconds |
| `MENTOR_REQUEST_TIMEOUT_MS` | `30000` | Maximum provider request duration in milliseconds |

OAuth is **optional**: leave a provider's creds empty and the app still boots
normally. Its start route then returns `501 { message: "... OAuth не настроен" }`.

### AI mentor

`GET /mentor/status` is public and reports whether a provider key is configured.
`POST /mentor/review` requires the authenticated session and accepts a bounded
task id, code listing, problem statement, and test output. Reviews are limited
per account by the rolling window above and return HTTP `429` with a
`Retry-After` header when the limit is reached. Provider calls are aborted after
`MENTOR_REQUEST_TIMEOUT_MS` and surfaced as a temporary `503`.

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

### Product profile, entitlements and skill reports

These authenticated endpoints provide the career goal and the manual billing
foundation. `FREE` is always included; `PRO`, `TEAM`, and `REVIEW_ADDON` can be
granted by an operator through the `Entitlement` table while checkout is being
validated.

```text
GET  /me/entitlements       -> active plans and their sources
PUT  /me/career-goal        -> {"goal":"promotion"}
GET  /me/reports/latest     -> latest verified skill report (or null)
POST /me/reports            -> create a report from confirmed task passes
POST /me/reports/:id/share  -> {"isPublic":true|false}
GET  /reports/share/:token  -> public report (no source code)
```

Reports contain confirmed task identifiers, pass timestamps, role context and
the next recommended gap. Sharing is private by default.

### Task discussions

Comments are scoped to a namespaced task id such as `go:01` or `os:01`. Reading is
public; posting requires the authenticated session and the readable CSRF cookie
(`X-CSRF-Token` header, as with other `/me/*` mutations).

```bash
# List the latest 100 comments in chronological order
curl -s http://localhost:4000/tasks/go%3A01/comments

# Add a comment (body is trimmed and limited to 2000 characters)
curl -s -X POST http://localhost:4000/me/tasks/go%3A01/comments \
  -H "authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF" -H 'content-type: application/json' \
  -d '{"body":"Почему здесь нужен unbuffered канал?"}'
```

### Solution notes

`GET/POST /me/tasks/:course:taskId/solution-notes` is a small, text-only
community surface for a task. Both reading and publishing require an
authenticated learner to have a trusted grader `PASS` for that exact course
and task. The Next.js server signs a five-minute pass proof with the shared
`GRADER_SYNC_SECRET`; the browser redeems it at `POST /me/task-passes` only in
the context of its own authenticated API session. The endpoint returns a stable anonymous alias, never an email, and
rejects fenced or recognizable Go source so notes explain an idea without
becoming a solution dump. A learner has one editable note per task.

### Learning events

Events are client-generated and idempotent by `id`; posting the same event again is
safe. The API accepts at most 100 events per request. Supported types are
`landing_view`, `goal_selected`, `diagnostic_started`, `diagnostic_completed`,
`first_task_started`, `started`, `run`, `feedback`, `first_pass`, `failed`,
`passed`, `hint`, `completed`, `topic_completed`, `artifact_saved`,
`report_created`, `report_shared`, `account_created`, `checkout_started`,
`subscription_started`, and `cancelled`.

```bash
curl -s -X POST http://localhost:4000/me/events \
  -H "authorization: Bearer $TOKEN" -H "X-CSRF-Token: $CSRF" \
  -H 'content-type: application/json' \
  -d '{"events":[{"id":"run:go:go:01:demo","type":"run","itemId":"go:01","courseId":"go","at":"2026-09-06T00:00:00.000Z"}]}'
```

## Docker

```bash
docker compose up --build   # api on :4000, sqlite persisted in a named volume
```

### Quality leaderboard

`GET /leaderboard` returns an anonymized ranking based on pass rate and solved
tasks. Only users with at least three checks (`passed` or `failed`) are included;
no email, code, timing, or raw event data is exposed. Filter by course with
`?courseId=go` or `?courseId=os`.

### Admin quality signals

`GET /admin/overview` is restricted to emails in `ADMIN_EMAILS`. Alongside the
funnel summary it returns up to eight task-quality signals derived from the last
30 days of learning events. A signal needs at least three grader responses and
contains only aggregate feedback, FAIL rate, recovery count, and completion
count - never learner identity or source code.

`Dockerfile` runs `prisma migrate deploy` on startup. See the comment in
`docker-compose.yml` / `prisma/schema.prisma` for the one-line switch to Postgres.

## Scripts

`build` · `start` · `start:dev` · `prisma:generate` · `prisma:migrate` · `prisma:studio`
