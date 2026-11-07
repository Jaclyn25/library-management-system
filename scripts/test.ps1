$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $settings = @{}
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $settings[$parts[0]] = $parts[1]
    }
    $env:LIBRARY_TEST_CONNECTION = "Host=localhost;Port=54329;Database=$($settings.POSTGRES_DB);Username=$($settings.POSTGRES_USER);Password=$($settings.POSTGRES_PASSWORD)"
    dotnet test @args
    if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
} finally { Pop-Location }
