# Planify - Diagnóstico cirúrgico da página Planejamentos
# Etapa 9.20.12
# Este script NÃO altera código-fonte do projeto.
# Ele apenas gera um relatório de investigação.

$ErrorActionPreference = "Continue"

$Root = "C:\planify"
$ScriptDir = Join-Path $Root "scripts"
$ReportPath = Join-Path $ScriptDir "diagnostico-planejamentos-9-20-12-report.txt"

if (!(Test-Path $Root)) {
    Write-Host "ERRO: Pasta C:\planify não encontrada." -ForegroundColor Red
    exit 1
}

Set-Location $Root
New-Item -ItemType Directory -Path $ScriptDir -Force | Out-Null

if (Test-Path $ReportPath) {
    Remove-Item $ReportPath -Force
}

function Add-Report {
    param([string]$Text = "")
    $Text | Out-File -FilePath $ReportPath -Append -Encoding UTF8
}

function Add-Section {
    param([string]$Title)
    Add-Report ""
    Add-Report "============================================================"
    Add-Report $Title
    Add-Report "============================================================"
}

function Safe-Command {
    param(
        [string]$Title,
        [scriptblock]$Command
    )

    Add-Section $Title
    try {
        $result = & $Command 2>&1
        if ($null -eq $result -or $result.Count -eq 0) {
            Add-Report "(sem resultado)"
        } else {
            $result | ForEach-Object { Add-Report "$_" }
        }
    } catch {
        Add-Report "ERRO AO EXECUTAR: $($_.Exception.Message)"
    }
}

function Get-ShortPath {
    param([string]$FullName)
    return $FullName.Replace($Root, "").TrimStart("\")
}

Add-Report "PLANIFY - DIAGNÓSTICO CIRÚRGICO /planejamentos"
Add-Report "Etapa: 9.20.12"
Add-Report "Data/Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Report "Raiz analisada: $Root"
Add-Report ""
Add-Report "IMPORTANTE: este diagnóstico não lê valores de .env e não altera arquivos do projeto."

Add-Section "1. Ambiente local básico"

Add-Report "Pasta atual:"
Add-Report "$(Get-Location)"

Add-Report ""
Add-Report "Node:"
try { Add-Report "$(node -v)" } catch { Add-Report "Node não encontrado ou não disponível no PATH." }

Add-Report ""
Add-Report "NPM:"
try { Add-Report "$(npm -v)" } catch { Add-Report "NPM não encontrado ou não disponível no PATH." }

Add-Report ""
Add-Report "Arquivos .env existentes, sem mostrar conteúdo:"
Get-ChildItem -Path $Root -Force -File -Filter ".env*" | ForEach-Object {
    Add-Report "- $($_.Name) | Modificado: $($_.LastWriteTime)"
}

Safe-Command "2. Git - branch, remotes, últimos commits e estado" {
    Write-Output "Branch atual:"
    git branch --show-current

    Write-Output ""
    Write-Output "Remotes:"
    git remote -v

    Write-Output ""
    Write-Output "Últimos 8 commits:"
    git log --oneline -8

    Write-Output ""
    Write-Output "Status:"
    git status --short
}

Add-Section "3. Arquivos de configuração relevantes"

$configCandidates = @(
    "package.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "vercel.json",
    ".vercel\project.json",
    "tsconfig.json",
    "tailwind.config.js",
    "tailwind.config.ts"
)

foreach ($item in $configCandidates) {
    $path = Join-Path $Root $item
    if (Test-Path $path) {
        $file = Get-Item $path
        Add-Report "ENCONTRADO: $item | Modificado: $($file.LastWriteTime) | Tamanho: $($file.Length) bytes"
    } else {
        Add-Report "NÃO encontrado: $item"
    }
}

Add-Section "4. package.json - scripts disponíveis"

$packagePath = Join-Path $Root "package.json"
if (Test-Path $packagePath) {
    try {
        $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json
        if ($pkg.scripts) {
            $pkg.scripts.PSObject.Properties | ForEach-Object {
                Add-Report "$($_.Name): $($_.Value)"
            }
        } else {
            Add-Report "Nenhum script encontrado em package.json."
        }
    } catch {
        Add-Report "Erro ao ler package.json: $($_.Exception.Message)"
    }
} else {
    Add-Report "package.json não encontrado."
}

Add-Section "5. Candidatos diretos para a rota /planejamentos"

$routeCandidates = @(
    "src\app\planejamentos\page.tsx",
    "src\app\planejamentos\page.ts",
    "app\planejamentos\page.tsx",
    "app\planejamentos\page.ts",
    "src\pages\planejamentos.tsx",
    "src\pages\planejamentos.ts",
    "src\pages\planejamentos\index.tsx",
    "src\pages\planejamentos\index.ts",
    "pages\planejamentos.tsx",
    "pages\planejamentos.ts",
    "pages\planejamentos\index.tsx",
    "pages\planejamentos\index.ts"
)

$foundRouteCandidates = @()

foreach ($relative in $routeCandidates) {
    $path = Join-Path $Root $relative
    if (Test-Path $path) {
        $file = Get-Item $path
        $hash = Get-FileHash $path -Algorithm SHA256
        $foundRouteCandidates += $path
        Add-Report "ENCONTRADO: $relative"
        Add-Report "  Modificado: $($file.LastWriteTime)"
        Add-Report "  Tamanho: $($file.Length) bytes"
        Add-Report "  SHA256: $($hash.Hash)"
    } else {
        Add-Report "NÃO encontrado: $relative"
    }
}

if ($foundRouteCandidates.Count -eq 0) {
    Add-Report ""
    Add-Report "ALERTA: Nenhum arquivo padrão de rota /planejamentos foi encontrado."
}

Add-Section "6. Todos os arquivos com nome relacionado a Planejamentos"

$allCodeFiles = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\.next\\" -and
        $_.FullName -notmatch "\\.git\\" -and
        $_.FullName -notmatch "\\dist\\" -and
        $_.FullName -notmatch "\\build\\" -and
        $_.Extension -in @(".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css")
    }

