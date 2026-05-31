# Planify — 9.15 — Biblioteca Premium via Admin + Auditoria

## Objetivo

Permitir que o administrador cadastre materiais pedagógicos oficiais com anexo para aparecerem na Biblioteca Premium.

## Novas páginas/rotas

```text
/admin/biblioteca
/api/admin/biblioteca/materiais
/api/biblioteca/materiais
```

## O que foi adicionado

```text
- Página Admin específica para Biblioteca.
- Upload de arquivo pelo administrador.
- Cadastro de título, descrição, etapa, categoria, componente, finalidade e tags.
- Salvamento de arquivo no Supabase Storage.
- Salvamento de metadados na tabela library_materials.
- Listagem na Biblioteca Premium para usuários com acesso premium.
- Download por URL assinada.
- Remoção de material pelo Admin.
- Auditoria pré-GitHub.
```

## SQL obrigatório

Antes de testar o upload, rode no Supabase SQL Editor:

```text
C:\planify\database\09-15-biblioteca-premium-admin.sql
```

Esse SQL cria:

```text
public.library_materials
bucket biblioteca-materiais
índices
RLS fechado para acesso direto
```

A aplicação usa APIs server-side com service role e validação por cookie premium/admin.

## Teste

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

Depois:

```text
1. Abrir /admin/biblioteca
2. Cadastrar um material com anexo
3. Abrir /biblioteca
4. Confirmar se o material aparece
5. Baixar o anexo
6. Abrir no Editor
```

## Auditoria pré-GitHub

Depois do build:

```powershell
node scripts\planify\auditoria-pre-github.cjs
```

Resultado:

```text
C:\planify\tmp\auditoria-pre-github.md
```

## O que não foi alterado

```text
DOCX oficial
Editor validado
Planejamentos
BNCC
Stripe
Login
Marketplace
```
