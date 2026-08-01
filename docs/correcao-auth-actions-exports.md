# Correção — Auth actions exports

## Erro

```text
Module "./actions" has no exported member "signInWithPassword".
```

## Causa

A autenticação antiga foi neutralizada para remover loop de login, mas `src/server/auth/index.ts` ainda exportava funções antigas.

## Correção

```text
1. Recriados exports de compatibilidade:
   - signInWithPassword
   - signUpWithPassword
   - signOut
   - signIn
   - signUp

2. Essas funções não reativam o controle premium antigo.
3. Dashboard continua controlado por middleware + cookie planify_access.
```

## Arquivos

```text
src/server/auth/actions.ts
src/server/auth/index.ts
```
