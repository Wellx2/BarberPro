# BarberPro Frontend

BarberPro é uma solução SaaS multi-tenant avançada para gestão de barbearias, focada em oferecer uma experiência premium tanto para proprietários quanto para clientes.

## 🚀 Visão Geral

O projeto foi construído para ser altamente escalável e personalizável (White-Label), permitindo que cada barbearia tenha sua própria identidade visual, catálogo de serviços e regras de negócio, tudo sob um único ecossistema robusto.

## ✨ Principais Funcionalidades

- **Multi-tenancy Dinâmico**: Identificação automática da barbearia através de slugs na URL (ex: `klypbarber.com.br/centro`).
- **White-Label Completo**: Personalização de cores, logotipos, banners e informações de contato pelo painel administrativo.
- **Gestão Financeira**: Módulo de fluxo de caixa, comissões de barbeiros e relatórios DRE (Demonstrativo de Resultados).
- **Agendamento Inteligente**: Fluxo simplificado para clientes com seleção de profissional, serviço e horário em tempo real.
- **Painel Administrativo Modular**: Gestão de estoque, serviços, profissionais e assinaturas.
- **Design Premium**: Interface moderna com suporte a Dark Mode e micro-animações.

## 🛠️ Stack Tecnológica

- **Core**: React 18 + TypeScript
- **Roteamento**: React Router v6 (BrowserRouter para URLs limpas)
- **Estilização**: Tailwind CSS + CSS Variáveis (Tokens de Marca)
- **Build**: Vite
- **Comunicação**: Axios (com interceptores para segurança JWT)
- **Ícones**: Lucide React

## 🔄 Atualizações Recentes (Refatoração Crítica)

Recentemente, o projeto passou por uma grande evolução arquitetural:
1. **Migração de HashRouter para BrowserRouter**: URLs mais limpas e amigáveis para SEO.
2. **Sistema de Slugs**: Implementação de `/:shopSlug` para permitir URLs personalizadas por barbearia.
3. **Refatoração do Admin**: Consolidação dos módulos financeiros e de estoque em abas modulares.
4. **Otimização de Performance**: Redução de renderizações desnecessárias e melhor gestão de estado via Context API.

## 📦 Como Iniciar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente:
   Crie um arquivo `.env` baseado no `.env.example`.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
4. Para publicar sua aplicação na internet, consulte o arquivo **[DEPLOY.md](./DEPLOY.md)** com o guia passo-a-passo.

---
*BarberPro - Elevando o nível da sua barbearia.*
