# Planify — 9.15.3 — Biblioteca sem materiais fictícios

## Correção

A Biblioteca Premium não deve exibir materiais simulados.

Esta etapa remove:

```text
- matriz de exemplo
- atividades fictícias
- download JSON de exemplo
- qualquer fallback de material fake
```

## Nova regra

A página `/biblioteca` agora exibe apenas:

```text
materiais reais cadastrados pelo administrador em /admin/biblioteca
```

## Seed de pacotes iniciais (produção)

O cache pedagógico (`npm run seed:pedagogical-themes`) **não** preenche a Biblioteca.
Para cadastrar materiais reais de demonstração (DOCX no bucket `biblioteca-materiais`):

```powershell
cd C:\planify
npm run seed:biblioteca-pacotes
```

Requer `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`.
O script é idempotente: ignora pacotes com mesmo título + componente.

## Quando não houver upload

A página mostra um estado vazio profissional:

```text
Biblioteca vazia
Nenhum material real foi cadastrado ainda.
```

## Botões

```text
Abrir no Editor
Baixar anexo real
```

O botão de download só aparece quando houver link real do Supabase Storage.

## O que não foi alterado

```text
DOCX oficial
Editor validado
Planejamentos
BNCC
Stripe
Marketplace
Admin guard
Uploads Admin
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Abra /biblioteca antes de cadastrar materiais.
2. Confirme que não há material fictício.
3. Cadastre material em /admin/biblioteca.
4. Volte em /biblioteca.
5. Confirme que apenas o material real apareceu.
```
