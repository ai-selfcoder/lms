FROM ghcr.io/engineer-man/piston:latest
USER root
COPY go1264.tgz /tmp/go1264.tgz
RUN set -eux; P=/piston/packages/gotest/1.26.4; mkdir -p "$P"; \
    tar -xzf /tmp/go1264.tgz -C "$P/"; rm /tmp/go1264.tgz; \
    printf "%s" "{\"language\":\"gotest\",\"version\":\"1.26.4\",\"aliases\":[\"gotest\",\"go-test\"],\"build_platform\":\"docker-debian\"}" > "$P/pkg-info.json"; \
    printf "%s\n" "export PATH=\$PWD/go/bin:\$PATH" "export GOROOT=\$PWD/go" "export GOTOOLCHAIN=local" "export GOFLAGS=-mod=mod" "export GOPROXY=off" "export CGO_ENABLED=1" > "$P/environment"; \
    printf "#!/usr/bin/env bash\nexit 0\n" > "$P/compile"; \
    printf "#!/usr/bin/env bash\nexport GOCACHE=/gocache\nexport GOPATH=\"\$PWD/.gopath\"\ngo test -json -race -count=1 -timeout 30s ./...\n" > "$P/run"; \
    printf "docker-debian" > "$P/.ppman-installed"; \
    chmod +x "$P/compile" "$P/run"; \
    ( cd "$P" && . ./environment && { echo "PATH=$PATH"; echo "GOROOT=$GOROOT"; echo "GOTOOLCHAIN=$GOTOOLCHAIN"; echo "GOFLAGS=$GOFLAGS"; echo "GOPROXY=$GOPROXY"; echo "CGO_ENABLED=$CGO_ENABLED"; } > .env ); \
    chown -R piston:piston /piston/packages/gotest; \
    /piston/packages/gotest/1.26.4/go/bin/go version
# -- Persistent shared GOCACHE, warmed with the full race-instrumented stdlib ---
# Each grade runs `go test -race`. Cold that rebuilds the race stdlib (~18s). We
# warm a shared cache at /gocache (a Docker named volume; seeded from this baked
# dir on first start) with `go build -race std`, so every grade only compiles the
# tiny solution package (~1-2s). Root is 0777 and all 256 shards are 1777 so the
# dynamic per-job isolate users (uid 600xx) can all read/write concurrently.
RUN set -eux; P=/piston/packages/gotest/1.26.4; \
    export PATH="$P/go/bin:$PATH" GOROOT="$P/go" GOTOOLCHAIN=local \
           GOFLAGS=-mod=mod GOPROXY=off CGO_ENABLED=1 GOCACHE=/gocache; \
    mkdir -p /gocache; \
    go build -race std; \
    find /gocache -type d -exec chmod 1777 {} +; \
    find /gocache -type f -exec chmod a+r {} +; \
    i=0; while [ "$i" -lt 256 ]; do d=$(printf "%02x" "$i"); mkdir -p "/gocache/$d"; chmod 1777 "/gocache/$d"; i=$((i + 1)); done; \
    chmod 0777 /gocache
# -- Bind the persistent /gocache volume RW into each isolate sandbox -----------
# This Piston fork runs jobs under `isolate`; only dirs passed via --dir are
# visible inside the sandbox. Add /gocache:rw so jobs can reach the warm cache.
RUN set -eux; F=/piston_api/src/job.js; \
    if ! grep -q -- '--dir=/gocache:rw' "$F"; then \
      cp -a "$F" "$F.orig"; \
      sed -i 's#`--dir=/etc:noexec`,#`--dir=/etc:noexec`,\n                `--dir=/gocache:rw`,#' "$F"; \
    fi; \
    grep -n -- '--dir=' "$F"
