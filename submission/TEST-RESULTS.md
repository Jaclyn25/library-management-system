# Actual verification results

Verification date: **7 November 2026**, Africa/Cairo.

| Check | Actual result | Evidence |
| --- | --- | --- |
| .NET Release build | Passed, zero warnings/errors | Backend CI and local test build |
| Backend xUnit/API tests | **19 passed, 0 failed, 0 skipped** | [TRX](test-results/backend.trx) |
| Frontend production build | Passed | Frontend CI and local Vite build |
| TypeScript | Passed | Build typecheck and CI `tsc --noEmit` |
| ESLint | Passed | Frontend CI and local lint |
| Vitest/Testing Library | **6 passed, 0 failed** | [JSON results](test-results/frontend.json) |
| Playwright critical flows | **2 passed** using installed Edge locally | [Browser results](test-results/browser.json) |
| Dependency audit | Zero frontend vulnerabilities | `npm audit` and install audit |
| Complete Docker image builds | Both passed locally and in CI | Infrastructure CI container job |
| Compose stack | Database, API and web healthy | Local `docker compose ps` and CI startup checks |
| Reverse proxy | HTTP 200, healthy API, OpenAPI 3.1.1 | Local port 18080 and CI default port 8080 |

## Backend scenarios

- Create, edit and retrieve a book successfully.
- Reject invalid title, ISBN and negative copy count.
- Reject duplicate ISBN and preserve archived details.
- Search, filter and paginate catalog records; protect used categories.
- Register and edit borrowers; reject invalid/duplicate emails.
- Issue available books and reject unavailable ones without negative stock.
- Reject duplicate operations and invalid due dates; retain borrower history.
- Race 12 requests for a single remaining copy: exactly one checkout succeeds.
- Race 10 distinct readers for two copies: exactly two checkouts succeed.
- Reject stock reduction below the count on loan; preserve stock arithmetic when increasing totals.
- Race 8 return requests: exactly one return succeeds and one copy is restored.
- Verify overdue boundaries and fixed historical late-return days.
- Verify report totals and category data before and after returning an overdue loan.
- Apply fictional seeding twice and verify count and stock consistency.
- Verify runtime configuration escaping and missing-configuration errors.

## Browser scenarios

Create a category, title and borrower; issue the book; return it; verify preserved returned history, no repeat-return action and restored catalog availability. On a 390px viewport, open navigation, visit the catalog and verify no document-wide overflow.

CI uses real Chromium, the ASP.NET API and PostgreSQL. Component tests mock only the HTTP boundary. Backend tests always use the real PostgreSQL provider and reproduce migrations in isolated databases.

The saved browser JSON is from the final local run **against the built Docker stack** at `http://127.0.0.1:18080`: 2 passed, 0 failed, in 9.1 seconds. The development-server browser flows also passed separately. Windows reserved port 8080, so the local `.env` uses the configurable alternate port. The default port was verified in Linux CI.

## CI references

- [Validated critical-flow run](https://github.com/Jaclyn25/library-management-system/actions/runs/42377383232): backend, frontend and browser jobs passed.
- [Validated infrastructure run](https://github.com/Jaclyn25/library-management-system/actions/runs/42378172709): backend, frontend, browser and complete-container jobs passed.
- [Current validation history](https://github.com/Jaclyn25/library-management-system/actions/workflows/ci.yml): subsequent infrastructure and documentation PR checks.

Initial confirmed failures were corrected before merging: design-time migration configuration, a browser select locator, loopback proxy configuration, and a Windows build lock from a running Debug executable. No failing implementation was merged. A GitGuardian false positive on a Compose interpolation expression was removed and the check passed.
