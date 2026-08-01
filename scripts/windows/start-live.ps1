Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-environment.ps1"
Push-Location (Join-Path $PSScriptRoot '../..')
try { $env:DOTA_FLOW_RUNTIME_MODE='live'; npm run runtime:live -- $args } finally { Pop-Location }
