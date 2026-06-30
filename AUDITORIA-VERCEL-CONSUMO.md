# AUDITORIA VERCEL CONSUMO - Planify / iaplanify

Data: 2026-06-30  
Escopo analisado: projeto Next.js em `src/app`, APIs em `src/app/api`, proxy/middleware, fetches client/server, rotas publicas, rotas privadas, integracoes com Supabase, Stripe, Google, IA, DOCX e BNCC.

## Regra desta etapa

Nenhuma funcionalidade, layout, texto, cor, rota, regra de negocio ou fluxo foi alterado. Este arquivo e apenas diagnostico. Qualquer correcao abaixo precisa da sua aprovacao antes de ser aplicada.

## Resumo executivo

- Foram mapeadas 57 paginas em `src/app`.
- Foram mapeadas 153 APIs em `src/app/api`.
- O proxy esta bem limitado a rotas privadas/prioritarias e nao roda na landing, planos, contato, termos, privacidade e APIs publicas.
- Nao foi encontrado `revalidate = 0`.
- Nao foi encontrado `router.refresh()`.
- Os usos reais de `cookies()` e `headers()` estao concentrados em Supabase/Auth/Owner/Admin/Stripe e parecem coerentes com rotas dinamicas.
- O maior consumo evitavel identificado esta em chamadas de status/autenticacao em paginas publicas, principalmente `/api/access/status`.
- A landing publica atual chama `/api/access/status` no header e no footer, gerando chamadas duplicadas em visita publica.
- Paginas publicas como `/contato`, `/termos`, `/privacidade`, `/escolas`, `/planos` e `/planos/ativar` estao marcadas como dinamicas sem necessidade clara de render server dinamico.
- Varias APIs pesadas sao esperadas por natureza do produto: IA, DOCX/PDF, BNCC, Supabase, Stripe webhook, Google Drive/Classroom/Forms. Elas nao devem ser alteradas sem aprovacao especifica.
- O problema visual mobile do print nao foi reproduzido localmente em 418px, 360px e 320px. A producao em `https://iaplanify.com.br/` parece servir uma landing diferente da arvore local atual, o que indica possivel divergencia de deploy/cache/branch antes de mexer no codigo.

## Auditoria do loop mobile

Arquivos avaliados:

- `src/app/page.tsx`
- `src/components/public/landing-professor-primeiro/LandingProfessorPrimeiroPage.tsx`
- `src/components/public/landing-professor-primeiro/LandingHeader.tsx`
- `src/components/public/landing-professor-primeiro/LandingTools.tsx`
- `src/components/public/landing-professor-primeiro/LandingCreateBlock.tsx`
- `src/components/public/landing-professor-primeiro/LandingFooter.tsx`
- `src/components/public/landing-professor-primeiro/landing-professor.css`
- `src/components/public/landing-professor-primeiro/LandingHeroShowcaseCarousel.tsx`
- `src/components/public/landing/LessonSimulatorSection.tsx`

Resultado:

- Teste local em mobile com Playwright:
  - 418 x 839: sem overflow horizontal e sem sobreposicao do bloco de ferramentas.
  - 360 x 740: sem overflow horizontal e sem sobreposicao.
  - 320 x 740: sem overflow horizontal; cards quebram texto, mas sem loop visual.
- A producao consultada retornou conteudo textual diferente do codigo local atual. Isso sugere que o print pode estar vindo de uma versao anterior da landing, de outro deployment, ou de cache/CDN.
- Componentes antigos/alternativos com intervalo visual existem, mas nao aparecem no `LandingProfessorPrimeiroPage.tsx` atual:
  - `src/components/public/landing-professor-primeiro/LandingHeroShowcaseCarousel.tsx`
  - `src/components/public/landing/LessonSimulatorSection.tsx`

Diagnostico:

| Arquivo analisado | Problema encontrado | Risco | Impacto provavel na Vercel | Sugestao segura | Aplicacao |
| --- | --- | --- | --- | --- | --- |
| `src/components/public/landing-professor-primeiro/LandingTools.tsx` + CSS | Loop visual do print nao reproduzido na arvore local atual. | Medio | Baixo direto em CPU, alto em UX/conversao. | Confirmar o commit exato em producao e, apos aprovacao, aplicar correcao pontual apenas no bloco responsivo que estiver ativo em producao. | Precisa aprovacao. |
| `src/components/public/landing-professor-primeiro/LandingHeroShowcaseCarousel.tsx` | Usa `setInterval` visual a cada 3s; se uma versao antiga estiver ativa em producao, pode contribuir para instabilidade visual mobile. | Medio | Baixo em Functions, medio em CPU do cliente. | Se este componente estiver no deploy real, pausar/desativar animacao no mobile ou estabilizar dimensoes. | Precisa aprovacao. |
| `src/components/public/landing/LessonSimulatorSection.tsx` | Usa intervalo visual e faz fetch para `/api/public/lesson-simulator`; parece componente de landing anterior. | Medio | Medio se estiver publicado e acionando API publica. | Verificar se a producao ainda referencia esta landing antiga antes de alterar. | Precisa aprovacao. |

## Achados principais

