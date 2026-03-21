# BarberPro - Documentação Técnica do Projeto (2026)

Este documento representa o estado atual ("Source of Truth") do frontend do BarberPro, consolidando a arquitetura original com todas as refatorações e melhorias de alta performance implementadas recentemente.

---

## 🏗️ 1. Arquitetura e Roteamento

### Migração para URLs Limpas (BrowserRouter)
A aplicação abandonou o `HashRouter` em favor do `BrowserRouter`. Isso permite uma navegação profissional e otimizada para SEO, essencial para uma plataforma SaaS.

### Sistema Multi-tenant Dinâmico (`/:shopSlug`)
A identificação da barbearia agora é feita via slug na URL.
- **Roteamento**: `klypbarber.com.br/barbearia-centro/servicos`
- **Lógica**: O `ShopContext` monitora a URL em tempo real e carrega as configurações da loja baseada no primeiro segmento do caminho.
- **Segurança**: Admins e Barbeiros são validados contra o `shopId` da URL, impedindo acesso a dados de outras unidades via troca manual de slug.

## 🧱 2. Estrutura de Pastas Evoluída

```text
src/
├── components/
│   ├── admin/tabs/     # Componentes modulares do Dashboard (Financeiro, Estoque, Time)
│   ├── layout/         # Componentes de grade e responsividade
│   └── ui/             # Design System interno (Botões, Cards, Modais)
├── context/            # ShopContext (Sincronizado c/ URL), AuthContext, NotificationContext
├── pages/
│   ├── admin/          # AdminDashboard simplificado (decomposto em abas)
│   ├── barber/         # Agenda e métricas do profissional
│   └── client/         # Dashboard e fluxo de agendamento do cliente
├── services/           # Camada de API com interceptores JWT e tratamento de erros 401
└── App.tsx              # Router Central com redirecionamentos inteligentes (English -> PT)
```

## 🎨 3. Motor White-Label e Personalização

Cada barbearia é um "tenant" com identidade única:
- **Design System Dinâmico**: As cores da marca (`--tenant-primary`) e logotipos são injetados no CSS e Layout sob demanda.
- **Páginas Parametrizáveis**: A Landing Page (`Home.tsx`) ajusta automaticamente o texto do Hero, subtítulos, amenidades e redes sociais com base nos dados do banco.

## 📊 4. Módulo Administrativo Modular

O painel administrativo foi refatorado para suportar crescimento sem perda de performance:
- **Financeiro**: Cálculos automáticos de comissão, saúde financeira e relatórios DRE.
- **Estoque**: Histórico de movimentações e controle de saldo.
- **Vercel Layout**: Configurado via `vercel.json` para suportar rotas de cliente (SPAs).

## ✅ 5. O que foi Concluído (Resumo)

- [x] Refatoração completa de rotas para `/slug/caminho`.
- [x] Sistema de identificação de loja em tempo real via URL.
- [x] Implementação de White-Label (Hero, Cores, Logos).
- [x] Modularização do Dashboard Financeiro e de Estoque.
- [x] Correção de Timezones e Sincronização de Agendamentos.
- [x] Configuração de ambientes: `dev`, `stage` (produção-like) e `prod`.

## 🛠️ 6. Próximos Passos (Backlog)

1. **Agenda do Barbeiro**: Refatorar a visualização do calendário para o padrão modular.
2. **Notificações Push**: Implementar alertas nativos no navegador para confirmados/cancelados.
3. **PWA**: Adição de Manifesto e Service Worker para experiência de App instalado.
4. **Relatórios em PDF**: Exportação direta de fechamentos de caixa e DRE.

---
*BarberPro Engineering - 2026*
