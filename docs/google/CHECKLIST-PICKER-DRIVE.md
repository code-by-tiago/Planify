# Checklist rápido — Google Picker (Drive na Comunidade)

O código e o `.env.local` já estão preparados.
Falta só criar a API Key no Google Cloud (você precisa estar logado no projeto).

## Já feito por mim
- [x] Código do botão Drive no composer
- [x] Rotas `/api/google/picker/token` e `/api/google/drive/import`
- [x] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = mesmo valor de `GOOGLE_CLIENT_ID` no `.env.local`
- [x] Placeholders `GOOGLE_API_KEY=` e `GOOGLE_CLOUD_PROJECT_NUMBER=` no `.env.local`

## Você faz agora (5–10 min)

### 1) Ativar a API
Abra: https://console.cloud.google.com/apis/library/picker.googleapis.com
- Selecione o **mesmo projeto** do OAuth do Planify
- Clique em **Ativar**

### 2) Criar API Key
Abra: https://console.cloud.google.com/apis/credentials
- **+ Criar credenciais** → **Chave de API**
- Clique em **Restringir chave**
- Restrições de aplicativo: **Referenciadores HTTP**
  - `http://localhost:3000/*`
  - `https://SEU-DOMINIO.com/*` (produção)
- Restrições de API: marque **Google Picker API** (e Drive API se aparecer)
- Salve e **copie a chave**

### 3) Colar no `.env.local`
```env
GOOGLE_API_KEY=cole_a_chave_aqui
```

Opcional (melhora o Picker):
- IAM e administração → Configurações → **Número do projeto**
```env
GOOGLE_CLOUD_PROJECT_NUMBER=123456789012
```

### 4) Reiniciar o Next
```bash
# pare o dev server e suba de novo
npm run dev
```

### 5) Testar
1. Comunidade → Criar publicação → botão **Drive**
2. Conecte Google se pedir
3. Escolha um PDF/DOCX e publique

## Produção (Vercel)
Adicione as mesmas variáveis no painel da Vercel:
- `GOOGLE_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (mesmo Client ID)
- `GOOGLE_CLOUD_PROJECT_NUMBER` (opcional)