| Arquivo analisado | Problema encontrado | Risco | Impacto provavel na CPU/Functions da Vercel | Sugestao de correcao segura | Aplicacao |
| --- | --- | --- | --- | --- | --- |
| `src/components/public/landing-professor-primeiro/LandingHeader.tsx` + `src/hooks/usePlanifySession.ts` | Header publico chama `usePlanifySession()`, que consulta `/api/access/status` com `cache: "no-store"`. | Alto | Cada visita publica pode executar Function de auth/status. | Criar leitura compartilhada ou tornar o estado de sessao publico lazy/dedupe; nao mudar texto/layout. | Pode aplicar apos aprovacao. |
| `src/components/OwnerFooterLink.tsx` + `src/components/public/landing-professor-primeiro/LandingFooter.tsx` | Footer publico tambem chama `/api/access/status`, duplicando a chamada do header. | Alto | Duplica Function calls em landing/rodape publico. | Reusar o mesmo status do header por provider/contexto ou adiar a checagem para interacao/usuario autenticado. | Pode aplicar apos aprovacao. |
| `src/app/api/access/status/route.ts` | Endpoint dinamico, no-store, executa verificacoes Premium/Admin/Owner/Supabase e pode ser chamado por varias partes. | Alto | Alto quando chamado em pagina publica ou em duplicidade; envolve Supabase Auth/Admin e consultas de perfil/assinatura. | Deduplicar chamadas no cliente e separar um status leve para publico apenas se aprovado. | Precisa aprovacao por tocar auth/Supabase. |
| `src/app/termos/page.tsx` | `dynamic = "force-dynamic"` em pagina legal estatica. | Medio | Render server dinamico desnecessario em pagina publica. | Remover `force-dynamic` ou declarar estatico, mantendo conteudo identico. | Pode aplicar apos aprovacao. |
| `src/app/privacidade/page.tsx` | `dynamic = "force-dynamic"` em pagina legal estatica. | Medio | Render server dinamico desnecessario em pagina publica. | Remover `force-dynamic` ou declarar estatico. | Pode aplicar apos aprovacao. |
| `src/app/contato/page.tsx` | Pagina marcada dinamica, mas o formulario usa API apenas no submit. | Medio | Render dinamico em acesso publico sem necessidade clara. | Tornar shell da pagina estatico; manter `/api/contact` dinamico somente no envio. | Pode aplicar apos aprovacao. |
| `src/app/escolas/page.tsx` | Pagina marcada dinamica; conteudo parece majoritariamente estatico. | Medio | Function/render dinamico em visita publica. | Remover dinamismo se nenhuma leitura server por request for necessaria. | Pode aplicar apos aprovacao. |
| `src/app/planos/page.tsx` | `force-dynamic`; usa `searchParams` para alertas/estado da URL. | Medio | Pagina comercial publica deixa de ser totalmente cacheavel. | Mover leitura de query para componente cliente ou validar `dynamic = "auto"` sem alterar layout. | Pode aplicar apos aprovacao. |
| `src/app/planos/ativar/page.tsx` | `force-dynamic` em shell com formulario cliente. | Medio | Render dinamico publico possivelmente evitavel. | Manter fluxo de ativacao, mas deixar shell estatico se seguro. | Pode aplicar apos aprovacao. |
| `src/app/planos/sucesso/page.tsx` + `src/components/planos/PlanosSucessoActions.tsx` | Sucesso do checkout consulta Stripe/session e depois faz polling de `/api/access/status` a cada 4s. | Alto | Pode gerar varias Function calls apos pagamento, mas em fluxo critico. | Limitar polling por tentativas/visibilidade e parar assim que resolver; nao alterar Stripe sem aprovacao. | Precisa aprovacao especifica por tocar Stripe/auth. |
| `src/components/google/*` + `src/lib/google/google-api-client.ts` | Status Google e listas podem ser consultados por mais de um botao/painel. | Medio | Chamadas repetidas a `/api/google/status` e `/api/google/classroom/courses`. | Criar dedupe/in-flight cache curto no cliente ou provider de status Google. | Precisa aprovacao por tocar Google. |
| `src/components/community/CommunityMessagesIcon.tsx` | Polling de mensagens nao lidas a cada 60s. | Medio | Function calls recorrentes em usuarios logados na comunidade. | Pausar quando aba invisivel, usar realtime quando disponivel, ou backoff. | Pode aplicar apos aprovacao. |
| `src/components/community/CommunityNotificationsIcon.tsx` | Polling de notificacoes a cada 60s. | Medio | Function calls recorrentes por sessao logada. | Pausar quando `document.hidden`, dedupe com outras leituras de comunidade. | Pode aplicar apos aprovacao. |
| `src/components/community/CommunityMessagesPanel.tsx` | Fallback de polling em conversa ativa quando realtime falha. | Medio | Alto em sessoes com chat aberto se realtime indisponivel. | Manter fallback, mas adicionar backoff/pausa por visibilidade. | Pode aplicar apos aprovacao. |
| `src/components/community/docente/ComunidadeDocenteGroupChat.tsx` | Fallback de polling a cada 12s quando realtime falha. | Medio | Alto se muitos grupos abertos com realtime indisponivel. | Backoff progressivo e pausa quando aba invisivel. | Pode aplicar apos aprovacao. |
| `src/components/bncc/DirectorPanelClient.tsx` | Painel gestor faz polling do dashboard no overview. | Medio | Consumo recorrente enquanto painel gestor aberto. | Pausar por visibilidade e garantir intervalo conservador. | Precisa aprovacao por tocar BNCC/gestor. |
| `src/app/admin/AdminControleClient.tsx` | Dashboard admin dispara varias APIs no-store em paralelo no carregamento. | Baixo/Medio | Pico controlado, restrito a admin. | Manter por enquanto; possivel lazy-load por aba depois. | Precisa aprovacao. |
| `src/proxy.ts` | Proxy esta limitado a rotas privadas, mas `/admin` e bypassado apesar de existir em `protectedRoutes`. | Baixo para consumo, medio para seguranca | Nao pesa em publico; pode depender de guarda admin propria. | Nao alterar na auditoria; revisar auth admin separadamente. | Precisa aprovacao especifica. |
| `src/app/page.tsx` | Root usa `searchParams` para redirecionar links antigos; pode impedir estatico total. | Baixo/Medio | Landing pode perder cache completo. | Migrar compatibilidade de query para client/edge somente se necessario. | Pode aplicar apos aprovacao. |

## Rotas em `src/app`

Observacao: grupos como `(app)` sao grupos de rota do Next e nao entram na URL final, mas estao listados para refletir a estrutura real em disco.

