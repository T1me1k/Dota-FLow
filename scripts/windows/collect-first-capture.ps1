Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-environment.ps1"
Write-Host 'Follow docs/FIRST_CAPTURE_PROTOCOL.md. This script does not claim to detect the Dota launch option.'
& "$PSScriptRoot/start-live.ps1"
