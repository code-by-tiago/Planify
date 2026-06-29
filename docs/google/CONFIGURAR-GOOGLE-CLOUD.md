# Configurar Google Cloud para Planify

Este guia prepara a integracao Google do Planify para **Google Docs**, **Drive**,
**Forms**, **Slides** e publicacao revisada no **Google Classroom**.

## Principio do Classroom

O Planify usa OAuth do professor, salva tokens somente no backend e publica no
Classroom apenas depois da confirmacao final no modal do Editor.

Fluxo correto:

1. O professor gera/revisa o material no Planify.
2. O Planify gera DOCX/PDF como ja acontece hoje.
3. O backend salva o arquivo no Google Drive do professor.
4. O professor escolhe uma ou varias turmas reais no modal.
5. O backend publica via Google Classroom API com o arquivo do Drive anexado.

Nada e publicado automaticamente no primeiro clique.

## 1. APIs necessarias

Ative no Google Cloud Console:

| API | Uso |
|-----|-----|
| Google Drive API | Salvar DOCX/PDF no Drive do professor |
| Google Classroom API | Listar turmas e publicar material/atividade apos confirmacao |
| Google Forms API | Criar formularios a partir de provas/listas |
| Google Slides API | Exportar apresentacoes quando aplicavel |

## 2. Tela de consentimento OAuth

Em **APIs e servicos > Tela de consentimento OAuth**:

1. Tipo de usuario: Externo ou Interno, conforme o dominio da escola.
2. Configure nome do app, e-mail de suporte, dominio autorizado, Politica de Privacidade e Termos.
3. Declare somente os escopos necessarios:

| Escopo | Uso no Planify |
|--------|----------------|
| `https://www.googleapis.com/auth/drive.file` | Salvar arquivos criados pelo Planify no Drive do professor |
| `https://www.googleapis.com/auth/classroom.courses.readonly` | Listar turmas em que a conta conectada e professora |
| `https://www.googleapis.com/auth/classroom.courseworkmaterials` | Publicar como material no Classroom |
| `https://www.googleapis.com/auth/classroom.coursework.students` | Publicar como atividade no Classroom |
| `https://www.googleapis.com/auth/forms.body` | Criar Google Forms quando o professor exporta provas/listas |
| `https://www.googleapis.com/auth/userinfo.email` | Confirmar a conta Google conectada |

## 3. Rotas OAuth e Classroom

Rotas usadas pelo Planify:

```text
/api/google/classroom/auth
/api/google/classroom/callback
/api/google/classroom/courses
/api/google/classroom/share
```

`/api/google/classroom/auth` e `/api/google/classroom/callback` reaproveitam o
OAuth seguro existente, com `state` assinado no backend para prevenir CSRF.

## 4. Credenciais OAuth

Crie um **ID do cliente OAuth** do tipo Aplicativo da Web.

Origens JavaScript autorizadas:

```text
http://localhost:3000
https://seudominio.com
```

URIs de redirecionamento:

```text
http://localhost:3000/api/google/oauth/callback
https://seudominio.com/api/google/oauth/callback
```

## 5. Variaveis de ambiente

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_OAUTH_STATE_SECRET=
```

Em producao, `GOOGLE_REDIRECT_URI` deve apontar para o dominio real.
`GOOGLE_OAUTH_STATE_SECRET` e obrigatorio em producao.

## 6. Supabase

Execute a migration:

```text
supabase/migrations/20260604_google_integrations.sql
```

Ela cria a tabela de tokens Google no servidor. Tokens nunca ficam no frontend.

## 7. Teste do Classroom

1. Rode `npm run dev`.
2. Faca login no Planify.
3. Abra um material no Editor.
4. Clique em **Enviar ao Classroom**.
5. Autorize a conta Google do professor, preferencialmente educacional.
6. No modal, revise titulo/descricao, escolha Material ou Atividade e selecione as turmas.
7. Clique em **Publicar**.
8. Confirme o link **Abrir no Google Classroom**.

## 8. Problemas comuns

| Sintoma | O que verificar |
|---------|-----------------|
| `redirect_uri_mismatch` | `GOOGLE_REDIRECT_URI` identica a URI cadastrada no Console |
| Sem turmas | Conta Google precisa ser professora de turma ativa no Classroom |
| Falta permissao | Reautorize Google Classroom no modal |
| API negada | Confirme se Google Classroom API esta ativa no projeto |
| Reenvio bloqueado | Aguarde 3 minutos ou altere titulo/conteudo/turmas |
| Google Forms nao abre | Confirme escopo `forms.body` e API Forms ativa |

## Checklist

- [ ] Drive API ativa
- [ ] Classroom API ativa
- [ ] Forms API ativa se usar Google Forms
- [ ] Slides API ativa se usar apresentacoes
- [ ] Escopos OAuth declarados conforme tabela
- [ ] Redirect URI configurada
- [ ] Variaveis `GOOGLE_*` no ambiente
- [ ] Migration `google_integrations` aplicada
- [ ] Teste: material no Planify -> Drive -> Classroom publicado apos confirmacao
