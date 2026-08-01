# Correção — Middleware duplicado travando login

## Problema encontrado

O projeto tinha múltiplos middlewares:

```text
middleware.ts
src/middleware.ts
src/lib/supabase/middleware.ts
```

Um middleware antigo ainda redirecionava para:

```text
/login?redirectTo=%2Fdashboard
```

Isso causava loop mesmo depois do login premium/admin ser liberado.

## Correção aplicada

```text
middleware.ts passou a ser o middleware oficial.
src/middleware.ts ficou igual ao middleware oficial.
src/lib/supabase/middleware.ts foi neutralizado para não redirecionar mais.
```

## Teste

```text
1. Parar npm run dev
2. Remover .next
3. npm run build
4. npm run dev
5. Abrir /sair
6. Abrir /login
7. Entrar com admin
8. Deve abrir /dashboard
```
