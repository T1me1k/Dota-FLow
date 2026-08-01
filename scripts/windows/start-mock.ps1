Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-environment.ps1"
Push-Location (Join-Path $PSScriptRoot '../..')
try { $env:DOTA_FLOW_RUNTIME_MODE='mock'; npm run runtime:mock -- $args } finally { Pop-Location }
