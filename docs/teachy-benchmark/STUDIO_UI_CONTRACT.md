# Studio UI contract (Planify Premium)

Quality gate for Teachy-grade structural clone with Planify brand.

## Page templates

| Template | Path |
|----------|------|
| `TeachyMarketingLayout` | `src/components/teachy-layout/TeachyMarketingLayout.tsx` |
| `TeachyCatalogLayout` | `src/components/teachy-layout/TeachyCatalogLayout.tsx` |
| `TeachyAppShell` | `src/components/teachy-layout/TeachyAppShell.tsx` |
| `TeachyToolStudioPage` | `src/components/teachy-layout/TeachyToolStudioPage.tsx` |
| `TeachySectionHub` | `src/components/teachy-layout/TeachySectionHub.tsx` |

## Design tokens

- CSS: `src/styles/planify-premium.css` (`pf-*` prefix)
- Scope: `.pf-ecosystem-scope` hides legacy `PlanifyPageHero` when embedded in app shell
- Canvas: `#f0f4f8` · Accent: `#0891b2` · Surface: white

## Tool studio contract

1. Pedagogical subtitle under tool title
2. Fields: Disciplina · Ano · Assunto (BNCC autocomplete unchanged)
3. Quantity chips when applicable
4. Single primary CTA with credit cost
5. Right column: empty → skeleton → typed preview
6. Post-generation: unified `ExportDock`

## Mobile

- Sidebar drawer
- Config / Result tabs
- Sticky bottom CTA on forms

## Verification

```bash
npm run verify:go-live
npm run typecheck
npm run build
npm run test:e2e   # viewports 390 / 768 / 1280
```
