Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Dota Flow LIVE_GEP requires Windows. Use mock/replay elsewhere.' }
foreach ($command in @('node','npm')) { if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command is required and must be on PATH." } }
Write-Host "Windows environment detected. Node $(node --version); npm $(npm --version)."
Write-Host 'Dota launch option and Overwolf whitelisting require manual confirmation.'