$planejamentoNamedFiles = $allCodeFiles | Where-Object {
    $_.Name -match "planejamento|planejamentos|Planejamento|Planejamentos|planify"
}

if ($planejamentoNamedFiles.Count -eq 0) {
    Add-Report "Nenhum arquivo com nome relacionado a Planejamentos encontrado."
} else {
    $planejamentoNamedFiles |
        Sort-Object FullName |
        ForEach-Object {
            Add-Report "- $(Get-ShortPath $_.FullName) | Modificado: $($_.LastWriteTime) | $($_.Length) bytes"
        }
}

Add-Section "7. Imports do arquivo que provavelmente renderiza /planejamentos"

$primaryPage = Join-Path $Root "src\app\planejamentos\page.tsx"

if (!(Test-Path $primaryPage) -and $foundRouteCandidates.Count -gt 0) {
    $primaryPage = $foundRouteCandidates[0]
}

if (Test-Path $primaryPage) {
    Add-Report "Arquivo analisado: $(Get-ShortPath $primaryPage)"
    Add-Report ""
    $pageLines = Get-Content $primaryPage

    $imports = $pageLines | Select-String -Pattern '^\s*import\s+.*from\s+["''](.+)["'']' -AllMatches

    if ($imports.Count -eq 0) {
        Add-Report "Nenhum import encontrado no padrão esperado."
    } else {
        foreach ($imp in $imports) {
            Add-Report "Linha $($imp.LineNumber): $($imp.Line.Trim())"
        }
    }

    Add-Report ""
    Add-Report "Export default encontrado?"
    $exports = $pageLines | Select-String -Pattern "export\s+default|function\s+Planej|const\s+Planej|Planejamentos"
    if ($exports.Count -eq 0) {
        Add-Report "Nenhum export/default/componente Planejamentos óbvio encontrado."
    } else {
        $exports | ForEach-Object {
            Add-Report "Linha $($_.LineNumber): $($_.Line.Trim())"
        }
    }
} else {
    Add-Report "Não foi possível identificar um arquivo primário para /planejamentos."
}