```text
/ | src\app\page.tsx
/(app)/biblioteca | src\app\(app)\biblioteca\page.tsx
/(app)/bncc | src\app\(app)\bncc\page.tsx
/(app)/comunidade | src\app\(app)\comunidade\page.tsx
/(app)/comunidade/busca | src\app\(app)\comunidade\busca\page.tsx
/(app)/comunidade/desafios | src\app\(app)\comunidade\desafios\page.tsx
/(app)/comunidade/discussao/[id] | src\app\(app)\comunidade\discussao\[id]\page.tsx
/(app)/comunidade/evento/[id] | src\app\(app)\comunidade\evento\[id]\page.tsx
/(app)/comunidade/grupo/[id] | src\app\(app)\comunidade\grupo\[id]\page.tsx
/(app)/comunidade/material/[id] | src\app\(app)\comunidade\material\[id]\page.tsx
/(app)/comunidade/professor/[id] | src\app\(app)\comunidade\professor\[id]\page.tsx
/(app)/dashboard | src\app\(app)\dashboard\page.tsx
/(app)/diretor | src\app\(app)\diretor\page.tsx
/(app)/editor | src\app\(app)\editor\page.tsx
/(app)/gestor | src\app\(app)\gestor\page.tsx
/(app)/gestor/materiais | src\app\(app)\gestor\materiais\page.tsx
/(app)/gestor/professores | src\app\(app)\gestor\professores\page.tsx
/(app)/gestor/turmas | src\app\(app)\gestor\turmas\page.tsx
/(app)/historico | src\app\(app)\historico\page.tsx
/(app)/marketplace | src\app\(app)\marketplace\page.tsx
/(app)/marketplace/material/[id] | src\app\(app)\marketplace\material\[id]\page.tsx
/(app)/marketplace/novo | src\app\(app)\marketplace\novo\page.tsx
/(app)/marketplace/perfil/[userId] | src\app\(app)\marketplace\perfil\[userId]\page.tsx
/(app)/materiais | src\app\(app)\materiais\page.tsx
/(app)/planejamentos | src\app\(app)\planejamentos\page.tsx
/(app)/progresso-bncc | src\app\(app)\progresso-bncc\page.tsx
/acesso-negado | src\app\acesso-negado\page.tsx
/admin | src\app\admin\page.tsx
/admin/biblioteca | src\app\admin\biblioteca\page.tsx
/admin/controle | src\app\admin\controle\page.tsx
/admin/corpus | src\app\admin\corpus\page.tsx
/admin/gestor | src\app\admin\gestor\page.tsx
/apostilas-com-ia-para-professores | src\app\apostilas-com-ia-para-professores\page.tsx
/aula-completa | src\app\aula-completa\page.tsx
/banco-questoes | src\app\banco-questoes\page.tsx
/contato | src\app\contato\page.tsx
/correcao | src\app\correcao\page.tsx
/cruzadinha | src\app\cruzadinha\page.tsx
/editor-de-documentos-para-professores | src\app\editor-de-documentos-para-professores\page.tsx
/escolas | src\app\escolas\page.tsx
/gerador-de-atividades-com-ia | src\app\gerador-de-atividades-com-ia\page.tsx
/gerador-de-jogos-pedagogicos | src\app\gerador-de-jogos-pedagogicos\page.tsx
/gerador-de-provas-com-ia | src\app\gerador-de-provas-com-ia\page.tsx
/google/retorno | src\app\google\retorno\page.tsx
/inclusao | src\app\inclusao\page.tsx
/login | src\app\login\page.tsx
/pei | src\app\pei\page.tsx
/planejamento-escolar-com-ia | src\app\planejamento-escolar-com-ia\page.tsx
/planos | src\app\planos\page.tsx
/planos/ativar | src\app\planos\ativar\page.tsx
/planos/sucesso | src\app\planos\sucesso\page.tsx
/privacidade | src\app\privacidade\page.tsx
/sair | src\app\sair\page.tsx
/termos | src\app\termos\page.tsx
/test/google-classroom-resume | src\app\test\google-classroom-resume\page.tsx
/testar-planejamento | src\app\testar-planejamento\page.tsx
/testar-planejamento/documento | src\app\testar-planejamento\documento\page.tsx
```

## APIs em `src/app/api`

