# Teachy page archetypes → Planify mapping

Benchmark source: [teachy.com.br](https://www.teachy.com.br/pt-BR) (jun/2026).  
See also [`CAPTURED_PATTERNS.md`](CAPTURED_PATTERNS.md).

## Flow

```
MarketingHome → ToolsCatalog → Login/Planos → AppHome → ToolStudio / Planning / Grading
```

## Archetype map

| Teachy archetype | Visual structure | Planify route | Planify template |
|------------------|------------------|---------------|------------------|
| **MarketingHome** | Hero + product demo tabs; stats; ecosystem; footer | `/` | `TeachyMarketingLayout` |
| **ToolsCatalog** | Public grid: icon · title · line · Acessar | `/ferramentas` | `TeachyCatalogLayout` |
| **Auth / Planos** | Marketing shell + form/pricing | `/login`, `/planos`, `/cadastro` | `TeachyMarketingLayout` |
| **AppHome** | Sidebar categories + search + tool grid + recents | `/dashboard` | `TeachyAppShell` + `TeachyStudioHome` |
| **ToolStudioPage** | Header · config \| preview · CTA créditos · export dock | `/dashboard?tipo=*`, `/materiais`, etc. | `TeachyToolStudioPage` |
| **PlanningPage** | Wizard steps + preview | `/dashboard?secao=planejamentos` | `TeachyToolStudioPage` |
| **GradingPage** | Upload · nota · feedback | `/dashboard?secao=correcao`, `/correcao` | `TeachyToolStudioPage` |
| **SectionHub** | List \| detail or horizontal rows | biblioteca, histórico, banco, marketplace | `TeachySectionHub` |
| **CommunityHub** | Feed 2-col + sidebar | `/comunidade`, `/dashboard?secao=marketplace` | `TeachySectionHub` + docente polish |

## Wireframes (ASCII)

### MarketingHome

```
┌─────────────────────────────────────────────┐
│ Logo          Nav              Entrar | CTA │
├─────────────────────────────────────────────┤
│ HEADLINE (uppercase)          │ [Tab bar]   │
│ subheadline                   │ ┌─────────┐ │
│ [Começar grátis]              │ │ Mock UI │ │
│                               │ │ animado │ │
│                               │ └─────────┘ │
├─────────────────────────────────────────────┤
│ stats strip (4 numbers)                     │
├─────────────────────────────────────────────┤
│ Ecossistema (Professores · Escolas)         │
├─────────────────────────────────────────────┤
│ 16 ferramentas grid → /ferramentas          │
└─────────────────────────────────────────────┘
```

### ToolsCatalog

```
┌─────────────────────────────────────────────┐
│ Public header                               │
│ Hero: "Crie conteúdo pedagógico..."         │
├─────────────────────────────────────────────┤
│ [Categoria A]                               │
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │ icon │ │ icon │ │ icon │  …16 cards       │
│ │ Acess│ │ Acess│ │ Acess│                  │
│ └──────┘ └──────┘ └──────┘                  │
└─────────────────────────────────────────────┘
```

### AppHome (logged)

```
┌────────┬────────────────────────────────────┐
│ Sidebar│ Search + tema opcional             │
│ cats   │ Category pills                     │
│        │ ┌────┐ ┌────┐ ┌────┐ tool cards    │
│        │ Créditos · plano · referral         │
└────────┴────────────────────────────────────┘
```

### ToolStudioPage

```
┌─────────────────────────────────────────────┐
│ ← Tool title · subtitle          créditos   │
├──────────────────┬──────────────────────────┤
│ Disciplina       │ empty → skeleton →       │
│ Ano · Assunto    │ typed preview            │
│ chips 5/10/15/20 │                          │
│ [Criar (X créd)] │                          │
├──────────────────┴──────────────────────────┤
│ Export: Editor · DOCX · Classroom · …         │
└─────────────────────────────────────────────┘
```

## Planify-only (not cloned from Teachy)

- Portal alunos / famílias — **omitido** (professor-only)
- 60 ferramentas extras — **omitido** (16 Planify tools)
- Stripe, auth, DOCX pipeline, BNCC APIs — **inalterados**

## Quality gate

Per screen: *"Navego como na Teachy?"* — same page type, Planify brand (coruja, `#0891b2`).
