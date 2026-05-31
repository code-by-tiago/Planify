# Planify — 9.15.10 — Admin permission fix

## Problema

O login era realizado, mas o sistema mostrava:

```text
Login realizado, mas esta conta não possui permissão de administrador.
```

Isso acontecia porque a validação admin dependia do e-mail chegar em um formato específico dentro do `verifyPremiumAccess`.

## Correção

Agora o Planify valida o admin por múltiplas fontes:

```text
1. premium access
2. JWT do token Supabase
3. Supabase auth.getUser(token)
4. PLANIFY_ADMIN_EMAIL
5. fallback seguro para ts162351@gmail.com
```

## Arquivos alterados

```text
src/server/auth/admin-access.ts
src/app/api/admin/status/route.ts
scripts/planify/admin/definir-admin-email.cjs
```

## Variável ajustada

O instalador força:

```text
PLANIFY_ADMIN_EMAIL=ts162351@gmail.com
```

Se quiser outro e-mail:

```powershell
.\install-9-15-10-admin-permission-fix.ps1 -AdminEmail "seu-email@email.com"
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

Depois é obrigatório parar o servidor antigo e iniciar de novo:

```powershell
npm run dev
```

## Teste

```text
1. Abra /sair para sair da conta antiga.
2. Abra /admin.
3. Clique Entrar como Admin.
4. Entre com ts162351@gmail.com.
5. Deve liberar /admin.
```

## Verificação técnica

Depois do login, abra:

```text
/api/admin/status
```

Esperado:

```json
{
  "authenticated": true,
  "isAdmin": true,
  "email": "ts162351@gmail.com"
}
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Biblioteca
Marketplace
Downloads anual/trimestral
Login visual
```
