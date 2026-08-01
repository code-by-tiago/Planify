# Planify

Plataforma pedagógica brasileira — materiais, planejamentos BNCC e exportação DOCX/PDF.

![CI](https://github.com/code-by-tiago/Planify/actions/workflows/ci.yml/badge.svg)

## Desenvolvimento

```bash
npm ci
npm run verify:material-quality
npm run typecheck
npm run build
```

## CI

Push e pull requests para `main` executam smoke de qualidade, typecheck e build de produção (`.github/workflows/ci.yml`).
