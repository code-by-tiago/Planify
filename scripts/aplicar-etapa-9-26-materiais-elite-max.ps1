param(
  [string]$ProjectRoot = "C:\planify"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Ok($Message) {
  Write-Host $Message -ForegroundColor Green
}

function Write-Warn($Message) {
  Write-Host $Message -ForegroundColor Yellow
}

$PackageRoot = Split-Path -Parent $PSScriptRoot
$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)

Write-Step "Planify | Etapa 9.26.0 - Materiais Elite Max"
Write-Host "Projeto: $ProjectRoot"
Write-Host "Pacote:  $PackageRoot"

if (-not (Test-Path $ProjectRoot)) {
  throw "Projeto nao encontrado em: $ProjectRoot"
}

$packageJson = Join-Path $ProjectRoot "package.json"
if (-not (Test-Path $packageJson)) {
  throw "package.json nao encontrado. Confirme se ProjectRoot aponta para C:\planify."
}

$relativeFiles = @(
  "src\app\materiais\MateriaisClient.tsx",
  "src\app\api\ai\material\route.ts",
  "src\server\ai\material-ai-service.ts",
  "src\server\ai\prompts\material-prompt.ts",
  "src\server\ai\prompts\material-content-suggestion-prompt.ts",
  "src\lib\materiais\pedagogical-hard-engine.ts",
  "src\lib\materiais\material-type-validator.ts",
  "src\lib\materiais\material-quality-guardian.ts",
  "src\lib\materiais\material-specialist-blueprints.ts",
  "src\types\ai.ts",
  "docs\9-26-0-materiais-elite-max.md",
  "scripts\aplicar-etapa-9-26-materiais-elite-max.ps1"
)

foreach ($relative in $relativeFiles) {
  $source = Join-Path $PackageRoot $relative
  if (-not (Test-Path $source)) {
    throw "Arquivo do pacote nao encontrado: $relative"
  }
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupRoot = Join-Path $ProjectRoot "backups\9-26-0-materiais-elite-max-$timestamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

Write-Step "Criando backup e copiando arquivos"
foreach ($relative in $relativeFiles) {
  $source = Join-Path $PackageRoot $relative
  $target = Join-Path $ProjectRoot $relative
  $targetDir = Split-Path -Parent $target
  $backupTarget = Join-Path $backupRoot $relative
  $backupDir = Split-Path -Parent $backupTarget

  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

  if (Test-Path $target) {
    Copy-Item -Path $target -Destination $backupTarget -Force
  }

  Copy-Item -Path $source -Destination $target -Force
  Write-Host "Atualizado: $relative"
}

Write-Ok "Backup criado em: $backupRoot"

Write-Step "Verificando TypeScript"
Push-Location $ProjectRoot
try {
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "typecheck falhou" }

  Write-Step "Rodando build de producao"
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "build falhou" }

  Write-Ok "BUILD OK - Etapa 9.26 aplicada com sucesso."
  Write-Host "Agora faca o commit/push com o bloco enviado na conversa." -ForegroundColor Green
}
finally {
  Pop-Location
}
