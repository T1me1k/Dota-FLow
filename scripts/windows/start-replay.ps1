Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-environment.ps1"
Push-Location (Join-Path $PSScriptRoot '../..')
try { $env:DOTA_FLOW_RUNTIME_MODE='replay'; npm run runtime:replay -- $args } finally { Pop-Location }
