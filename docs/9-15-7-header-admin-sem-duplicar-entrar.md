# Planify — 9.15.7 — Header Admin sem duplicar Entrar

## Problema

O topo tinha:

```text
Entrar no menu central
Entrar no canto direito
```

E não havia um caminho claro para entrar como Admin.

## Correção

O header agora fica com:

```text
Menu central:
Início
Planos
Contato

Ações:
Admin
Entrar
Acessar painel
```

## Fluxo Admin

```text
Clica Admin
→ abre /admin
→ se não estiver logado, mostra tela de login administrativo
→ botão Entrar como Admin
→ login redireciona de volta para /admin
```

Usuário comum não vê opções internas do Admin.

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Marketplace
Biblioteca
Downloads anual/trimestral
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
