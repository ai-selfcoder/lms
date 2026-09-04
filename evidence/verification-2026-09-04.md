---
name: production-verification-evidence
description: Evidence from the September 4, 2026 backlog completion verification.
metadata:
  type: project
---

# Verification evidence — 2026-09-04

- Web unit suite: `cd site/web && npm test` — 9 files, 58 tests passed.
- Web lint: `cd site/web && npm run lint` — passed; existing non-blocking warnings remain for image optimization and hook dependencies.
- Content QA: `cd site/web && npm run qa` — all 32 task fixtures and required files validated.
- Smoke check: `cd site/web && npm run smoke` — landing CTA and task 1 metadata verified.
- Web production build: `cd site/web && npm run build` — 128 pages generated successfully.
- API build: `cd site/api && npm run build` — NestJS TypeScript build passed.
- Go checks were not executable because the environment does not provide the `go` binary.
- Auth flow now uses `goroutine.session` HttpOnly cookie, readable double-submit CSRF cookie, credentials-included requests, and logout revocation via cookie clearing.

The requested public deployed-environment smoke test remains represented by local production-like checks because no deployment URL was configured in this checkout.
