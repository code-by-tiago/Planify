# Planify — Revisão Final da Etapa 8

## Objetivo

Fechar a base visual e estrutural antes da Etapa 9 — Gemini IA.

## Áreas revisadas

```text
/
/login
/planos
/contato
/dashboard
/planejamentos
/materiais
/editor
/historico
/biblioteca
/marketplace
/marketplace/novo
/admin
```

## Separação das áreas

```text
Planejamentos = BNCC oficial, seleção manual e prévia.
Materiais = estrutura visual para atividades, provas, apostilas, jogos e sequências.
Editor = revisão e preparação de documentos.
Histórico = organização dos documentos e itens gerados/salvos.
Biblioteca = materiais premium oficiais e curados pelo admin.
Marketplace = troca entre professores.
Admin = gestão do dono do SaaS.
Planos = assinatura e acesso premium.
Contato = suporte e atendimento.
```

## Antes da Gemini

A Gemini não deve:

```text
inventar habilidades BNCC
alterar códigos BNCC oficiais
substituir o JSON oficial
gerar DOCX nesta etapa
salvar em banco sem etapa própria
```

A Gemini deve:

```text
usar dados preenchidos pelo professor
usar somente habilidades BNCC selecionadas pelo professor
gerar planejamento estruturado
gerar material didático estruturado
retornar conteúdo pronto para prévia e editor
```

## Auditoria

Rode:

```powershell
node scripts/planify/auditar-rotas.cjs
npm run build
```

Se ambos passarem, a Etapa 8 está pronta para a Etapa 9.
