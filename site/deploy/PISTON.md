# Sandbox host: Piston + `gotest` package

The grader runs `go test -race` against hidden tests inside **Piston**
(engineer-man/piston) on a **separate host** from the app. Piston isolates each
job with its own ephemeral user + namespaces and works on **cgroup v2** kernels
(Judge0's `isolate` does not — that's why we moved off it).

## What's deployed

On the sandbox host (`201.51.24.60`), under `/root/piston/`:

- **`Dockerfile`** — `FROM ghcr.io/engineer-man/piston` + a baked custom package
  **`gotest` 1.26.4**: the Go 1.26.4 toolchain plus a `run` script that does
  `go test -json -race -count=1 -timeout 30s ./...`. (Stock Piston only ships Go
  1.16 and only runs `go run`, neither of which fits this course.)
- **`docker-compose.yml`** — service `piston`, `image: piston-gotest:1.26.4`,
  `restart: always`, `privileged: true`, the raised `PISTON_*` limits, and a
  jobs tmpfs.

Rebuild / restart:

```bash
cd /root/piston && docker compose up -d --build
curl -s http://localhost:2000/api/v2/runtimes   # -> includes gotest 1.26.4
```

### Why the raised limits (already set in compose)

Race builds are heavy; Piston's defaults reject them. Set via env:

| Var | Value | Why |
|-----|-------|-----|
| `PISTON_RUN_CPU_TIME`, `PISTON_RUN_TIMEOUT` | 60000 | race build+test ≫ default 3 s |
| `PISTON_COMPILE_CPU_TIME`, `PISTON_COMPILE_TIMEOUT` | 60000 | — |
| `PISTON_MAX_FILE_SIZE` | 536870912 | race object files are large (else "file too large") |
| `PISTON_MAX_PROCESS_COUNT` | 256 | race spawns threads |
| `PISTON_RUN_MEMORY_LIMIT` / `PISTON_COMPILE_MEMORY_LIMIT` | -1 | unlimited |
| `PISTON_OUTPUT_MAX_SIZE` | 4000000 | the test2json stream is large |

## ⚠️ Exposure — `/api/v2/execute` is "run arbitrary code"

Piston is currently bound to **`127.0.0.1:2000`** (not reachable from the
internet — safe, but the app's grader can't reach it yet). Pick one to connect
the grader (on the Coolify host) to it:

**Option A — private network (recommended).** Put both hosts on WireGuard /
Tailscale and point `PISTON_URL` at the sandbox's private IP. Keep the
`127.0.0.1:2000` bind, or bind to the private interface. Nothing is public.

**Option B — public port, firewalled to the app host only.** In
`docker-compose.yml` change the bind to `"2000:2000"`, then allow ONLY the
Coolify host's IP (Docker bypasses UFW, so filter in `DOCKER-USER`):

```bash
APP_IP=<coolify-host-public-ip>
iptables -I DOCKER-USER -p tcp --dport 2000 -s "$APP_IP" -j RETURN
iptables -A DOCKER-USER -p tcp --dport 2000 -j DROP
# persist: apt-get install iptables-persistent && netfilter-persistent save
```

Never leave `:2000` open to `0.0.0.0` without the DROP rule.

Then set `PISTON_URL` in the app's `.env` to the reachable address
(`http://<private-or-public-ip>:2000`) and verify from the app host:
`curl $PISTON_URL/api/v2/runtimes`.

## Smoke test (from the sandbox host)

```bash
curl -s http://localhost:2000/api/v2/execute -H 'content-type: application/json' -d '{
  "language":"gotest","version":"1.26.4","run_timeout":55000,"run_cpu_time":55000,
  "files":[{"name":"go.mod","content":"module solution\ngo 1.25\n"},
           {"name":"solution.go","content":"package solution\nfunc Add(a,b int) int{return a+b}\n"},
           {"name":"solution_test.go","content":"package solution\nimport \"testing\"\nfunc TestAdd(t *testing.T){if Add(2,3)!=5{t.Fatal(\"x\")}}\n"}]}' | grep -o '"Action":"pass"'
```

Grades are ~1.5 s (was ~18 s). The race-instrumented stdlib is pre-built into a
persistent shared GOCACHE that the isolate sandbox mounts `rw` — see
[piston/README.md](piston/README.md) for the mechanism and the canonical
Dockerfile/compose. To reproduce or change it, edit the files under `piston/`
and keep `/root/piston/` on the sandbox host in sync.

## The old Judge0 on this host

`/root/judge0-v1.13.1` (Judge0 1.13.1) is **unused** — it can't execute code on
this cgroup-v2 kernel. Its API is still published on `:2358`. Decommission when
ready: `cd /root/judge0-v1.13.1 && docker compose down`.
