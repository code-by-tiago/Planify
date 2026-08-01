# Correção — /sair volta automaticamente para o início

## Problema

A página `/sair` limpava sessão/cookie, mas podia ficar parada na tela "Saindo com segurança".

## Correção

```text
1. signOutPlanify agora tem timeout para não travar.
2. /sair redireciona automaticamente para /.
3. /logout também redireciona para /.
4. A tela tem botão de fallback "Voltar ao início agora".
```

## Arquivos

```text
src/lib/auth/session-client.ts
src/app/sair/page.tsx
src/app/sair/SairClient.tsx
src/app/logout/route.ts
```

## Teste

```text
1. Faça login.
2. Acesse /sair.
3. A página deve voltar automaticamente para /.
```