```text
/api/access/status | src\app\api\access\status\route.ts
/api/admin/activity-feed | src\app\api\admin\activity-feed\route.ts
/api/admin/banco-questoes/[id]/despublicar | src\app\api\admin\banco-questoes\[id]\despublicar\route.ts
/api/admin/biblioteca/materiais | src\app\api\admin\biblioteca\materiais\route.ts
/api/admin/commercial-proposal-pdf | src\app\api\admin\commercial-proposal-pdf\route.ts
/api/admin/community/reports | src\app\api\admin\community\reports\route.ts
/api/admin/corpus-candidates | src\app\api\admin\corpus-candidates\route.ts
/api/admin/corpus-candidates/[id] | src\app\api\admin\corpus-candidates\[id]\route.ts
/api/admin/corpus-candidates/bulk | src\app\api\admin\corpus-candidates\bulk\route.ts
/api/admin/corpus-candidates/stats | src\app\api\admin\corpus-candidates\stats\route.ts
/api/admin/generation-stats | src\app\api\admin\generation-stats\route.ts
/api/admin/materials | src\app\api\admin\materials\route.ts
/api/admin/me | src\app\api\admin\me\route.ts
/api/admin/metrics | src\app\api\admin\metrics\route.ts
/api/admin/overview | src\app\api\admin\overview\route.ts
/api/admin/pedagogico/[id]/revisar | src\app\api\admin\pedagogico\[id]\revisar\route.ts
/api/admin/pedagogico/fila | src\app\api\admin\pedagogico\fila\route.ts
/api/admin/platform-settings | src\app\api\admin\platform-settings\route.ts
/api/admin/schools | src\app\api\admin\schools\route.ts
/api/admin/session | src\app\api\admin\session\route.ts
/api/admin/site-health | src\app\api\admin\site-health\route.ts
/api/admin/status | src\app\api\admin\status\route.ts
/api/admin/users | src\app\api\admin\users\route.ts
/api/admin/users/[id] | src\app\api\admin\users\[id]\route.ts
/api/ai/material | src\app\api\ai\material\route.ts
/api/ai/material/sugerir-conteudos | src\app\api\ai\material\sugerir-conteudos\route.ts
/api/ai/planejamento | src\app\api\ai\planejamento\route.ts
/api/aula-completa/gerar | src\app\api\aula-completa\gerar\route.ts
/api/aula-completa/gerar-stream | src\app\api\aula-completa\gerar-stream\route.ts
/api/aula-completa/regenerar-item | src\app\api\aula-completa\regenerar-item\route.ts
/api/auth/access | src\app\api\auth\access\route.ts
/api/auth/access-cookie | src\app\api\auth\access-cookie\route.ts
/api/banco-questoes | src\app\api\banco-questoes\route.ts
/api/banco-questoes/curadoria | src\app\api\banco-questoes\curadoria\route.ts
/api/banco-questoes/fontes | src\app\api\banco-questoes\fontes\route.ts
/api/banco-questoes/importar | src\app\api\banco-questoes\importar\route.ts
/api/banco-questoes/itens | src\app\api\banco-questoes\itens\route.ts
/api/banco-questoes/itens/[id] | src\app\api\banco-questoes\itens\[id]\route.ts
/api/banco-questoes/migrar-local | src\app\api\banco-questoes\migrar-local\route.ts
/api/banco-questoes/montar | src\app\api\banco-questoes\montar\route.ts
/api/banco-questoes/publicar | src\app\api\banco-questoes\publicar\route.ts
/api/banco-questoes/publicar-escola | src\app\api\banco-questoes\publicar-escola\route.ts
/api/banco-questoes/uso | src\app\api\banco-questoes\uso\route.ts
/api/biblioteca/materiais | src\app\api\biblioteca\materiais\route.ts
/api/biblioteca/materiais/[id]/download | src\app\api\biblioteca\materiais\[id]\download\route.ts
/api/biblioteca/materiais/[id]/preview | src\app\api\biblioteca\materiais\[id]\preview\route.ts
/api/bncc/autocomplete | src\app\api\bncc\autocomplete\route.ts
/api/bncc/catalog/options | src\app\api\bncc\catalog\options\route.ts
/api/bncc/progress | src\app\api\bncc\progress\route.ts
/api/bncc/sugerir | src\app\api\bncc\sugerir\route.ts
/api/community/docente | src\app\api\community\docente\route.ts
/api/community/docente/actions | src\app\api\community\docente\actions\route.ts
/api/community/docente/challenges/bncc | src\app\api\community\docente\challenges\bncc\route.ts
/api/community/docente/discussao/[id] | src\app\api\community\docente\discussao\[id]\route.ts
/api/community/docente/evento/[id] | src\app\api\community\docente\evento\[id]\route.ts
/api/community/docente/grupo/[id] | src\app\api\community\docente\grupo\[id]\route.ts
/api/community/docente/grupo/[id]/messages | src\app\api\community\docente\grupo\[id]\messages\route.ts
/api/community/docente/grupo/[id]/messages/[messageId] | src\app\api\community\docente\grupo\[id]\messages\[messageId]\route.ts
/api/community/docente/grupo/[id]/messages/[messageId]/file | src\app\api\community\docente\grupo\[id]\messages\[messageId]\file\route.ts
/api/community/docente/professor/[id] | src\app\api\community\docente\professor\[id]\route.ts
/api/community/friends | src\app\api\community\friends\route.ts
/api/community/friends/[userId] | src\app\api\community\friends\[userId]\route.ts
/api/community/hidden-feed-materials | src\app\api\community\hidden-feed-materials\route.ts
/api/community/messages/conversations | src\app\api\community\messages\conversations\route.ts
/api/community/messages/conversations/[conversationId] | src\app\api\community\messages\conversations\[conversationId]\route.ts
/api/community/messages/unread | src\app\api\community\messages\unread\route.ts
/api/community/notifications | src\app\api\community\notifications\route.ts
/api/community/profile | src\app\api\community\profile\route.ts
/api/community/profile/[userId] | src\app\api\community\profile\[userId]\route.ts
/api/community/profile/avatar | src\app\api\community\profile\avatar\route.ts
/api/community/profiles/search | src\app\api\community\profiles\search\route.ts
/api/community/reports | src\app\api\community\reports\route.ts
/api/community/saved-materials | src\app\api\community\saved-materials\route.ts
/api/contact | src\app\api\contact\route.ts
/api/correcao/avaliar | src\app\api\correcao\avaliar\route.ts
/api/correcao/avaliar-lote | src\app\api\correcao\avaliar-lote\route.ts
/api/correcao/exportar-pdf | src\app\api\correcao\exportar-pdf\route.ts
/api/correcao/extrair | src\app\api\correcao\extrair\route.ts
/api/correcao/perfil | src\app\api\correcao\perfil\route.ts
/api/credits/balance | src\app\api\credits\balance\route.ts
/api/cron/corpus-sync | src\app\api\cron\corpus-sync\route.ts
/api/cron/pedagogico/ingest | src\app\api\cron\pedagogico\ingest\route.ts
/api/cron/pedagogico/refresh | src\app\api\cron\pedagogico\refresh\route.ts
/api/documentos/docx | src\app\api\documentos\docx\route.ts
/api/documentos/export | src\app\api\documentos\export\route.ts
/api/documentos/export-pptx | src\app\api\documentos\export-pptx\route.ts
/api/generation/jobs/[id] | src\app\api\generation\jobs\[id]\route.ts
/api/google/classroom/auth | src\app\api\google\classroom\auth\route.ts
/api/google/classroom/callback | src\app\api\google\classroom\callback\route.ts
/api/google/classroom/courses | src\app\api\google\classroom\courses\route.ts
/api/google/classroom/export | src\app\api\google\classroom\export\route.ts
/api/google/classroom/share | src\app\api\google\classroom\share\route.ts
/api/google/docs/export | src\app\api\google\docs\export\route.ts
/api/google/drive/export | src\app\api\google\drive\export\route.ts
/api/google/forms/export | src\app\api\google\forms\export\route.ts
/api/google/oauth/callback | src\app\api\google\oauth\callback\route.ts
/api/google/oauth/disconnect | src\app\api\google\oauth\disconnect\route.ts
/api/google/oauth/start | src\app\api\google\oauth\start\route.ts
/api/google/slides/export | src\app\api\google\slides\export\route.ts
/api/google/status | src\app\api\google\status\route.ts
/api/history | src\app\api\history\route.ts
/api/history/[id] | src\app\api\history\[id]\route.ts
/api/history/clear | src\app\api\history\clear\route.ts
/api/inclusao/adaptar | src\app\api\inclusao\adaptar\route.ts
/api/marketplace/materiais | src\app\api\marketplace\materiais\route.ts
/api/marketplace/materiais/[id]/comentarios | src\app\api\marketplace\materiais\[id]\comentarios\route.ts
/api/marketplace/materiais/[id]/comentarios/[commentId] | src\app\api\marketplace\materiais\[id]\comentarios\[commentId]\route.ts
/api/marketplace/materiais/[id]/download | src\app\api\marketplace\materiais\[id]\download\route.ts
/api/marketplace/materiais/[id]/likes | src\app\api\marketplace\materiais\[id]\likes\route.ts
/api/marketplace/materiais/[id]/preview | src\app\api\marketplace\materiais\[id]\preview\route.ts
/api/materiais/[id]/documento | src\app\api\materiais\[id]\documento\route.ts
/api/materiais/[id]/estrutura | src\app\api\materiais\[id]\estrutura\route.ts
/api/materiais/gerar | src\app\api\materiais\gerar\route.ts
/api/materiais/gerar-stream | src\app\api\materiais\gerar-stream\route.ts
/api/materiais/regenerar-imagens | src\app\api\materiais\regenerar-imagens\route.ts
/api/materiais/regenerar-questoes | src\app\api\materiais\regenerar-questoes\route.ts
/api/materiais/render-html | src\app\api\materiais\render-html\route.ts
/api/me/classes | src\app\api\me\classes\route.ts
/api/me/school | src\app\api\me\school\route.ts
/api/owner/session | src\app\api\owner\session\route.ts
/api/pedagogico/buscar | src\app\api\pedagogico\buscar\route.ts
/api/pedagogico/contexto | src\app\api\pedagogico\contexto\route.ts
/api/pei/gerar | src\app\api\pei\gerar\route.ts
/api/planejamentos/docx | src\app\api\planejamentos\docx\route.ts
/api/planejamentos/docx-oficial | src\app\api\planejamentos\docx-oficial\route.ts
/api/planejamentos/docx-pacote | src\app\api\planejamentos\docx-pacote\route.ts
/api/planejamentos/gerar-docx | src\app\api\planejamentos\gerar-docx\route.ts
/api/planejamentos/gerar-ia | src\app\api\planejamentos\gerar-ia\route.ts
/api/planejamentos/habilidades | src\app\api\planejamentos\habilidades\route.ts
/api/premium/status | src\app\api\premium\status\route.ts
/api/public/checkout-account-status | src\app\api\public\checkout-account-status\route.ts
/api/public/lesson-simulator | src\app\api\public\lesson-simulator\route.ts
/api/public/planning-trial/gerar | src\app\api\public\planning-trial\gerar\route.ts
/api/public/planning-trial/sugerir-bncc | src\app\api\public\planning-trial\sugerir-bncc\route.ts
/api/public/registrations-status | src\app\api\public\registrations-status\route.ts
/api/school/classes | src\app\api\school\classes\route.ts
/api/school/classes/[id] | src\app\api\school\classes\[id]\route.ts
/api/school/dashboard | src\app\api\school\dashboard\route.ts
/api/school/invite | src\app\api\school\invite\route.ts
/api/school/invite/[id] | src\app\api\school\invite\[id]\route.ts
/api/school/materials | src\app\api\school\materials\route.ts
/api/school/teachers | src\app\api\school\teachers\route.ts
/api/school/teachers/[userId] | src\app\api\school\teachers\[userId]\route.ts
/api/schools | src\app\api\schools\route.ts
/api/schools/[id]/classes | src\app\api\schools\[id]\classes\route.ts
/api/schools/[id]/dashboard | src\app\api\schools\[id]\dashboard\route.ts
/api/schools/[id]/invites | src\app\api\schools\[id]\invites\route.ts
/api/schools/[id]/materials | src\app\api\schools\[id]\materials\route.ts
/api/schools/[id]/members | src\app\api\schools\[id]\members\route.ts
/api/stripe/activate-account | src\app\api\stripe\activate-account\route.ts
/api/stripe/checkout | src\app\api\stripe\checkout\route.ts
/api/stripe/checkout-session | src\app\api\stripe\checkout-session\route.ts
/api/stripe/webhook | src\app\api\stripe\webhook\route.ts
```

