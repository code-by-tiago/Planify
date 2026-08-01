# Correção — Dashboard preso no login por auth antigo

## Problema encontrado

O arquivo:

```text
src/app/dashboard/page.tsx
```

importava:

```text
requirePremiumAccess
signOut
getCurrentUser
getUserDisplayName
```

Esses helpers antigos faziam redirect server-side e causavam loop:

```text
login valida premium/admin → tenta abrir dashboard → dashboard chama auth antigo → volta para login
```

## Correção

```text
1. Dashboard não usa mais auth antigo.
2. Dashboard é liberado pelo middleware + cookie premium.
3. Helpers antigos foram neutralizados para não redirecionarem server-side.
4. Botão sair usa /sair.
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
