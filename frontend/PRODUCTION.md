# BarberPro - Guia de Produção & Deploy

Este documento descreve as configurações e procedimentos necessários para o deploy em produção do sistema BarberPro.

## 🚀 Checklist de Lançamento

1. **Variáveis de Ambiente**:
   - `VITE_API_URL`: Deve apontar para a URL do seu backend em produção (ex: `https://api.clipbarber.com/api`).
   - `GEMINI_API_KEY`: Chave da API Google Gemini para análise de IA (opcional).

2. **Build de Produção**:
   - Execute `npm run build` na pasta `frontend`.
   - Os arquivos gerados estarão na pasta `dist/`.

3. **Deploy**:
   - Faça o upload do conteúdo de `dist/` para seu provedor de hospedagem estática (Vercel, Netlify, S3, etc).
   - Certifique-se de que o roteamento está configurado para um app SPA (redirecionar 404 para `index.html`).

## 🛠️ Arquitetura Clean & Segura

Como desenvolvedores sêniores, aplicamos os seguintes princípios para este lançamento:

- **Strict Mode**: O sistema não aceita fallbacks de `localhost` em produção, forçando a configuração correta de DNS.
- **Data Integrity**: Todos os dados mockados foram removidos. O estado inicial do app é limpo, populando-se apenas via chamadas autenticadas ao banco de dados real.
- **PWA Ready**: Manifesto e Service Workers configurados com cache inteligente para alta performance e suporte offline em produção.
- **Typescript strict**: Garantia de tipos em todo o fluxo de dados entre frontend e backend.

## 🔐 Segurança

- **JWT Rotation**: Implementada lógica de refresh token automática no `ApiClient`.
- **Multitenancy**: O `shopId` é verificado em todas as requisições. Trocas de loja são validadas pelo backend via permissões granulares.
- **Clean Code**: Remoção completa de logs de depuração e placeholders sensíveis.

---
© 2026 BarberPro Team - Senior Development Standards