## Renderizacao dinamica

### Dinamico provavelmente correto

- `src/app/(app)/layout.tsx`: usa `dynamic = "force-dynamic"` para area autenticada/premium.
- Paginas privadas em `(app)`: herdam ou declaram dinamismo para ferramentas autenticadas.
- APIs de IA, DOCX, Stripe, Supabase, Google, comunidade, escola, BNCC progress e admin: por regra de negocio sao dinamicas.

### Dinamico possivelmente desnecessario

| Arquivo | Motivo | Risco de alterar | Recomendacao |
| --- | --- | --- | --- |
| `src/app/termos/page.tsx` | Conteudo legal estatico. | Baixo | Remover `force-dynamic` apos aprovacao. |
| `src/app/privacidade/page.tsx` | Conteudo legal estatico. | Baixo | Remover `force-dynamic` apos aprovacao. |
| `src/app/contato/page.tsx` | Pagina estatica; API so no submit. | Baixo | Tornar shell estatico. |
| `src/app/escolas/page.tsx` | Conteudo comercial/institucional. | Baixo/Medio | Validar dependencias e tornar estatico. |
| `src/app/planos/page.tsx` | Usa `searchParams` para mensagens/estado. | Medio | Mover leitura de query para cliente ou validar `dynamic = "auto"`. |
| `src/app/planos/ativar/page.tsx` | Shell com formulario client-side. | Medio | Tornar shell estatico sem mexer no fluxo de ativacao. |
| `src/app/planos/sucesso/page.tsx` | Fluxo Stripe/autenticacao pos-checkout. | Alto | Nao alterar sem aprovacao especifica. |

## Fetch, cache e chamadas repetidas

### `cache: "no-store"` relevante

- `src/hooks/usePlanifySession.ts`: chama `/api/access/status`.
- `src/hooks/usePlanifyAccess.ts`: chama `/api/access/status`.
- `src/lib/auth/access-client.ts`: wrapper central de `/api/access/status`.
- `src/components/OwnerFooterLink.tsx`: chama `/api/access/status`.
- `src/components/dashboard/StudioSessionRedirect.tsx`: chama `/api/access/status`.
- `src/lib/google/google-api-client.ts`: chama `/api/google/status` e `/api/google/classroom/courses`.
- `src/components/community/*`: leituras de perfil, mensagens, notificacoes, comentarios e feed com no-store.
- `src/app/admin/AdminControleClient.tsx`: multiplas chamadas admin no-store em paralelo.
- Rotas de download/export geram resposta `Cache-Control: no-store`, coerente com arquivos privados.

### Fetch sem cache explicito

Muitos fetches sem `cache` sao mutacoes `POST`, `PATCH` ou `DELETE`, portanto nao sao candidatos naturais a cache. Pontos que merecem cuidado:

