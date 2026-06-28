# Configurar Google Cloud para Planify (produção)

Este guia prepara o projeto Google para exportação no Planify: **Google Docs**, **Drive**, **Forms**, **Slides** e **Classroom**.

Tempo estimado: **30–60 minutos** (configuração) + **verificação Google** (dias a semanas, para escopos sensíveis).

---

## 1. Criar o projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. No topo, clique no seletor de projeto → **Novo projeto** (ou use o projeto de produção existente).
3. Nome sugerido: `Planify Produção`.
4. Selecione esse projeto no seletor do topo.

---

## 2. Ativar as APIs necessárias

Menu ☰ → **APIs e serviços** → **Biblioteca**. Pesquise e **ative** cada uma:

| API | Para quê |
|-----|----------|
| **Google Drive API** | Salvar DOCX/PDF no Drive |
| **Google Classroom API** | Listar turmas e publicar material |
| **Google Forms API** | Criar formulários a partir de provas/listas |
| **Google Slides API** | Exportar apresentações (se usar Slides) |

Confira em **APIs e serviços → APIs ativadas** se todas aparecem.

---

## 3. Tela de consentimento OAuth (produção)

Menu ☰ → **APIs e serviços** → **Tela de consentimento OAuth**.

1. Tipo de usuário: **Externo** (professores com Gmail pessoal ou contas de escola).
2. Preencha obrigatoriamente:
   - Nome do app: `Planify`
   - E-mail de suporte do desenvolvedor
   - Domínios autorizados: seu domínio de produção (ex.: `planify.com.br`, sem `https://`)
   - Página inicial: `https://seudominio.com`
   - **Política de privacidade** e **Termos de uso** com URLs reais e acessíveis
3. **Escopos** → **Adicionar ou remover escopos** → **Adicionar escopos manualmente**.

   Cole cada URL **completa** (não use atalhos como `forms.body`):

   | URL completa do escopo | Uso no Planify |
   |------------------------|----------------|
   | `https://www.googleapis.com/auth/drive.file` | Salvar DOCX/PDF no Drive do professor |
   | `https://www.googleapis.com/auth/forms.body` | Criar Google Forms a partir de listas/provas |
   | `https://www.googleapis.com/auth/classroom.courses.readonly` | Listar turmas do Classroom |
   | `https://www.googleapis.com/auth/classroom.coursework.me` | Publicar material na turma |
   | `https://www.googleapis.com/auth/classroom.courseworkmaterials` | Anexar materiais à turma |

4. Salve.

### Publicar o app (obrigatório em produção)

1. Na tela de consentimento, clique em **Publicar app** para sair do modo *Testando*.
2. Para escopos sensíveis (Forms, Classroom), o Google exige **verificação do app**:
   - Justificativa de uso de cada escopo
   - Vídeo demonstrando o fluxo (login → exportar → resultado no Google)
   - URLs de privacidade e termos válidas
3. Acompanhe o status em **Centro de verificação** no Console.

> Enquanto a verificação não for aprovada, professores podem ver o aviso **"O Google não verificou este app"**. Isso é resolvido no Google Cloud, não no código do Planify.

### Justificativas prontas (campo "Como os escopos serão usados?")

**forms.body:**

```
O Planify é uma plataforma educacional para professores brasileiros. O escopo forms.body é usado exclusivamente quando o professor clica em "Exportar para Google Forms" no editor de materiais didáticos (listas de exercícios e provas). O aplicativo converte o conteúdo gerado pelo professor em questões estruturadas e cria um novo formulário na conta Google do professor. O Planify não acessa formulários existentes de terceiros. O acesso ocorre somente após login no Planify e autorização OAuth explícita.
```

**classroom.\* (courses, coursework, materials):**

```
Usado quando o professor escolhe "Enviar ao Google Classroom". O Planify lista as turmas do professor e publica o material didático na turma selecionada. Não há acesso a dados além do necessário para anexar o material escolhido pelo professor.
```

**drive.file:**

```
Usado para salvar cópias de materiais didáticos (DOCX/PDF) na conta Google Drive do professor, apenas em arquivos criados pelo Planify.
```

### Questionário de verificação

| Pergunta | Resposta para o Planify em produção |
|----------|-------------------------------------|
| Apenas uso pessoal? | **Não** |
| Apenas uso interno? | **Não** |
| Apenas desenvolvimento/teste? | **Não** |
| Plug-in SMTP WordPress? | **Não** |

### Vídeo de demonstração (YouTube)

Envie um vídeo **não listado** mostrando: login → editor → exportar Forms → autorizar Google → formulário criado. Na descrição do vídeo, explique os escopos e o fluxo (ver modelo na seção de suporte abaixo).

