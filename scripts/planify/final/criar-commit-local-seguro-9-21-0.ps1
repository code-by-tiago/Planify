param(
  [string]$ProjectRoot = "C:\planify",
  [string]$CommitMessage = "release: preparar Planify para GitHub e deploy seguro"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Planify | Commit local seguro 9.21.0" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

if (!(Test-Path ".git")) {
  Write-Host "Repositorio Git nao encontrado. Inicializando..." -ForegroundColor Yellow
  git init
}

Write-Host ""
Write-Host "Rodando auditoria anti-vazamento antes do commit..." -ForegroundColor Cyan
node scripts\planify\final\auditoria-anti-vazamento-9-21-0.cjs

if ($LASTEXITCODE -ne 0) {
  throw "Auditoria anti-vazamento falhou. Commit bloqueado para sua seguranca."
}

Write-Host ""
Write-Host "Confirmando build antes do commit..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Build falhou. Commit bloqueado."
}

Write-Host ""
Write-Host "Arquivos que serao avaliados pelo Git:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "Adicionando arquivos respeitando .gitignore..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Confirmando que .env.local nao entrou no stage..." -ForegroundColor Cyan
$EnvStaged = git diff --cached --name-only | Select-String -Pattern "^\.env(\.|$)|\.env\.local"

if ($EnvStaged) {
  git restore --staged .env.local 2>$null
  git restore --staged .env 2>$null
  throw "Arquivo .env foi detectado no stage. Removi/bloqueei por seguranca. Revise .gitignore."
}

Write-Host ""
Write-Host "Criando commit local..." -ForegroundColor Cyan
git commit -m $CommitMessage

Write-Host ""
Write-Host "Commit local criado com seguranca." -ForegroundColor Green
Write-Host ""
Write-Host "Proximo passo manual:" -ForegroundColor Cyan
Write-Host "1. Crie um repositorio privado no GitHub." -ForegroundColor Cyan
Write-Host "2. Depois rode:" -ForegroundColor Cyan
Write-Host "   git remote add origin URL_DO_SEU_REPOSITORIO" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