- `src/components/public/landing/LessonSimulatorSection.tsx`: GET/POST para `/api/public/lesson-simulator`; se esta landing antiga estiver em producao, pode gerar consumo publico.
- `src/hooks/useBnccContentSkillsSuggestion.ts`: fetch para `/api/bncc/sugerir`.
- `src/app/planejamentos/PlanejamentosClient.tsx`: fetch para sugestoes BNCC.
- `src/lib/pedagogical-cache/pedagogical-context-client.ts`: fetch para `/api/pedagogico/buscar`.
- `src/server/materials/slide-image-resolver.ts`: fetch externo para Wikimedia/Unsplash.
- `src/server/pedagogical-cache/adapters/*`: fetch externo para fontes pedagogicas.
- `src/server/google/*`: fetch externo para APIs Google.
- `src/server/stripe/stripe-api.ts`: fetch externo para Stripe.

Recomendacao: nao adicionar cache genericamente. Avaliar caso a caso para nao quebrar BNCC, Google, Stripe, DOCX, IA ou dados autenticados.

### Duplicidade de APIs provavel

| API | Chamadores/arquivos | Impacto | Sugestao |
| --- | --- | --- | --- |
| `/api/access/status` | `LandingHeader`, `OwnerFooterLink`, `PremiumAccessGate`, `usePlanifyAccess`, `PlanifyAppFrame`, `PlanifySidebarUser`, `LoginPageClient`, `PlanosSucessoActions` | Alto quando publico ou duplicado. | Dedupe compartilhado no cliente e/ou provider de status. |
| `/api/google/status` | Botoes/paines Google via `src/lib/google/google-api-client.ts` | Medio. | Cache client-side curto por sessao/aba e in-flight promise. |
| `/api/google/classroom/courses` | Painel/botoes Classroom | Medio. | Reusar resultado enquanto painel aberto. |
| `/api/bncc/sugerir`, `/api/planejamentos/habilidades`, `/api/public/planning-trial/sugerir-bncc` | Sugestoes BNCC em fluxos privados e publicos | Medio/Alto conforme uso. | Manter endpoints por contrato, mas considerar cache/memo por payload seguro. |
| `/api/materiais/gerar` e `/api/materiais/gerar-stream` | Geracao material normal e streaming | Alto por IA. | Nao unir sem confirmar consumidores; possivel idempotencia/lock por request. |
| `/api/planejamentos/docx`, `/api/planejamentos/docx-oficial`, `/api/planejamentos/gerar-docx` | Aliases/compatibilidade DOCX | Medio. | Manter por compatibilidade; revisar chamadas duplicadas antes de mexer. |

## Polling, intervalos e refetch automatico

| Arquivo | Padrao encontrado | Risco | Impacto Vercel | Sugestao |
| --- | --- | --- | --- | --- |
| `src/components/community/CommunityMessagesIcon.tsx` | Polling `/api/community/messages/unread` a cada 60s. | Medio | Recorrente por usuario logado. | Pausar quando aba invisivel; realtime/dedupe. |
| `src/components/community/CommunityNotificationsIcon.tsx` | Polling `/api/community/notifications` a cada 60s. | Medio | Recorrente por usuario logado. | Pausar por visibilidade e centralizar contador. |
| `src/components/community/CommunityMessagesPanel.tsx` | Fallback polling de conversa ativa quando realtime falha. | Medio | Pode subir bastante se chat ficar aberto. | Backoff e limite de tentativas. |
| `src/components/community/docente/ComunidadeDocenteGroupChat.tsx` | Fallback polling a cada 12s quando realtime falha. | Medio/Alto | Alto em grupos abertos. | Backoff e pausa por visibilidade. |
| `src/components/planos/PlanosSucessoActions.tsx` | Polling `/api/access/status` a cada 4s no sucesso do checkout. | Alto | Varios hits no momento pos-pagamento. | Limitar tentativas e parar com condicoes claras. |
| `src/components/bncc/DirectorPanelClient.tsx` | Polling do dashboard gestor no overview. | Medio | Recorrente em painel gestor. | Pausar por visibilidade. |
| `src/app/admin/components/AdminActivityFeed.tsx` | Polling admin activity feed. | Baixo/Medio | Restrito a admin. | Manter ou pausar por visibilidade. |
| `src/components/google/GoogleDocumentExportBar.tsx` | Intervalo client-only de sync visual. | Baixo | Nao chama API diretamente. | Sem prioridade. |
| `src/components/google/GoogleClassroomPanel.tsx` | Intervalo client-only de sync visual. | Baixo | Nao chama API diretamente. | Sem prioridade. |
| `src/components/google/GoogleClassroomPopoverButton.tsx` | Intervalo client-only de sync visual. | Baixo | Nao chama API diretamente. | Sem prioridade. |
| `src/hooks/useAutoGoogleExport.ts` | Intervalo client-only aguardando HTML. | Baixo | Nao chama API ate exportacao real. | Sem prioridade. |
| `src/components/PlanifyFieldEnhancer.tsx` | Intervalo client-only de DOM. | Baixo | Sem Function call. | Sem prioridade. |

## Proxy / middleware

Arquivo analisado: `src/proxy.ts`.

Matcher atual:

```text
/dashboard/:path*
/planejamentos/:path*
/materiais/:path*
/inclusao/:path*
/editor/:path*
/historico/:path*
/biblioteca/:path*
/marketplace/:path*
/comunidade/:path*
/progresso-bncc/:path*
/bncc/:path*
/diretor/:path*
/gestor/:path*
```

Conclusao:

- O proxy nao executa nas rotas publicas principais: `/`, `/login`, `/planos`, `/contato`, `/termos`, `/privacidade`, `/escolas`.
- O proxy nao executa globalmente em `/api`.
- O escopo esta adequado para consumo de CPU.
- Existe uma diferenca a revisar depois: `protectedRoutes` contem `/admin`, mas `src/proxy.ts` ignora `/admin` explicitamente. Isso nao e problema de consumo, mas merece revisao de seguranca/admin antes de qualquer mudanca.

## Funcoes pesadas

### IA

