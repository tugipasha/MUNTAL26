$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

& "$PSScriptRoot\generate-images.ps1"
npm install
npm run build
Write-Host ""
Write-Host "Setup complete. Start the dev server with: npm run dev"
