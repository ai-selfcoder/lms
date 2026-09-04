# grader

HTTP grading service for the Go concurrency trainer. It accepts a submission,
assembles a multi-file Go module (user code + the task's hidden test), runs
`go test -race`, and returns a verdict.

Two execution backends behind one `Runner` interface, selected by `RUNNER`:

| RUNNER   | Backend                              | Use            | Sandboxed |
|----------|--------------------------------------|----------------|-----------|
| `local`  | `go test -race` on the host          | dev only       | **No**    |
| `judge0` | self-hosted Judge0 multi-file lang   | production     | **Yes**   |

## API

### `POST /api/run`

Request:
```json
{ "taskId": "09", "code": "package solution\n..." }
```

Response (always HTTP 200 on a graded submission, even on failure):
```json
{ "pass": true, "output": "=== RUN ...\nPASS\nok ...",
  "durationMs": 1520, "timedOut": false, "compileError": false }
```

Verdict mapping:
- exit 0 / Judge0 `Accepted` → `pass: true`
- build failure → `compileError: true`, `pass: false`
- test timeout / Judge0 wall-time exceeded → `timedOut: true`, `pass: false`
- otherwise (test failed, runtime panic) → `pass: false`

Error responses (HTTP 4xx/5xx) carry `{"error": "..."}` and are for malformed
requests or grader-infrastructure failures, never for a failed submission.

### `GET /healthz`
```json
{ "status": "ok", "runner": "local" }
```

## Run locally (dev)

No Docker, no Judge0 — runs `go test` directly on your machine. Only use this
for trusted code (your own reference/starter solutions), never public traffic.

```sh
cd site/grader
RUNNER=local \
CONTENT_DIR=/absolute/path/to/site/content/tasks \
PORT=8080 \
go run .
```

Smoke test against task 09:
```sh
cd site/content/tasks/09

# reference.go → pass:true
jq -nc --arg code "$(cat reference.go)" '{taskId:"09", code:$code}' \
  | curl -s -X POST localhost:8080/api/run -H 'Content-Type: application/json' -d @- \
  | jq '{pass, compileError, timedOut, durationMs}'

# starter.go → pass:false
jq -nc --arg code "$(cat starter.go)" '{taskId:"09", code:$code}' \
  | curl -s -X POST localhost:8080/api/run -H 'Content-Type: application/json' -d @- \
  | jq '{pass, compileError, timedOut, durationMs}'
```

## Run the full stack (prod-like, sandboxed)

This brings up Judge0 (server + workers), Postgres, Redis, and the grader in
`judge0` mode. The grader's `Judge0Runner` cannot be tested without this stack.

```sh
cd site
docker compose -f infra/docker-compose.yml up -d --build

# wait for Judge0 to be ready
curl -s localhost:2358/languages | jq '.[] | select(.name | test("Multi-file"))'

# grade through the grader (now backed by the sandbox)
curl -s localhost:8080/healthz
```

Optionally start the Next.js web app too:
```sh
docker compose -f infra/docker-compose.yml --profile web up -d --build
```

### Judge0 notes
- Config lives in `infra/judge0.conf`. Limits are **raised** for race builds:
  wall 60s cap, memory 1.5 GiB cap, threads 256+. The grader sends per-submission
  values within these caps (cpu 35s / wall 40s / mem 1 GiB).
- The **Multi-file program** language (default id **89**) must be present in your
  Judge0 install. Override with `JUDGE0_LANGUAGE_ID` if your build numbers it
  differently. Confirm with `curl localhost:2358/languages`.
- Judge0 workers need a **privileged** container with cgroup access (the
  `isolate` sandbox). On Linux this works out of the box. On Docker Desktop
  (macOS/Windows) you may need to enable cgroup v1 or run the workers on a Linux
  VM; the grader and `LocalRunner` are unaffected.

## Environment variables

| Var                       | Default              | Description                                            |
|---------------------------|----------------------|--------------------------------------------------------|
| `RUNNER`                  | `local`              | `local` or `judge0`                                    |
| `PORT`                    | `8080`               | HTTP listen port                                       |
| `CONTENT_DIR`             | `../content/tasks`   | Path to `content/tasks` (resolved to absolute)         |
| `MAX_CODE_BYTES`          | `65536`              | Reject submissions larger than this (64 KiB)           |
| `RATE_LIMIT_PER_MIN`      | `30`                 | Submissions per client IP per minute                   |
| `REQUEST_TIMEOUT_SECONDS` | `60`                 | Per-request deadline                                   |
| `ALLOWED_ORIGINS`         | `*`                  | CSV CORS allowlist, or `*`                              |
| `JUDGE0_URL`              | —                    | Judge0 base URL (required when `RUNNER=judge0`)         |
| `JUDGE0_LANGUAGE_ID`      | `89`                 | Multi-file language id (override if install differs)   |
| `JUDGE0_AUTH_TOKEN`       | —                    | `X-Auth-Token` if Judge0 has `AUTHN_TOKEN` set         |

## Security model

- **Untrusted code runs only in Judge0** (`RUNNER=judge0`): isolated via
  cgroups/seccomp (`isolate`), with **no network** (`enable_network:false`,
  enforced and not re-enableable by submissions) and CPU/wall/memory caps.
- `RUNNER=local` has **no isolation** — it is a developer convenience and must
  never face untrusted input.
- Hidden grader files (`solution_test.go`, `support.go`) and reference solutions
  never leave the server in plain form except inside the sandbox submission;
  **`reference.go` is never shipped to the sandbox** (it is not in the file
  allowlist).
- Request guards: `taskId` is validated against `^[A-Za-z0-9_-]{1,16}$` with an
  additional path-containment check (no traversal), code size is capped, and a
  per-IP fixed-window rate limiter throttles abuse. For multi-instance
  deployments move the rate limiter to Redis.

## Layout

```
grader/
  main.go           # wiring, graceful shutdown
  config.go         # env-driven Config
  server.go         # HTTP handlers, CORS, guards
  ratelimit.go      # per-IP fixed-window limiter
  runner.go         # Runner interface + shared contract types
  local_runner.go   # LocalRunner (dev: go test on host)
  judge0_runner.go  # Judge0Runner (prod: sandboxed multi-file submission)
  verdict.go        # compile-error detection shared by both runners
  Dockerfile        # static binary on distroless
```