| API | Arquivo | Observacao | Risco de consumo |
| --- | --- | --- | --- |
| `/api/materiais/gerar-stream` | `src/app/api/materiais/gerar-stream/route.ts` | Geracao IA streaming, `maxDuration 300`. | Alto esperado. |
| `/api/materiais/gerar` | `src/app/api/materiais/gerar/route.ts` | Geracao IA nao streaming, `maxDuration 300`. | Alto esperado. |
| `/api/planejamentos/gerar-ia` | `src/app/api/planejamentos/gerar-ia/route.ts` | Planejamento com IA, `maxDuration 300`. | Alto esperado. |
| `/api/pei/gerar` | `src/app/api/pei/gerar/route.ts` | PEI com IA, `maxDuration 300`. | Alto esperado. |
| `/api/inclusao/adaptar` | `src/app/api/inclusao/adaptar/route.ts` | Inclusao/adaptacao IA, `maxDuration 300`. | Alto esperado. |
| `/api/aula-completa/gerar` | `src/app/api/aula-completa/gerar/route.ts` | Aula completa IA. | Alto esperado. |
| `/api/aula-completa/gerar-stream` | `src/app/api/aula-completa/gerar-stream/route.ts` | Aula completa streaming. | Alto esperado. |
| `/api/aula-completa/regenerar-item` | `src/app/api/aula-completa/regenerar-item/route.ts` | Regeneracao parcial. | Medio/Alto. |
| `/api/correcao/avaliar` | `src/app/api/correcao/avaliar/route.ts` | Correcao IA, `maxDuration 120`. | Alto esperado. |
| `/api/correcao/avaliar-lote` | `src/app/api/correcao/avaliar-lote/route.ts` | Correcao em lote, `maxDuration 180`. | Alto esperado. |
| `/api/correcao/extrair` | `src/app/api/correcao/extrair/route.ts` | Extracao/OCR/media, `maxDuration 60`. | Alto esperado. |
| `/api/public/lesson-simulator` | `src/app/api/public/lesson-simulator/route.ts` | Demo publica; potencialmente sensivel por ser publica. | Alto se trafego publico. |
| `/api/public/planning-trial/gerar` | `src/app/api/public/planning-trial/gerar/route.ts` | Trial publico com rate-limit/cookies. | Alto se trafego publico. |

Recomendacao: nao alterar IA nesta etapa. Depois da aprovacao, priorizar idempotencia, limites e debounce nos chamadores, sem mudar prompts ou resultado.

### DOCX / PDF / Export

| API | Arquivo | Observacao | Risco |
| --- | --- | --- | --- |
| `/api/documentos/docx` | `src/app/api/documentos/docx/route.ts` | Gera DOCX. | Medio. |
| `/api/documentos/export` | `src/app/api/documentos/export/route.ts` | Export html/docx/pdf, `maxDuration 60`. | Medio/Alto. |
| `/api/planejamentos/docx` | `src/app/api/planejamentos/docx/route.ts` | Alias/rota oficial. | Medio. |
| `/api/planejamentos/docx-oficial` | `src/app/api/planejamentos/docx-oficial/route.ts` | DOCX oficial. | Medio. |
| `/api/planejamentos/gerar-docx` | `src/app/api/planejamentos/gerar-docx/route.ts` | Alias/compatibilidade. | Medio. |
| `/api/planejamentos/docx-pacote` | `src/app/api/planejamentos/docx-pacote/route.ts` | Pacote DOCX. | Medio/Alto. |
| `/api/correcao/exportar-pdf` | `src/app/api/correcao/exportar-pdf/route.ts` | PDF de correcao. | Medio. |

Recomendacao: manter como esta ate aprovacao. Melhorias seguras futuras seriam cache privado por artefato ja gerado ou evitar cliques duplos no cliente.

### BNCC

| API/arquivo | Observacao | Risco |
| --- | --- | --- |
| `src/app/api/bncc/sugerir/route.ts` | Sugestao BNCC privada. | Medio/Alto. |
| `src/app/api/planejamentos/habilidades/route.ts` | Sugestao de habilidades para planejamentos. | Medio/Alto. |
| `src/app/api/public/planning-trial/sugerir-bncc/route.ts` | Sugestao publica para trial. | Alto se trafego publico. |
| `src/app/api/bncc/autocomplete/route.ts` | Autocomplete. | Medio. |
| `src/app/api/bncc/catalog/options/route.ts` | Opcoes de catalogo. | Baixo/Medio. |
| `src/app/api/bncc/progress/route.ts` | Progresso por usuario/escola. | Medio. |
| `src/server/bncc/bncc-catalog-service.ts` | Ja possui caches em memoria por instancia. | Positivo. |
| `src/server/bncc/bncc-suggestion-engine.ts` | Ja possui cache de catalogo em memoria por instancia. | Positivo. |

Recomendacao: nao alterar BNCC sem aprovacao. Possivel melhoria segura posterior: cache por payload para sugestoes repetidas e limite/debounce no cliente.

### Supabase / Auth

| Arquivo | Observacao | Risco |
| --- | --- | --- |
| `src/app/api/access/status/route.ts` | Endpoint de status central, pesado e no-store. | Alto. |
| `src/server/auth/premium-access-service.ts` | Verifica usuario, perfil e assinatura via Supabase Admin. | Alto quando chamado em excesso. |
| `src/lib/auth/session-client.ts` | Sincroniza cookies de acesso; tem cooldown/inflight de 12s. | Medio, ja tem mitigacao. |
| `src/components/premium/PremiumAccessGate.tsx` | Pode tentar resolver acesso com retries em area privada. | Medio, esperado para UX auth. |

Recomendacao: primeira otimizacao deve ser reduzir chamadas publicas/duplicadas, nao mudar regras de permissao.

### Stripe

| API/arquivo | Observacao | Risco |
| --- | --- | --- |
| `/api/stripe/webhook` | Webhook essencial, dinamico, valida assinatura. | Alto esperado, nao mexer sem aprovacao. |
| `/api/stripe/checkout` | Checkout. | Medio/Alto. |
| `/api/stripe/checkout-session` | Consultado no sucesso. | Medio. |
| `/api/stripe/activate-account` | Pode sincronizar assinatura por email. | Alto em fluxo pos-pagamento. |
| `src/components/planos/PlanosSucessoActions.tsx` | Polling de status apos checkout. | Alto se prolongado. |

Recomendacao: otimizar apenas tentativas/polling no cliente, mantendo webhook/checkout intactos.