Add-Section "8. Busca por strings críticas no código"

$patterns = @(
    "Língua Portuguesa",
    "Lingua Portuguesa",
    "Língua Espanhola",
    "Lingua Espanhola",
    "Espanhol",
    "Espanhola",
    "Arte",
    "Ciências",
    "Ciencias",
    "BNCC",
    "habilidades",
    "habilidade",
    "conteúdo",
    "conteudo",
    "conteúdos",
    "conteudos",
    "conteudosSugeridos",
    "conteúdosSugeridos",
    "componentesCurriculares",
    "componentes",
    "Componente curricular",
    "componenteCurricular",
    "conteudoSelecionado",
    "conteudoDigitado",
    "habilidadesSelecionadas",
    "habilidadesSugeridas"
)

foreach ($pattern in $patterns) {
    Add-Report ""
    Add-Report "--- PADRÃO: $pattern ---"

    $matches = Select-String -Path $allCodeFiles.FullName -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue

    if ($null -eq $matches -or $matches.Count -eq 0) {
        Add-Report "Nenhuma ocorrência."
    } else {
        Add-Report "Total de ocorrências: $($matches.Count)"
        $matches | Select-Object -First 80 | ForEach-Object {
            Add-Report "$(Get-ShortPath $_.Path):$($_.LineNumber): $($_.Line.Trim())"
        }

        if ($matches.Count -gt 80) {
            Add-Report "... resultado limitado a 80 linhas para este padrão."
        }
    }
}

Add-Section "9. Possíveis constantes/listas de componentes curriculares e conteúdos"

$constantPatterns = @(
    "const\s+\w*component\w*",
    "const\s+\w*Componente\w*",
    "componentesCurriculares\s*=",
    "COMPONENTES",
    "componentes\s*:",
    "conteudosSugeridos\s*=",
    "conteúdosSugeridos\s*=",
    "SUGEST",
    "sugestoes",
    "sugestões"
)

foreach ($regex in $constantPatterns) {
    Add-Report ""
    Add-Report "--- REGEX: $regex ---"

    $matches = Select-String -Path $allCodeFiles.FullName -Pattern $regex -ErrorAction SilentlyContinue

    if ($null -eq $matches -or $matches.Count -eq 0) {
        Add-Report "Nenhuma ocorrência."
    } else {
        Add-Report "Total de ocorrências: $($matches.Count)"
        $matches | Select-Object -First 80 | ForEach-Object {
            Add-Report "$(Get-ShortPath $_.Path):$($_.LineNumber): $($_.Line.Trim())"
        }

        if ($matches.Count -gt 80) {
            Add-Report "... resultado limitado a 80 linhas para este regex."
        }
    }
}

Add-Section "10. APIs e lógica BNCC relacionadas a Planejamentos"

$apiRelatedFiles = $allCodeFiles | Where-Object {
    $_.FullName -match "\\app\\api\\" -or
    $_.FullName -match "\\src\\lib\\" -or
    $_.FullName -match "\\lib\\" -or
    $_.FullName -match "\\data\\" -or
    $_.FullName -match "\\services\\"
}

$apiMatches = Select-String -Path $apiRelatedFiles.FullName -Pattern "planejamentos|BNCC|bncc|habilidades|habilidade|gerar|conteudo|conteúdo" -ErrorAction SilentlyContinue

