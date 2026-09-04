# Grader (Go service). Talks HTTP to Judge0; never executes user code itself in
# judge0 mode. Build context MUST be `site/` so the task content (hidden tests)
# can be baked into the image read-only.
#
#   docker build -f deploy/grader.Dockerfile -t app-grader .   # run from site/

# ---- build stage ----
FROM golang:1.25 AS build
WORKDIR /src
COPY grader/go.mod ./
# No external deps yet, so go.sum may be absent — copy the rest of the source.
COPY grader/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/grader .

# ---- runtime stage ----
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/grader /app/grader
# Tasks (hidden tests + support files) baked read-only.
COPY content/tasks /content/tasks
ENV PORT=8080 \
    RUNNER=judge0 \
    CONTENT_DIR=/content/tasks
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/grader"]
