# Planify — 9.15.9 — Login limpo Usuário/Admin

## Problema corrigido

A tela `/login?mode=admin` estava mostrando textos do login de professor junto com textos do admin.

Isso deixava a experiência confusa e pouco profissional.

## Nova regra

```text
/login
→ login de usuário/professor
→ sem opção admin

/admin
→ tela curta de acesso restrito
→ Entrar como Admin

/login?mode=admin&redirect=/admin
→ login administrativo
→ sem texto de professor
→ sem planos
→ sem criar conta
```

## Importante

A autenticação continua usando o Supabase.

A diferença é:

```text
Login de professor exige plano premium.
Login admin valida permissão admin e não depende de plano premium.
```

## Arquivos alterados

```text
src/lib/auth/session-client.ts
src/app/login/page.tsx
src/app/login/LoginClient.tsx
src/components/AdminAccessGate.tsx
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
1. Clique Entrar.
   Deve abrir login de usuário sem Admin.

2. Clique Admin.
   Deve abrir tela curta de acesso restrito.

3. Clique Entrar como Admin.
   Deve abrir login administrativo limpo.

4. Entre com e-mail admin.
   Deve liberar /admin.

5. Entre com usuário comum em login admin.
   Deve mostrar sem permissão.
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
```
