# Verification strategy

Backend tests use xUnit and ASP.NET Core WebApplicationFactory. PostgreSQL is the actual database provider. Each test class gets a randomly named database that is migrated from scratch and dropped after the class. The configured test database user needs CREATEDB permission. There is no in-memory database substitute.

Catalog tests exercise HTTP validation, persistence, duplicate ISBN handling, stock edits, archive preservation, filters and pagination. Borrower tests cover registration, updates, search, normalized unique email and invalid email rejection. Circulation tests cover availability, duplicate operations, due dates, history and concurrency. Return tests race duplicate requests and verify fixed late-return calculations. Report tests validate totals and category data before and after returning overdue loans. Seeding is applied twice to verify repeatability and stock consistency.

Frontend tests use Vitest and React Testing Library to exercise the book form, validation, saving, conflict feedback, cancellation and loan return affordances. Only the network boundary is mocked in these component tests.

Playwright tests use the real API and database. They create a category, title and borrower, issue and return the copy, then verify history and restored availability. A separate mobile test checks navigation and document width. Browser CI uses a dedicated ephemeral PostgreSQL service. Local browser runs add fictional QA records to the configured development database.

## Commands

```powershell
docker compose up -d db
./scripts/test.ps1 --configuration Release
```

On Linux/macOS set `LIBRARY_TEST_CONNECTION` to a PostgreSQL connection with CREATEDB permission, then run `dotnet test --configuration Release`. Do not use production credentials for testing.

```sh
cd frontend
npm ci
npm run build
npm run lint
npm test
```

With the development API on port 5080:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts Vite when needed. On Windows with Edge already installed, set `PLAYWRIGHT_CHANNEL=msedge` to use it. Restart Vite after switching branches if configuration reloads during a checkout. Stop the running native API before rebuilding its active configuration on Windows, or build/test in Release while the development API uses Debug.

To verify the built Docker stack, set `E2E_BASE_URL=http://127.0.0.1:18080` (or your configured Compose URL). In this mode Playwright uses the existing stack and does not start Vite.

## Evidence

Actual results and check links are recorded in `submission/TEST-RESULTS.md`. Screenshots in `docs/screenshots/` come from the running application with fictional seed records. Reproduce them with `node frontend/scripts/screenshots.mjs` while both native development services run. Screenshot scripts do not mock API responses.
