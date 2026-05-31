# Correção — Access Cookie Role

## Erro

```text
Type 'string' is not assignable to type 'AccessRole'.
```

## Causa

O serviço premium retorna `role` como string, mas o cookie `planify_access` espera um tipo fechado.

## Correção

```text
admin -> admin
qualquer outro -> teacher
```

## Arquivo corrigido

```text
src/app/api/auth/access-cookie/route.ts
```