### Google Drive / Classroom / Forms

| API | Observacao | Risco |
| --- | --- | --- |
| `/api/google/status` | Verifica tokens e escopos; pode ser chamado por varios componentes. | Medio/Alto. |
| `/api/google/docs/export` | Exporta para Google Docs, `maxDuration 120`. | Alto esperado. |
| `/api/google/drive/export` | Exporta para Drive, `maxDuration 120`. | Alto esperado. |
| `/api/google/forms/export` | Cria Forms e batchUpdate, `maxDuration 120`. | Alto esperado. |
| `/api/google/classroom/export` | Compartilha/publica no Classroom. | Alto esperado. |
| `/api/google/classroom/share` | Alias/handler similar ao export. | Alto esperado. |
| `/api/google/classroom/courses` | Lista turmas/cursos. | Medio. |

Recomendacao: nao alterar integracao; apenas deduplicar status/listas no cliente apos aprovacao.

## Paginas publicas que podem ser estaticas/cacheaveis

| Rota | Arquivo | Pode ser estatica? | Observacao |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Parcialmente | Landing poderia ser estatica, mas hoje usa `searchParams` para redirect legado e componentes que chamam status auth. |
| `/planos` | `src/app/planos/page.tsx` | Provavelmente | Query params podem ser tratados no cliente. |
| `/contato` | `src/app/contato/page.tsx` | Sim | API apenas no submit. |
| `/termos` | `src/app/termos/page.tsx` | Sim | Conteudo legal. |
| `/privacidade` | `src/app/privacidade/page.tsx` | Sim | Conteudo legal. |
| `/escolas` | `src/app/escolas/page.tsx` | Provavelmente | Validar formulario/CTA antes. |
| `/planos/ativar` | `src/app/planos/ativar/page.tsx` | Provavelmente | Shell estatico, formulario cliente. |
| `/planos/sucesso` | `src/app/planos/sucesso/page.tsx` | Com cuidado | Fluxo Stripe/auth; precisa aprovacao especifica. |

FAQ parece estar embutido em componentes de planos/landing; nao foi encontrada rota `/faq`.

## Logs

Achados:

- Nao foi encontrado volume obvio de `console.log` em loop publico.
- Logs de erro/warn em rotas pesadas parecem normais para diagnostico.
- `src/server/telemetry/generation-telemetry.ts` registra eventos de geracao; pode gerar logs por geracao, mas isso parece intencional.
- `src/lib/debug/agent-debug-log.ts` e condicionado a ambiente e nao aparenta rodar em producao normal.

Recomendacao: manter logs por enquanto. Se a Vercel mostrar custo alto de logs, revisar somente logs de geracao/admin com sample rate.

## Crons Vercel

Arquivo analisado: `vercel.json`.

```text
/api/cron/corpus-sync - diario 05:00
/api/cron/pedagogico/refresh - diario 06:00
/api/cron/pedagogico/ingest - semanal domingo 07:00
```

Impacto: consumo agendado esperado. Como sao rotas potencialmente pesadas, monitorar duracao e falhas. Nao alterar sem aprovacao.

## Plano seguro pos-aprovacao

Prioridade 1 - reduzir consumo publico sem mexer em ferramentas:

1. Deduplicar `/api/access/status` entre header/footer publico.
2. Evitar que paginas publicas anonimas chamem status completo de premium/admin/owner quando nao houver sessao.
3. Tornar `/termos`, `/privacidade` e `/contato` estaticas se validado.

Prioridade 2 - reduzir dinamismo publico:

1. Avaliar `/planos`, `/escolas` e `/planos/ativar` para remover `force-dynamic`.
2. Preservar layout e texto integralmente.

Prioridade 3 - reduzir chamadas recorrentes:

1. Pausar polling de comunidade, admin e BNCC quando a aba estiver invisivel.
2. Adicionar backoff em fallback de chat.
3. Limitar polling de `/planos/sucesso` sem alterar fluxo Stripe.

Prioridade 4 - integracoes:

1. Dedupe de `/api/google/status`.
2. Dedupe de lista de cursos Classroom enquanto painel esta aberto.
3. Nao alterar Google/Stripe/Supabase/BNCC/IA/DOCX sem aprovacao especifica.

Prioridade 5 - loop mobile:

1. Confirmar commit/deploy real em producao, pois a landing servida em producao aparenta divergir da arvore local.
2. Corrigir apenas o componente/CSS que estiver ativo no deploy real.
3. Validar em 320px, 360px, 390px e 418px antes de commit/push/deploy.

## Status final desta etapa

- Relatorio criado.
- Nenhuma correcao de codigo funcional aplicada.
- Nenhum layout alterado.
- Nenhum fluxo de Planejamentos, Materiais, PEI, Editor, Login, Supabase, Stripe, DOCX, Google Drive/Classroom ou paginas publicas foi modificado.
- Aguardando aprovacao para aplicar as mudancas seguras.

## Atualizacao pos-aprovacao

Data: 2026-06-30

Melhorias aplicadas apos aprovacao do responsavel:

- Dedupe client-side de `/api/access/status`, preservando a API e o contrato de autenticacao.
- Header/footer publico passaram a compartilhar a mesma leitura de status, reduzindo chamadas duplicadas.
- Paginas publicas `/contato`, `/escolas`, `/planos`, `/planos/ativar`, `/privacidade` e `/termos` deixaram de forcar render dinamico.
- `/planos` passou a ler alertas de query string em componente cliente, mantendo os mesmos textos e layout.
- Pollings de comunidade, chat, painel gestor BNCC, feed admin e sucesso do checkout passaram a pausar quando a aba esta oculta.
- Polling do sucesso do checkout ganhou parada automatica quando resolve ou expira, sem alterar Stripe/webhook.
- Status Google e lista de turmas Classroom ganharam cache curto em memoria da aba, sem cachear exportacoes.
- Landing mobile recebeu guardas de overflow/containment em ferramentas e bloco de exemplos.
- Marca Planify em materiais/exportacoes foi reduzida para assinatura discreta e profissional.

Validacoes executadas:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Playwright mobile em 320px, 360px e 418px sem overflow horizontal.
- Home local passou de 2 para 1 chamada a `/api/access/status` por carregamento anonimo.
- `/planos?checkout=cancelled` manteve o alerta esperado.
