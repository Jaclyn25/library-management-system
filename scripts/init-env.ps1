$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '../.env'
if (Test-Path -LiteralPath $destination) {
    Write-Output 'Existing .env preserved.'
    exit 0
}
$generated = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
@('POSTGRES_DB=library', 'POSTGRES_USER=library', "POSTGRES_PASSWORD=$generated") | Set-Content -LiteralPath $destination
Write-Output 'Created ignored .env with a random database password.'
