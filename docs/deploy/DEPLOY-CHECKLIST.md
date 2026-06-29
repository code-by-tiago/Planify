# Planify | Deploy checklist

## Antes do GitHub

1. Rodar `npm run verify:go-live` (suite completa de smoke + checks estáticos).
2. Rodar `npm run build` local.
2. Rodar auditoria anti-vazamento.
3. Confirmar que .env.local nao aparece no git status.
4. Confirmar que os modelos DOCX oficiais estao presentes.
5. Confirmar que upload/download de Biblioteca e Marketplace funcionam.

## GitHub

1. Criar repositorio privado no GitHub.
2. Adicionar remote.
3. Fazer push da branch principal.
4. Nunca subir .env.local.

## Deploy

1. Configurar variaveis de ambiente no painel do provedor.
2. Configurar Supabase URLs, service role e anon key.
3. Configurar Stripe keys, prices e webhook.
4. Configurar admin email.
5. Rodar build no deploy.
6. Testar login, planos, premium gate, planejamentos, biblioteca, marketplace e editor.

## Google Drive/Classroom

Validar integracao segura:
1. OAuth start/callback.
2. Exportar DOCX/PDF ja gerado para Drive.
3. Listar turmas reais via Google Classroom API.
4. Publicar material/atividade somente apos confirmacao no modal.
4. Manter download DOCX como fallback.
