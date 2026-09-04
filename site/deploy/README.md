# Deploy on Coolify

One Docker Compose stack runs the app:

| Service | What it is | Port | Public? |
|---------|------------|------|---------|
| `web` | Next.js — учебник, симуляторы, BFF API routes | 3000 | ✅ domain |
| `api` | NestJS — auth, progress sync, AI-mentor (Prisma/SQLite) | 4000 | ✅ domain |
| `grader` | Go — прогоны задач, проверка по скрытым тестам | 8080 | internal |

The **code sandbox (Piston) runs on a separate host** (set `PISTON_URL`) — this stack only needs the grader to talk to it, so no `privileged` containers run here. See [PISTON.md](./PISTON.md) for the sandbox host setup.

Content (`../content`) is **baked into the `web` and `grader` images** at build time, so the containers have no host-path dependencies. `api` keeps its SQLite file on a persistent volume (`api-db`).

---

## 1. Prerequisites

- A Coolify server (any Docker host — no `privileged` needed; the sandbox is external).
- A reachable Piston sandbox host (`PISTON_URL`) with the `gotest` package — see [PISTON.md](./PISTON.md). Verify: `curl $PISTON_URL/api/v2/runtimes`.
- A domain (or subdomain) for `web`, and one for `api`.

## 2. Create the resource

1. Coolify → **Project → New Resource → Docker Compose**.
2. Source: this Git repo. **Compose file path:** `site/deploy/docker-compose.yml`.
   - If Coolify asks for a *Base Directory*, leave it at the repo root — build contexts (`..`) resolve to `site/`.

## 3. Environment variables

Paste the keys from [`.env.example`](./.env.example) into Coolify’s **Environment Variables** and fill them in. The essentials:

- `PUBLIC_WEB_URL` / `PUBLIC_API_URL` — the two domains you’ll attach below.
  `PUBLIC_API_URL` is **baked into the web bundle at build** → if you change it, redeploy `web`.
- `JWT_SECRET` — `openssl rand -hex 32` (secret).
- `PISTON_URL` — your external Piston host (e.g. `http://201.51.24.60:2000`).
  Must run the custom `gotest` package — see [PISTON.md](./PISTON.md).
- OAuth + AI keys are optional (see comments in `.env.example`).

## 4. Domains

In Coolify, attach:

- `PUBLIC_WEB_URL` → service **`web`**, port **3000**.
- `PUBLIC_API_URL` → service **`api`**, port **4000**.

Coolify’s Traefik terminates TLS. The `ports:` lines in the compose are only used for plain `docker compose` runs; with Coolify’s proxy you can ignore them.

## 5. OAuth callbacks (if used)

Register these callback URLs with the provider:

- GitHub: `${PUBLIC_API_URL}/auth/github/callback`
- Google: `${PUBLIC_API_URL}/auth/google/callback`

## 6. Deploy

Hit **Deploy**. First build compiles web/api/grader — give it a few minutes. Health checks:

- `web`  → `GET /` returns 200
- `api`  → `GET /mentor/status` returns 200
- `grader` → `GET /healthz` (internal)

---

## Run it locally (sanity check)

```bash
cd site
cp deploy/.env.example deploy/.env      # edit JWT_SECRET at least
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up --build
# web → http://localhost:3000   api → http://localhost:4000
```

## Notes & knobs

- **Sandbox host setup** (Piston + `gotest` package + firewall) is documented
  separately in [PISTON.md](./PISTON.md). The grader only needs `PISTON_URL`.
- **Updating content** (chapters, tasks, sims): redeploy — `web` and `grader`
  rebuild and re-bake the latest `content/`.
- **Switching the API to Postgres** (instead of SQLite): set
  `provider = "postgresql"` in `api/prisma/schema.prisma`, regenerate
  migrations, add a Postgres service, and point `DATABASE_URL` at it. SQLite on
  the `api-db` volume is fine for a single instance.
