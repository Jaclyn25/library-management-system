# Library Management System

Independent internship project for Auspify Technologies, Task 2.

Implementation in progress. ASP.NET Core 10 API, PostgreSQL and React/TypeScript.

## Foundation checks

```sh
dotnet restore
dotnet build --no-restore
dotnet test --no-build
cd frontend
npm ci
npm run build
npm run lint
```

Feature work is reviewed through separate pull requests into main. No automatic deployment.
