# Refatoração e Integração: Migração de Mock para Produção

## Frontend
- [x] Scan `src/services/` for mocks, static JSONs, and `setTimeout`
- [x] Scan `src/api/` for mocks, static JSONs, and `setTimeout`
- [x] Remove mocks and simulate network latency
- [x] Validate that all network calls point to real API endpoints

## Backend
- [x] Scan Controllers in `src/controllers/`
- [x] Validate that endpoints match the real API endpoints called by Frontend

## Validation and Defects
- [x] Compare Frontend endpoints against Backend routes and controllers
- [x] Create `DEFECTS.md`
- [x] Map and list any endpoint called by the Front that doesn't have a functional correspondence in the Back in `DEFECTS.md`

## Task 2: Protocolo de Testes E2E (Sem Mocks)
### Autenticação
- [x] Executar Smoke Tests para Login e Cadastro (SuperAdm, Adm, Barbeiro, Cliente)
- [x] Testar cenários de erro (Bad Request, Unauthorized)

### Multi-Tenancy
- [x] Verificar se filtro de ID da barbearia (`shopId`) é aplicado em queries vitais
- [x] Garantir bloqueio de vazamento de dados entre diferentes tenants

### Fluxos de Negócio
- [x] Criar, editar e listar agendamentos
- [x] Validar recuperação real do Banco no Histórico de Agendamentos
- [x] Garantir corretude dos gatilhos nos botões e modais de UI

## Task 3: Auditoria Financeira e Dashboards
- [x] Validar lógica de cálculo do Dashboard Financeiro (Front vs Back)
- [x] Identificar 3 pontos de melhoria de UX/performance para o Dashboard

## Task 4: Security Scan (PenTest Básico)
- [x] Verificar sanitização de inputs contra SQL Injection (Prisma/Controllers)
- [x] Validar que fluxo de autenticação não expõe segredos em logs ou LocalStorage

## Finalização (QA)
- [x] Criar `KLYPBARBER_QA_REPORT.md` completo (Bugs, CRUDs, Segurança)

## Task 5: Refatoração do AdminDashboard
- [x] Extrair sub-componentes (Financial, Team, Services, Products)
- [x] Reduzir complexidade do AdminDashboard.tsx

## Task 6: Visualização de Custos (Pie Chart)
- [x] Implementar gráfico de composição de despesas no dashboard financeiro

## Task 7: Otimização de Cache e Estado
- [x] Implementar lógica de cache de dados para evitar re-fetches desnecessários

## Task 8: Preparação PWA (Progressive Web App)
- [x] Validar manifesto web e ícones (`manifest.json` / Vite PWA Plugin)
- [x] Garantir Service Worker operante para caching offline-first e resiliência de rede
- [x] Avaliar a UX mobile (Toques, SafeArea, Navegação fluida)

## Task 9: Production Build & QA Final
- [x] Validar e otimizar variáveis de ambiente para Produção
- [x] Executar build de produção (`npm run build`) e resolver avisos/erros
- [x] Testar fluidez e tempo de carregamento no bundle final
