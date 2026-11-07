$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    if (-not (Test-Path .env)) { throw 'Copy .env.example to .env and set POSTGRES_PASSWORD first.' }
    $settings = @{}
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $settings[$parts[0]] = $parts[1]
    }
    $env:ConnectionStrings__Library = "Host=localhost;Port=54329;Database=$($settings.POSTGRES_DB);Username=$($settings.POSTGRES_USER);Password=$($settings.POSTGRES_PASSWORD)"
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    dotnet run --project backend/Library.Api --no-launch-profile --urls http://localhost:5080
} finally { Pop-Location }
