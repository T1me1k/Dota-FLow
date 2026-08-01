Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-environment.ps1"
Push-Location (Join-Path $PSScriptRoot '../..')
try { npm install; npm --prefix apps/desktop install; npm --prefix apps/overwolf-electron install; npm run desktop:typecheck; npm run electron:typecheck } finally { Pop-Location }
