# Especificação Técnica de Atualizações - BarberPro

Este documento detalha as mudanças arquiteturais e as novas implementações realizadas no ciclo de refatoração recente.

## 1. Sistema de Roteamento e Multi-tenancy

### Migração para BrowserRouter
Substituímos o `HashRouter` pelo `BrowserRouter` para eliminar o `#` das URLs, melhorando o profissionalismo da plataforma e facilitando a integração com domínios personalizados.

### Roteamento Baseado em Slugs (`/:shopSlug`)
Implementamos uma estratégia de identificação dinâmica:
- **Lógica**: O `ShopContext` extrai o primeiro segmento da URL (`pathname.split('/')[1]`) e o utiliza como slug para identificar a barbearia.
- **Fallback**: Caso o slug não seja fornecido ou seja inválido, o sistema utiliza o cache local ou redireciona para a página de exploração.
- **Segurança**: O `ProtectedRoute` agora valida se o `shopId` do usuário logado (Admin/Barbeiro) coincide com o `shop.id` da URL, impedindo acessos cruzados não autorizados.

## 2. Refatoração do Painel Administrativo

O `AdminDashboard.tsx` foi decomposto em componentes modulares localizados em `src/pages/admin/tabs/`:
- **FinancialTab**: Centraliza a saúde financeira, DRE e histórico.
- **StockTab**: Gerencia movimentações de produtos.
- **TeamTab**: Gestão de profissionais e permissões.

## 3. Sistema White-Label (Personalização)

A barbearia agora é configurada através de tokens dinâmicos injetados no CSS:
- **Cores**: `--tenant-primary` é definida no `App.tsx` baseado nas configurações da loja.
- **Conteúdo**: Landing page (`Home.tsx`) totalmente parametrizável (Texto de Hero, Subtítulo, Imagens).
- **Redes Sociais**: Integração dinâmica com links de WhatsApp e Instagram.

## 4. Correções e Estabilidade

- **Timezones**: Padronização da criação de agendamentos para evitar discrepâncias de datas entre frontend e backend.
- **Imagens**: Implementação de tratamento para imagens quebradas no cache local.
- **Vercel Layout**: Configuração de `vercel.json` para suportar o roteamento do lado do cliente (SPA).

## 5. Próximos Passos (Backlog)

1. **Dashboard do Barbeiro**: Refatorar para seguir o padrão modular do Admin.
2. **Notificações em Tempo Real**: Implementação de WebSockets para alertas de novos agendamentos.
3. **PWA**: Adição de service workers para funcionalidade offline básica.

---
*Documento preparado pela equipe de engenharia para fins de histórico e handover.*
