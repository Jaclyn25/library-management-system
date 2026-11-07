# Folio Library Management System

Auspify Technologies internship, Task 2.

Repository: https://github.com/Jaclyn25/library-management-system

Folio provides a complete local staff workflow for collection management, borrower registration, issuing, returns and reporting. The responsive React workspace is backed by an ASP.NET Core API and PostgreSQL. Conditional stock updates, transactions, unique indexes and check constraints protect circulation under concurrent requests.

## Feature checklist

- [x] Add, edit, view and safely archive books
- [x] Category creation, editing and protected deletion
- [x] Catalog search, category/availability filtering and pagination
- [x] Total and available copy tracking
- [x] Borrower registration, editing and borrowing history
- [x] Due dates, unavailable-book rejection and concurrent stock safety
- [x] Transactional returns and duplicate-return rejection
- [x] Active overdue and historical late-return tracking
- [x] Dashboard, recent activity, inventory and circulation charts
- [x] Summary reports and category breakdown
- [x] Fictional opt-in seed data and reproducible migrations
- [x] Backend API integration tests and frontend interaction tests
- [x] Browser checkout/return and mobile flow verification
- [x] Complete Docker stack with health checks and CI smoke verification

Actual screenshots are included in `screenshots/`. Machine-readable test evidence is included in `test-results/`, with a readable summary in `TEST-RESULTS.md`. The branch and PR history is in `DELIVERY.md`.

See the repository README for setup, screenshots, test commands and documented limitations. No portal submission or public deployment is performed.

## Source reference

- `backend/Library.Api/`: controllers, contracts, services, data and migrations
- `frontend/src/`: React routes, forms, tables, charts and interaction tests
- `tests/Library.Tests/`: PostgreSQL-backed API integration and business tests
- `frontend/e2e/`: browser flows
- `.github/workflows/`: validation without deployment

## Optional demo recording

Start the app, show dashboard totals, create a category and book, register a borrower, issue the book, confirm availability decreased, return it, inspect borrowing history and show reports. Display the test and CI results. Use fictional records, keep credentials off screen, and record at 1440×900 or higher. A video is optional and is not included.
