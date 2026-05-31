# Planify — 9.15.14 — Biblioteca Admin simples definitiva

## Problemas corrigidos

```text
1. Formulário da Biblioteca Admin estava grande demais.
2. Cadastro exigia informações pedagógicas demais para um simples upload.
3. Dentro da área Admin ainda havia sensação de login duplicado.
4. API era rígida demais e podia recusar campos ausentes.
```

## Nova regra

O admin cadastra material com o essencial:

```text
Título
Descrição curta
Etapa
Ano/Série
Componente
Tipo de material
Tema/conteúdo
Tags opcionais
Arquivo
Publicado ou rascunho
```

## Campos avançados

A API preenche automaticamente:

```text
Área do conhecimento
Categoria
Finalidade
Nível
Duração
Observações
Habilidades BNCC
```

quando esses campos não vierem.

## Segurança

A segurança continua na API:

```text
/api/admin/biblioteca/materiais
```

Ela usa `requireAdminApi`.

## SQL opcional

Se o cadastro der erro de tabela, coluna ou bucket, rode no Supabase SQL Editor:

```text
C:\planify\database\09-15-14-biblioteca-admin-simples-definitiva.sql
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
1. Entre como Admin.
2. Abra /admin/biblioteca.
3. Preencha apenas:
   - título
   - descrição
   - etapa
   - ano/série
   - componente
   - tipo
   - arquivo
4. Clique Cadastrar material.
5. Veja se apareceu na lista.
6. Abra /biblioteca e confira se aparece para o usuário premium.
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
Sessão Admin por aba
Botão Sair Admin
```
