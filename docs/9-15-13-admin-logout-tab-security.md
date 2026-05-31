# Planify — 9.15.13 — Admin logout + segurança por aba

## Problema

Depois de fechar a página e rodar `npm run dev`, o Admin continuava liberado.

Isso acontecia porque o cookie admin persistia no navegador.

## Correção

Agora existem duas camadas:

```text
1. Cookie admin server-side: planify_admin_access
2. Trava de aba no navegador: sessionStorage planify_admin_tab_unlocked
```

## Resultado

```text
Login Admin feito na aba atual
→ Admin liberado

Navega entre /admin e /admin/biblioteca na mesma aba
→ continua liberado

Fecha a aba/página e abre depois
→ sessionStorage some
→ Admin limpa o cookie e pede login novamente
```

## Botão Sair Admin

Foi criado:

```text
src/components/AdminLogoutButton.tsx
```

Ele:

```text
- remove sessionStorage
- chama DELETE /api/admin/session
- volta para /admin bloqueado
```

## Barra Admin

Foi criada:

```text
src/components/AdminSecurityBar.tsx
```

Com:

```text
Admin
Biblioteca Admin
Início
Sair Admin
```

## Arquivos alterados

```text
src/app/api/admin/session/route.ts
src/components/AdminLogoutButton.tsx
src/components/AdminTabSessionGuard.tsx
src/components/AdminSecurityBar.tsx
src/app/admin/page.tsx
src/app/admin/biblioteca/page.tsx
src/app/login/LoginClient.tsx
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
1. Abra /admin.
2. Faça login como Admin.
3. Acesse /admin/biblioteca.
4. Veja o botão Sair Admin.
5. Clique Sair Admin.
6. Confirme que pediu login de novo.
7. Faça login novamente.
8. Feche a aba.
9. Abra /admin novamente.
10. Deve pedir login admin novamente.
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Biblioteca pública
Marketplace
Downloads anual/trimestral
```
