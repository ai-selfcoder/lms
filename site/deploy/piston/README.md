# Sandbox host: Piston + `gotest` package (canonical source)

These are the **canonical, version-controlled** copies of what runs on the
sandbox host (`201.51.24.60`) under `/root/piston/`. That box is not under git,
so keep this dir in sync when you change the sandbox.

See also [../PISTON.md](../PISTON.md) for the deployment/firewall walkthrough.

## Files

- **`Dockerfile`** — `FROM ghcr.io/engineer-man/piston` + a baked custom package
  **`gotest` 1.26.4** (Go 1.26.4 toolchain; `run` = `go test -json -race`), a
  **warm shared GOCACHE**, and a one-line patch to Piston's `job.js`.
- **`docker-compose.yml`** — service `piston`, the raised `PISTON_*` limits, the
  jobs tmpfs, and the persistent `gocache` volume.
- **`go1264.tgz`** — the Go 1.26.4 toolchain tarball, **not committed** (~64 MB).
  It must sit next to the Dockerfile on the box. Produce it from an extracted
  Go 1.26.4 so the archive contains a top-level `go/` dir:
  `tar -C /path/to -czf go1264.tgz go`.

## Performance: warm GOCACHE (why grades are ~1.5s not ~18s)

Each grade runs `go test -race`, which needs the race-instrumented stdlib. Cold,
that rebuilds stdlib from scratch (~18 s/grade — a hard scaling wall). The fix:

1. **Persistent shared cache** at `/gocache` (a Docker named volume).
2. **Warm it at image build** with `go build -race std` (caches *all* std race
   builds; ~186 MB). Docker seeds the empty volume from the baked dir on first
   `up`, so even the first grade is fast.
3. **Make it reachable inside the sandbox.** This Piston fork isolates each job
   with `isolate`; only dirs passed via `--dir` are visible. The Dockerfile
   patches `job.js` to add `--dir=/gocache:rw`. (Without it the job fails with
   `failed to initialize build cache at /gocache: mkdir: permission denied`.)
4. **Concurrency-safe perms.** Jobs run as dynamic users (uid 600xx); cache root
   is `0777` and all 256 shard dirs are `1777`, so many grades read/write the
   cache at once without collisions. Verified: 20 concurrent grades → 20/20 pass,
   ~6.6 s wall.

Steady state: a grade only compiles the small `solution` package (~1-2 s).

## Rebuild / restart

```bash
cd /root/piston
docker compose up -d --build
# To re-seed the cache from a fresh image (after changing the warm step):
#   docker compose down && docker volume rm piston_gocache && docker compose up -d --build
curl -s http://localhost:2000/api/v2/runtimes   # -> gotest 1.26.4
```

## Smoke + timing

```bash
cat > /tmp/req.json <<'JSON'
{"language":"gotest","version":"1.26.4","run_timeout":55000,"run_cpu_time":55000,"files":[
 {"name":"go.mod","content":"module solution\ngo 1.25\n"},
 {"name":"solution.go","content":"package solution\nfunc Add(a,b int) int{return a+b}\n"},
 {"name":"solution_test.go","content":"package solution\nimport \"testing\"\nfunc TestAdd(t *testing.T){if Add(2,3)!=5{t.Fatal(\"x\")}}\n"}]}
JSON
time curl -s http://localhost:2000/api/v2/execute -H 'content-type: application/json' --data @/tmp/req.json | grep -o 'ok  '
```
