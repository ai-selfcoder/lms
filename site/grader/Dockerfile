# --- build stage ---
FROM golang:1.25 AS build
WORKDIR /src
# Cache deps first.
COPY go.mod ./
# go.sum is optional (no external deps yet); copy if present.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/grader .

# --- runtime stage ---
# Static binary on a minimal base. The grader makes no untrusted code execution
# itself in judge0 mode; it only talks HTTP to Judge0.
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/grader /app/grader
# Content (tasks) is mounted read-only at runtime via compose.
ENV PORT=8080 \
    RUNNER=judge0 \
    CONTENT_DIR=/content/tasks
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/grader"]
