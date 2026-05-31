# Planify — 9.15.12 — Biblioteca Admin sem login duplicado

## Problema

Depois que o Admin foi liberado, a página `/admin/biblioteca` ainda mostrava:

```text
Faça login como administrador para continuar.
```

Isso não fazia sentido, porque se a página abriu, a guarda server-side já validou o admin.

## Correção

Removido o bloco interno de login duplicado dentro do formulário.

Agora o fluxo é:

```text
/admin/biblioteca abriu
→ admin validado
→ formulário pronto para cadastrar material
```

## Segurança

A validação real continua na API:

```text
/api/admin/biblioteca/materiais
```

Então, mesmo sem o aviso visual, usuário comum não consegue cadastrar material.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Faça login como admin.
2. Abra /admin/biblioteca.
3. Confirme que não aparece pedido de login dentro da página.
4. Preencha o formulário.
5. Anexe um arquivo.
6. Clique em Cadastrar na Biblioteca.
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
Login admin
```
