# Planify — 9.14.3 — Modelos oficiais reais

## Objetivo

Corrigir o problema do DOCX genérico.

Agora o motor de planejamento usa os arquivos DOCX oficiais do projeto como base.

## Onde os modelos devem estar

Preferencialmente:

```text
C:\planify\data\modelo-anual.docx
C:\planify\data\modelo-trimestral.docx
```

Também são aceitos nomes contendo:

```text
anual
trimestral
```

em:

```text
data
resources
public
src
templates
```

## Regra importante

Se o modelo oficial não for encontrado, o Planify não gera documento genérico escondido.

Ele mostra erro claro pedindo o modelo oficial.

## O que o motor faz

```text
1. Lê o DOCX oficial.
2. Usa propriedades e tabela do modelo oficial como base.
3. Remove cabeçalhos/rodapés/imagens para não manter logotipo ou escola antiga.
4. Recria o corpo com dados reais do professor.
5. Mantém anual e trimestral separados.
6. Preenche conteúdos, aulas, habilidades BNCC, objetivos, metodologia, recursos e avaliação.
7. Não mantém textos vermelhos/placeholders.
```

## Arquivo principal

```text
src/server/planejamentos/official-planning-docx.ts
```

## Verificar modelos

```powershell
cd C:\planify
node scripts\planify\planejamentos\verificar-modelos-oficiais.cjs
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

Depois abrir:

```text
http://localhost:3000/planejamentos
```

Gerar novamente o DOCX.
