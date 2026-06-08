# Audita arquivos e padrões de SEO técnico do Planify (sem ferramentas externas).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$failures = @()

function Add-Failure([string]$message) {
  $script:failures += $message
  Write-Host "[FALHA] $message" -ForegroundColor Red
}

function Add-Pass([string]$message) {
  Write-Host "[OK] $message" -ForegroundColor Green
}

function Test-FileExists([string]$relativePath) {
  $full = Join-Path $root $relativePath
  if (-not (Test-Path $full)) {
    Add-Failure "Arquivo ausente: $relativePath"
    return $false
  }
  Add-Pass "Arquivo encontrado: $relativePath"
  return $true
}

function Test-FileContains([string]$relativePath, [string]$pattern, [string]$label) {
  $full = Join-Path $root $relativePath
  if (-not (Test-Path $full)) {
    Add-Failure "Não foi possível ler $relativePath para: $label"
    return
  }
  $content = Get-Content $full -Raw
  if ($content -notmatch $pattern) {
    Add-Failure "$label ($relativePath)"
  } else {
    Add-Pass $label
  }
}

Write-Host "`n=== Auditoria SEO Planify ===`n" -ForegroundColor Cyan

# Arquivos esperados
$expectedFiles = @(
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/lib/seo/constants.ts",
  "src/lib/seo/site-url.ts",
  "src/lib/seo/metadata.ts",
  "src/lib/seo/public-paths.ts",
  "src/lib/seo/strategic-pages.ts",
  "src/components/seo/StructuredData.tsx",
  "src/app/planejamento-escolar-com-ia/page.tsx",
  "src/app/gerador-de-atividades-com-ia/page.tsx",
  "src/app/gerador-de-provas-com-ia/page.tsx",
  "src/app/gerador-de-jogos-pedagogicos/page.tsx",
  "src/app/apostilas-com-ia-para-professores/page.tsx",
  "src/app/editor-de-documentos-para-professores/page.tsx",
  "src/app/(app)/layout.tsx",
  "src/app/admin/layout.tsx"
)

foreach ($file in $expectedFiles) {
  Test-FileExists $file | Out-Null
}

# Padrões globais
Test-FileContains "src/lib/seo/constants.ts" "iaplanify\.com\.br" "Domínio canônico em constants"
Test-FileContains "src/lib/seo/constants.ts" "Planify IA Educacional" "Marca SEO em constants"
Test-FileContains "src/lib/seo/metadata.ts" "metadataBase" "metadataBase configurado"
Test-FileContains "src/lib/seo/metadata.ts" "summary_large_image" "Twitter card summary_large_image"
Test-FileContains "src/app/layout.tsx" "buildGlobalMetadata" "Layout usa buildGlobalMetadata"
Test-FileContains "src/components/seo/StructuredData.tsx" "@graph" "JSON-LD com @graph"
Test-FileContains "src/components/seo/StructuredData.tsx" "Organization" "JSON-LD Organization"
Test-FileContains "src/components/seo/StructuredData.tsx" "WebSite" "JSON-LD WebSite"
Test-FileContains "src/components/seo/StructuredData.tsx" "SoftwareApplication" "JSON-LD SoftwareApplication"
Test-FileContains "src/app/page.tsx" "StructuredData" "StructuredData na home"

# Páginas públicas no sitemap
$publicPaths = @(
  "/",
  "/planos",
  "/escolas",
  "/contato",
  "/login",
  "/planejamento-escolar-com-ia",
  "/gerador-de-atividades-com-ia",
  "/gerador-de-provas-com-ia",
  "/gerador-de-jogos-pedagogicos",
  "/apostilas-com-ia-para-professores",
  "/editor-de-documentos-para-professores"
)

$sitemapPath = Join-Path $root "src/lib/seo/public-paths.ts"
if (Test-Path $sitemapPath) {
  $sitemapContent = Get-Content $sitemapPath -Raw
  foreach ($path in $publicPaths) {
    $escaped = [regex]::Escape($path)
    if ($sitemapContent -match $escaped) {
      Add-Pass "Sitemap inclui $path"
    } else {
      Add-Failure "Sitemap não inclui $path"
    }
  }
}

# Rotas privadas no robots
$privatePaths = @(
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
  "/admin"
)

$robotsPath = Join-Path $root "src/lib/seo/public-paths.ts"
if (Test-Path $robotsPath) {
  $robotsContent = Get-Content $robotsPath -Raw
  foreach ($path in $privatePaths) {
    $escaped = [regex]::Escape($path)
    if ($robotsContent -match $escaped) {
      Add-Pass "Robots disallow inclui $path"
    } else {
      Add-Failure "Robots disallow não inclui $path"
    }
  }
}

# noindex em layouts privados
Test-FileContains "src/app/(app)/layout.tsx" "PRIVATE_ROBOTS" "noindex no layout (app)"
Test-FileContains "src/app/admin/layout.tsx" "PRIVATE_ROBOTS" "noindex no layout admin"

# Evitar vercel.app como URL canonica hardcoded
Test-FileContains "src/lib/seo/constants.ts" "https://iaplanify\.com\.br" "Dominio de producao sem vercel.app"
$siteUrlContent = Get-Content (Join-Path $root "src/lib/seo/site-url.ts") -Raw
if ($siteUrlContent -match 'return\s+["'']https://[^"'']*vercel\.app') {
  Add-Failure "site-url.ts retorna vercel.app como canonical de producao"
} else {
  Add-Pass "site-url.ts nao usa vercel.app como canonical de producao"
}

# Metadata por página pública
$pagesWithMetadata = @(
  "src/app/planos/page.tsx",
  "src/app/contato/page.tsx",
  "src/app/login/page.tsx",
  "src/app/escolas/page.tsx"
)

foreach ($page in $pagesWithMetadata) {
  Test-FileContains $page "buildPageMetadata" "Metadata em $page"
}

Write-Host "`n=== Resumo ===`n" -ForegroundColor Cyan
if ($failures.Count -eq 0) {
  Write-Host "Auditoria concluída sem falhas." -ForegroundColor Green
  exit 0
}

Write-Host "Falhas: $($failures.Count)" -ForegroundColor Red
foreach ($f in $failures) {
  Write-Host " - $f"
}
exit 1
