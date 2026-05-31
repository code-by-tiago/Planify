# Planify — 9.21.1 — Planejamentos: campos inteligentes e BNCC pós-deploy

## Problemas corrigidos

```text
Língua Espanhola não aparecia nas opções do Ensino Médio
Campos exigiam apagar manualmente para listar novamente
Campo Conteúdos abria lista indevida
Área/Componente não sincronizavam perfeitamente com a etapa
Sugestões BNCC vinham em excesso e repetidas visualmente
```

## O que muda

```text
Clique/foco no campo mostra a lista completa novamente
Digitar filtra a lista
Etapa altera opções de Ano/Série, Área e Componente
Ensino Médio mostra Língua Espanhola em Linguagens e suas Tecnologias
Campo Conteúdos não abre mais menu inteligente
Lista BNCC exibida é filtrada visualmente:
- sem códigos repetidos
- até 3 habilidades por conteúdo
- máximo visual seguro
```

## O que não muda

```text
Motor DOCX
API de geração
IA Gemini
Stripe
Supabase
Banco
Login
Assinaturas
Biblioteca real
Marketplace real
Admin
Editor funcional
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-21-1-planejamentos-campos-bncc-pos-deploy.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Enviar para GitHub/Vercel

```powershell
cd C:\planify
git add src/components/PlanifyFieldEnhancer.tsx src/app/globals.css scripts/planify/ui/aplicar-planejamentos-campos-bncc-9-21-1.cjs scripts/planify/ui/auditoria-planejamentos-campos-bncc-9-21-1.cjs docs/9-21-1-planejamentos-campos-bncc-pos-deploy.md
git commit -m "fix: ajustar campos inteligentes e filtro BNCC em planejamentos"
git push
```

A Vercel deve fazer redeploy automático.

## Testar no site publicado

```text
/planejamentos

1. Selecione Ensino Médio
2. Clique em Área de conhecimento
3. Escolha Linguagens e suas Tecnologias
4. Clique em Componente curricular
5. Verifique Língua Espanhola
6. Clique novamente sem apagar: lista deve abrir completa
7. Clique em Conteúdos: não deve abrir lista de área/componente
8. Gere sugestões BNCC: lista deve aparecer mais enxuta, sem duplicações visuais
```
