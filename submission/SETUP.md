# Reviewer setup

1. Clone the existing repository with an account that has access: `https://github.com/Jaclyn25/library-management-system`.
2. Install Docker Desktop (Linux containers) and start its engine.
3. From the repository root, run `pwsh ./scripts/init-env.ps1` to generate an ignored local password. On other systems copy `.env.example` to `.env` and set a strong random password.
4. Run `docker compose up --build -d`.
5. Open `http://localhost:8080`.

If Windows reserves port 8080, add `LIBRARY_WEB_PORT=18080` to `.env`, rerun `docker compose up -d` and open `http://127.0.0.1:18080`. This alternate port was verified with all three containers healthy and both browser flows passing.

The optional seed configuration in Compose initializes an empty database with fictional records. It does not replace existing data. The PostgreSQL volume persists through ordinary restarts.

For native development install .NET SDK 10 and Node 24 LTS, run `docker compose up -d db`, start the API with `pwsh ./scripts/start-api.ps1`, then run `npm ci` and `npm run dev` in `frontend/`. Open `http://localhost:5173`.

Backend verification: `pwsh ./scripts/test.ps1 --configuration Release`. This needs the PostgreSQL container and uses disposable databases with CREATEDB permission. Frontend checks: `npm run build`, `npm run lint`, `npm test`. Browser checks with both dev services running: `npx playwright install chromium`, then `npm run test:e2e`.

The app is a local staff tool without identity management. Do not expose it on a public network. No deployment or portal submission is included.
