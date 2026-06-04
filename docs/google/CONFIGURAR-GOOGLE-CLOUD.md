# Configurar Google Cloud para Planify (Drive + Classroom)

Este guia prepara o projeto Google para o botão **Enviar ao Google Classroom** do Planify.

Tempo estimado: **20–40 minutos** (na primeira vez).

---

## 1. Criar o projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. No topo, clique no seletor de projeto → **Novo projeto**.
3. Nome sugerido: `Planify Produção` (ou `Planify Dev` para testes).
4. Clique em **Criar** e aguarde alguns segundos.
5. Selecione esse projeto no seletor do topo.

Anote o **ID do projeto** (ex.: `planify-prod-123456`) — aparece no painel do projeto.

---

## 2. Ativar as APIs necessárias

Menu ☰ → **APIs e serviços** → **Biblioteca**. Pesquise e **ative** cada uma:

| API | Para quê |
|-----|----------|
| **Google Drive API** | Enviar o DOCX gerado pelo Planify |
| **Google Classroom API** | Listar turmas e publicar o material |

Depois de ativar, confira em **APIs e serviços → APIs ativadas** se as duas aparecem.

---

## 3. Tela de consentimento OAuth

Menu ☰ → **APIs e serviços** → **Tela de consentimento OAuth**.

1. Tipo de usuário:
   - **Externo** — se professores usam Gmail pessoal ou contas fora de um domínio único.
   - **Interno** — só se **todos** os usuários forem do mesmo Google Workspace (mesmo domínio).
2. Preencha:
   - Nome do app: `Planify`
   - E-mail de suporte: seu e-mail
   - Logotipo: opcional
   - Domínios autorizados (produção): `seudominio.com` (sem `https://`)
   - Página inicial: `https://seudominio.com`
   - Política de privacidade e Termos: URLs reais (obrigatório em produção)
3. **Escopos** → Adicionar escopos → inclua manualmente (se não aparecerem na lista curta):
   - `.../auth/drive.file`
   - `.../auth/classroom.courses.readonly`
   - `.../auth/classroom.coursework.me`
4. **Usuários de teste** (enquanto o app estiver em *Testando*):
   - Adicione o Gmail de **cada professor** que for testar (incluindo o seu).
5. Salve.

> Em modo *Testando*, só contas listadas como “usuário de teste” conseguem conectar. Para liberar para qualquer professor, será preciso **publicar o app** (verificação Google — processo mais longo).

---

## 4. Credenciais OAuth (Client ID)

**APIs e serviços** → **Credenciais** → **+ Criar credenciais** → **ID do cliente OAuth**.

1. Tipo de aplicativo: **Aplicativo da Web**.
2. Nome: `Planify Web`.
3. **Origens JavaScript autorizadas** (desenvolvimento + produção):

   ```
   http://localhost:3000
   https://seudominio.com
   ```

4. **URIs de redirecionamento autorizados** (copie exatamente):

   Desenvolvimento:

   ```
   http://localhost:3000/api/google/oauth/callback
   ```

   Produção:

   ```
   https://seudominio.com/api/google/oauth/callback
   ```

5. **Criar** → copie **ID do cliente** e **Chave secreta do cliente**.

---

## 5. Variáveis no Planify (`.env.local`)

No repositório, copie de `.env.example` e preencha:

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=
```

| Variável | Onde obter |
|----------|------------|
| `GOOGLE_CLIENT_ID` | Credenciais OAuth → ID do cliente |
| `GOOGLE_CLIENT_SECRET` | Credenciais OAuth → Chave secreta |
| `GOOGLE_REDIRECT_URI` | Deve ser **idêntica** a uma URI cadastrada no passo 4 |
| `GOOGLE_DRIVE_FOLDER_ID` | Opcional: ID de pasta no Drive onde os arquivos serão criados |

### Pasta opcional no Drive

1. No [Google Drive](https://drive.google.com), crie a pasta `Planify`.
2. Abra a pasta; na URL aparece o ID:  
   `https://drive.google.com/drive/folders/ESTE_E_O_ID`
3. Cole em `GOOGLE_DRIVE_FOLDER_ID`.

---

## 6. Tabela no Supabase (tokens OAuth)

No **SQL Editor** do Supabase, execute o arquivo:

`supabase/migrations/20260604_google_integrations.sql`

Isso cria a tabela `google_integrations` (tokens só no servidor, via service role).

---

## 7. Conta Google do professor

Para publicar no Classroom, o professor precisa:

1. Conta **Google Workspace for Education** ou conta com acesso ao Classroom.
2. Pelo menos **uma turma** criada no [Google Classroom](https://classroom.google.com).
3. Estar logado no Planify (Supabase) antes de clicar em **Conectar Google**.

---

## 8. Testar no Planify

1. `npm run dev`
2. Faça login no Planify.
3. Abra o **Editor** (ou gere um material).
4. **Conectar Google** → autorize na tela do Google.
5. Escolha a turma → **Enviar ao Classroom**.

Se der erro `access_denied` ou `403`:

- Confirme que o e-mail está em **Usuários de teste** (app em modo Teste).
- Confirme que Drive API e Classroom API estão ativas.
- Confirme `GOOGLE_REDIRECT_URI` igual à URI no Console.

---

## 9. Deploy (Vercel / produção)

1. Adicione as mesmas variáveis `GOOGLE_*` no painel do provedor.
2. Em produção use:

   ```env
   GOOGLE_REDIRECT_URI=https://seudominio.com/api/google/oauth/callback
   ```

3. Cadastre a mesma URI nas credenciais OAuth do Google Cloud.
4. Atualize domínios na tela de consentimento.

---

## Checklist rápido

- [ ] Projeto criado no Google Cloud
- [ ] Drive API + Classroom API ativadas
- [ ] Tela de consentimento configurada
- [ ] OAuth Web com redirect `/api/google/oauth/callback`
- [ ] `.env.local` com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
- [ ] SQL `google_integrations` executado no Supabase
- [ ] E-mail de teste adicionado (modo Teste)
- [ ] Login no Planify + Conectar Google no Editor

---

## Suporte

Se travar em algum passo, envie:

1. Print da tela **Credenciais OAuth** (pode ocultar o secret).
2. Mensagem de erro exata do Planify ou do Google.
3. Se a conta é Gmail comum ou Google Workspace (escola).