---

## 4. Credenciais OAuth (Client ID)

**APIs e serviços** → **Credenciais** → **+ Criar credenciais** → **ID do cliente OAuth**.

1. Tipo de aplicativo: **Aplicativo da Web**.
2. Nome: `Planify Web`.
3. **Origens JavaScript autorizadas**:

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

## 5. Variáveis no Planify

### Local (`.env.local`)

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=
```

### Produção (Vercel / provedor)

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://seudominio.com/api/google/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=
```

| Variável | Onde obter |
|----------|------------|
| `GOOGLE_CLIENT_ID` | Credenciais OAuth → ID do cliente |
| `GOOGLE_CLIENT_SECRET` | Credenciais OAuth → Chave secreta |
| `GOOGLE_REDIRECT_URI` | Deve ser **idêntica** a uma URI cadastrada no passo 4 |
| `GOOGLE_DRIVE_FOLDER_ID` | Opcional: pasta no Drive para novos arquivos |

---

## 6. Tabela no Supabase (tokens OAuth)

No **SQL Editor** do Supabase, execute:

`supabase/migrations/20260604_google_integrations.sql`

Isso cria a tabela `google_integrations` (tokens só no servidor).

---

## 7. Conta Google do professor

Para usar Classroom, o professor precisa:

1. Conta com acesso ao [Google Classroom](https://classroom.google.com).
2. Pelo menos **uma turma** de professor criada.
3. Estar logado no Planify antes de conectar o Google.

---

## 8. Testar no Planify

1. `npm run dev` (local) ou acesse o site em produção.
2. Faça login no Planify.
3. Abra o **Editor** com uma lista ou prova.
4. Clique em **Google Forms** (ou Docs/Drive/Classroom).
5. Autorize na tela do Google → o export deve concluir automaticamente após o retorno.

---

## 9. Solução de problemas (produção)

| Sintoma | O que verificar |
|---------|-----------------|
| `access_denied` | Professor cancelou na tela do Google; tentar de novo |
| "Google não verificou este app" | App publicado? Verificação submetida e aprovada? |
| `redirect_uri_mismatch` | `GOOGLE_REDIRECT_URI` idêntica à URI no Console |
| Forms não abre após OAuth | Deploy com fix OAuth recente; limpar cache do navegador |
| `403` na API | API correspondente ativada no projeto Google Cloud |
| Nenhuma turma no Classroom | Conta sem turma de professor no Classroom |
| Muitos posts duplicados no Classroom | Arquivar manualmente cada atividade no Classroom (Planify não apaga via API). Peça à TI se precisar limpeza em lote. |
| Reenvio bloqueado por duplicata | Aguarde 3 minutos ou altere o conteúdo/título antes de reenviar |

---

## 10. Limpeza de posts duplicados (incidente de export)

Se materiais foram publicados em excesso no Google Classroom:

1. Abra [classroom.google.com](https://classroom.google.com) com a conta `@educar.rs.gov.br`.
2. Entre na turma afetada → aba **Atividades**.
3. Para cada material duplicado: menu **⋮** → **Excluir** ou **Arquivar** (conforme permissão da conta).
4. Rascunhos enviados pelo Planify aparecem como rascunho — publique só o correto e exclua os demais.

O Planify **não consegue remover** atividades já criadas no Classroom pela API de forma confiável para todas as contas Workspace. A prevenção está no fluxo atual: turma explícita, revisão no popover, rascunho por padrão e anti-duplicata.

---

## Checklist rápido (produção)

- [ ] Projeto Google Cloud de produção selecionado
- [ ] Drive + Classroom + **Forms** APIs ativadas
- [ ] Tela de consentimento com domínio, privacidade e termos
- [ ] Todos os escopos declarados com **URL completa** (incl. `https://www.googleapis.com/auth/forms.body`)
- [ ] App **publicado** (não em modo Testando)
- [ ] Verificação Google **submetida** para escopos sensíveis
- [ ] OAuth Web com redirect `/api/google/oauth/callback`
- [ ] Variáveis `GOOGLE_*` na Vercel com URI de produção
- [ ] SQL `google_integrations` executado no Supabase
- [ ] Teste: lista/prova → Forms → abre em um fluxo

---

## Suporte

Se travar em algum passo, envie:

1. Print da tela **Credenciais OAuth** (oculte o secret).
2. Status da tela de consentimento (*Testando* vs *Em produção*).
3. Mensagem de erro exata do Planify ou do Google.
4. Se a conta é Gmail comum ou Google Workspace (escola).
