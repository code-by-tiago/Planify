# Planify — 9.14.10 — Padrão professor anual

## Base pedagógica usada

A etapa foi ajustada conforme o planejamento anual real enviado como referência.

## Regras aplicadas

### Planejamento anual

Os conteúdos são distribuídos entre os trimestres.

Dentro de cada trimestre, a numeração das aulas reinicia:

```text
1º trimestre:
1 a 10
11 a 20
21 a 30
31 a 40

2º trimestre:
1 a 10
11 a 20
21 a 30
31 a 40

3º trimestre:
1 a 10
11 a 20
21 a 30
31 a 40
```

Cada conteúdo ocupa:

```text
10 período(s)
```

### Habilidades BNCC

A coluna Habilidades recebe:

```text
Código — descrição completa
```

Exemplo:

```text
EM13LP08 — Analisar elementos e aspectos da sintaxe do Português...
```

### Campos finais de cada trimestre

O motor mantém o preenchimento conforme o modelo oficial:

```text
Projetos interdisciplinares
Temas integradores e competências socioemocionais
Instrumentos de avaliação
```

### Modelo oficial

Continua usando exatamente:

```text
C:\planify\data\modelos-oficiais\modelo-anual.docx
C:\planify\data\modelos-oficiais\modelo-trimestral.docx
```

Não recria documento, não muda layout e não substitui o corpo inteiro do Word.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

Na tela `/planejamentos`:

```text
1. Sugerir BNCC
2. Gerar planejamento com IA
3. Baixar DOCX oficial
```
