# Planify — 9.15.16 — Acesso do proprietário à Biblioteca Premium

## Problema

Depois de cadastrar material no Admin, ao sair da área admin e abrir `/biblioteca`, o sistema pedia login premium.

Isso está correto para usuários comuns, mas o dono do site precisa conseguir testar a Biblioteca Premium sem pagar assinatura para si mesmo.

## Correção

Agora o e-mail do dono/admin também é reconhecido como acesso premium para teste interno:

```text
PLANIFY_ADMIN_EMAIL
ADMIN_EMAIL
NEXT_PUBLIC_ADMIN_EMAIL
ts162351@gmail.com
```

## O que muda

```text
Dono/admin:
pode entrar em /biblioteca como usuário e ver os materiais cadastrados.

Usuário comum:
continua precisando de plano ativo.

Biblioteca:
continua mostrando somente materiais reais publicados em /admin/biblioteca.
```

## Arquivos alterados

```text
src/app/api/access/status/route.ts
src/app/api/biblioteca/materiais/route.ts
src/lib/auth/session-client.ts
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
1. Faça login normal em /login com ts162351@gmail.com.
2. Abra /biblioteca.
3. O material publicado pelo Admin deve aparecer.
4. Teste com outro usuário sem plano.
5. O outro usuário deve continuar bloqueado.
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Biblioteca Admin
Admin Session
Marketplace
Downloads anual/trimestral
```
