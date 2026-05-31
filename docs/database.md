# Planify — Banco de Dados Supabase

Este documento descreve a base de dados do Planify.

## Arquivo SQL

Execute manualmente no SQL Editor do Supabase:

```text
supabase/planify-schema.sql
```

Não execute automaticamente pelo projeto Next.js.

## Regra principal de acesso

O Planify usa a função:

```sql
public.can_access_app()
```

Ela libera acesso somente para:

```text
1. Dono/admin ativo.
2. Usuário com assinatura ativa em plano pago.
```

Essa regra garante que usuário comum só acesse a área interna se tiver plano ativo e pago.

## Tabelas principais

```text
profiles
subscriptions
plans
documents
lesson_plans
teaching_materials
bncc_skills
user_history
marketplace_items
library_items
```

## profiles

Tabela de perfil vinculada ao Supabase Auth.

Campos principais:

```text
id
email
full_name
role
status
is_admin
is_owner
stripe_customer_id
created_at
updated_at
```

O dono do site deve ter:

```text
role = owner
status = active
is_admin = true
is_owner = true
```

## plans

Tabela dos planos comerciais.

## subscriptions

Tabela de assinaturas dos usuários.

Acesso premium exige:

```text
status = active
plano pago
período válido
```

## documents

Tabela central para documentos gerados, editados e exportados.

## lesson_plans

Tabela para planejamentos anuais e trimestrais.

## teaching_materials

Tabela para atividades, provas, apostilas, jogos, projetos e sequências.

## bncc_skills

Tabela para habilidades BNCC oficiais.

## user_history

Tabela para histórico de ações do usuário.

## marketplace_items

Tabela para materiais publicados por professores.

## library_items

Tabela para biblioteca premium controlada pelo dono/admin.

## RLS

Todas as tabelas têm Row Level Security ativado.

Regras principais:

```text
Usuário acessa apenas dados próprios.
Admin/dono acessa gestão geral.
Conteúdo premium exige assinatura ativa.
Planos ativos podem ser lidos publicamente.
Biblioteca é administrada por admin/dono.
BNCC é acessada por usuários com acesso ativo.
```

## Importante

Este arquivo não contém chaves reais e não executa nada automaticamente.