if ($null -eq $apiMatches -or $apiMatches.Count -eq 0) {
    Add-Report "Nenhuma lógica/API relacionada encontrada pelos padrões."
} else {
    Add-Report "Total de ocorrências em arquivos de API/lib/data/services: $($apiMatches.Count)"
    $apiMatches | Select-Object -First 180 | ForEach-Object {
        Add-Report "$(Get-ShortPath $_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

    if ($apiMatches.Count -gt 180) {
        Add-Report "... resultado limitado a 180 linhas."
    }
}

Add-Section "11. Duplicidade provável de componentes de Planejamentos"

$componentMatches = Select-String -Path $allCodeFiles.FullName -Pattern "function\s+Planej|const\s+Planej|export\s+default\s+function\s+Planej|PlanejamentosPage|PlanejamentoPage|GeradorPlanejamento|PlanejamentosClient" -ErrorAction SilentlyContinue

if ($null -eq $componentMatches -or $componentMatches.Count -eq 0) {
    Add-Report "Nenhuma duplicidade óbvia encontrada por nome de componente."
} else {
    $componentMatches | ForEach-Object {
        Add-Report "$(Get-ShortPath $_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
}

Add-Section "12. Verificação do build gerado em .next, se existir"

$nextPlanejamentosCandidates = @(
    ".next\server\app\planejamentos\page.js",
    ".next\server\app\planejamentos\page_client-reference-manifest.js",
    ".next\static"
)

foreach ($relative in $nextPlanejamentosCandidates) {
    $path = Join-Path $Root $relative
    if (Test-Path $path) {
        $item = Get-Item $path
        Add-Report "EXISTE: $relative | Modificado: $($item.LastWriteTime)"
    } else {
        Add-Report "NÃO existe: $relative"
    }
}

$nextServerPage = Join-Path $Root ".next\server\app\planejamentos\page.js"

if (Test-Path $nextServerPage) {
    Add-Report ""
    Add-Report "Busca dentro do build .next/server/app/planejamentos/page.js:"

    foreach ($pattern in @("Língua Espanhola", "Espanhol", "componentesCurriculares", "conteudosSugeridos", "BNCC", "habilidades")) {
        $matches = Select-String -Path $nextServerPage -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
        if ($matches.Count -gt 0) {
            Add-Report "Build contém '$pattern': SIM ($($matches.Count) ocorrência(s))"
        } else {
            Add-Report "Build contém '$pattern': NÃO"
        }
    }
} else {
    Add-Report "Arquivo buildado específico de /planejamentos não encontrado. Rode npm run build depois, se necessário."
}

Add-Section "13. Arquivos modificados recentemente"

$recentFiles = $allCodeFiles |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 60

$recentFiles | ForEach-Object {
    Add-Report "$(Get-ShortPath $_.FullName) | Modificado: $($_.LastWriteTime) | $($_.Length) bytes"
}

Add-Section "14. Resumo objetivo para decisão"

Add-Report "Verifique principalmente:"
Add-Report "1. Se src\app\planejamentos\page.tsx existe e é o arquivo de rota real."
Add-Report "2. Se ele importa outro componente, como PlanejamentosClient, GeradorPlanejamento ou similar."
Add-Report "3. Se as opções antigas aparecem em outro arquivo importado, não diretamente na page.tsx."
Add-Report "4. Se existem duas versões da tela: uma em src/app e outra em app/pages/components."
Add-Report "5. Se Língua Espanhola foi adicionada em arquivo que não é usado pela rota real."
Add-Report "6. Se conteudosSugeridos ou componentesCurriculares aparecem duplicados."
Add-Report "7. Se .next ainda não contém as mudanças esperadas após build."
Add-Report "8. Se Git/Vercel pode estar usando branch diferente da branch local atual."

Add-Report ""
Add-Report "FIM DO RELATÓRIO."

Write-Host ""
Write-Host "Diagnóstico concluído." -ForegroundColor Green
Write-Host "Relatório gerado em:" -ForegroundColor Cyan
Write-Host $ReportPath -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora abra/copie o conteúdo deste arquivo e me envie o resultado:" -ForegroundColor Cyan
Write-Host "C:\planify\scripts\diagnostico-planejamentos-9-20-12-report.txt" -ForegroundColor Yellow
Write-Host ""
