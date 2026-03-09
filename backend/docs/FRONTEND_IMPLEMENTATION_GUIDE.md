# 🎨 Guia de Implementação Frontend - Rotas Públicas de Barbearias

## 📋 Resumo do que foi implementado no Backend

### ✅ Ajustes Realizados

1. **Decorator `@Public()` criado**
   - Permite marcar rotas que não precisam de autenticação
   - Arquivo: `src/common/decorators/public.decorator.ts`

2. **JwtAuthGuard modificado**
   - Agora respeita o decorator `@Public()`
   - Routes marcadas como públicas não validam JWT

3. **Rotas públicas criadas no BarbershopsController**
   - `GET /api/barbershops/public` - Lista todas barbearias
   - `GET /api/barbershops/public/:shopId` - Detalhes + preview (3 serviços, 3 produtos, 3 barbeiros)

4. **Service methods implementados**
   - `findAllPublic()` - Busca com filtro opcional por nome/endereço
   - `findOnePublic()` - Retorna shop + top 3 itens de cada categoria

5. **Correções técnicas**
   - Campos ajustados: `logo` (Barbershop) e `avatar` (Barber)
   - Ordenação implementada: preço DESC (serviços/produtos), rating DESC (barbeiros)

---

## 🌐 Endpoints Públicos Disponíveis (Sem Auth)

### 1. **GET** `/api/barbershops/public`
**Objetivo:** Listar todas as barbearias cadastradas

**Query Parameters:**
- `search` (opcional) - Busca por nome ou endereço

**Exemplos de chamada:**
```
GET http://localhost:3000/api/barbershops/public
GET http://localhost:3000/api/barbershops/public?search=centro
```

**Response exemplo:**
```json
[
  {
    "id": "aa713b89-bd93-49e0-9822-20986d3c25f9",
    "name": "BarberPro Centro",
    "phone": "(11) 98765-4321",
    "address": "Rua Augusta, 1234 - Centro, São Paulo - SP",
    "openingTime": "09:00",
    "closingTime": "20:00",
    "logo": null
  }
]
```

---

### 2. **GET** `/api/barbershops/public/:shopId`
**Objetivo:** Buscar detalhes de uma barbearia específica com preview de itens

**URL Parameters:**
- `shopId` (obrigatório) - UUID da barbearia

**Exemplo de chamada:**
```
GET http://localhost:3000/api/barbershops/public/aa713b89-bd93-49e0-9822-20986d3c25f9
```

**Response exemplo:**
```json
{
  "shop": {
    "id": "aa713b89-bd93-49e0-9822-20986d3c25f9",
    "name": "BarberPro Centro",
    "phone": "(11) 98765-4321",
    "address": "Rua Augusta, 1234 - Centro, São Paulo - SP",
    "openingTime": "09:00",
    "closingTime": "20:00",
    "intervalMinutes": 30,
    "logo": null
  },
  "services": [
    {
      "id": "uuid",
      "name": "Day Off Masculino",
      "description": "Experiência completa",
      "category": "Especial",
      "price": 180.00,
      "duration": 150,
      "image": null
    }
    // ... mais 2 serviços (top 3)
  ],
  "products": [
    {
      "id": "uuid",
      "name": "Kit Pente + Escova",
      "description": "Set profissional",
      "category": "Acessórios",
      "price": 55.00,
      "image": null
    }
    // ... mais 2 produtos (top 3)
  ],
  "barbers": [
    {
      "id": "uuid",
      "name": "Pedro Navalheiro",
      "nickname": "Pedrão",
      "description": "Expert em barbas",
      "specialties": ["Barba Completa", "Bigode", "Design"],
      "rating": 4.9,
      "avatar": null,
      "role": "BARBER"
    }
    // ... mais 2 barbeiros (top 3)
  ]
}
```

**Regras de negócio:**
- Retorna no máximo 3 de cada categoria
- Serviços ordenados por preço (mais caros primeiro)
- Produtos ordenados por preço (mais caros primeiro)
- Barbeiros ordenados por avaliação (melhores primeiro)
- Apenas itens ativos são retornados

---

## 🎯 O que precisa ser implementado no Frontend

### 1️⃣ **Tela Home Pública (Sem Login)**

#### Funcionalidades necessárias:

**A. Lista de Barbearias**
- [ ] Fazer requisição GET para `/api/barbershops/public`
- [ ] Renderizar cards com informações de cada barbearia
- [ ] Mostrar: nome, endereço, telefone, horário de funcionamento
- [ ] Exibir logo da barbearia (se houver, caso contrário usar placeholder)

**B. Campo de Busca**
- [ ] Input de texto para buscar barbearias
- [ ] Implementar debounce (300-500ms) para evitar requisições excessivas
- [ ] Fazer requisição com query param: `/api/barbershops/public?search={termo}`
- [ ] Atualizar lista conforme usuário digita

**C. Navegação para Detalhes**
- [ ] Cada card deve ter botão/link "Ver detalhes" ou "Conhecer"
- [ ] Ao clicar, redirecionar para `/barbershop/{shopId}` ou abrir modal

---

### 2️⃣ **Página de Detalhes da Barbearia**

#### Funcionalidades necessárias:

**A. Informações da Barbearia**
- [ ] Fazer requisição GET para `/api/barbershops/public/{shopId}`
- [ ] Renderizar seção com dados do shop:
  - Nome da barbearia
  - Endereço completo
  - Telefone (com botão para ligar via WhatsApp)
  - Horário de funcionamento (openingTime - closingTime)
  - Intervalo entre agendamentos (intervalMinutes)

**B. Preview de Serviços (Top 3)**
- [ ] Renderizar grid/lista com os 3 serviços retornados
- [ ] Mostrar para cada serviço:
  - Nome
  - Descrição
  - Categoria
  - Preço formatado (R$ 180,00)
  - Duração formatada (2h 30min)
  - Imagem (se houver, caso contrário placeholder)
- [ ] Botão "Ver todos os serviços" (redireciona para lista completa após login)

**C. Preview de Produtos (Top 3)**
- [ ] Renderizar grid/lista com os 3 produtos retornados
- [ ] Mostrar para cada produto:
  - Nome
  - Descrição
  - Categoria
  - Preço formatado (R$ 55,00)
  - Imagem (se houver, caso contrário placeholder)
- [ ] Botão "Ver todos os produtos" (redireciona para lista completa após login)

**D. Preview de Barbeiros (Top 3)**
- [ ] Renderizar cards com os 3 barbeiros retornados
- [ ] Mostrar para cada barbeiro:
  - Avatar (se houver, caso contrário avatar padrão)
  - Nome completo
  - Apelido (nickname)
  - Descrição/bio
  - Especialidades (badges/tags)
  - Avaliação (estrelas - ex: 4.9 ⭐)
  - Cargo/função (role traduzido: BARBER = Barbeiro, HAIRDRESSER = Cabeleireiro, etc)

**E. Call-to-Action**
- [ ] Botão principal "Agendar Horário"
- [ ] Ao clicar:
  - Se usuário NÃO está logado → redirecionar para tela de login/cadastro
  - Se usuário JÁ está logado → redirecionar para tela de agendamento

---

### 3️⃣ **Integração com Sistema de Autenticação**

#### O que fazer:

**A. Armazenamento da barbearia selecionada**
- [ ] Quando usuário clicar em "Agendar" ou "Conhecer barbearia":
  - Armazenar `shopId` no localStorage/sessionStorage
  - Exemplo: `localStorage.setItem('selectedShopId', shopId)`

**B. Fluxo após login/cadastro**
- [ ] Após login bem-sucedido:
  - Recuperar `shopId` armazenado: `localStorage.getItem('selectedShopId')`
  - Redirecionar usuário para área interna com shop selecionado
  - Se for ADMIN/BARBER → Dashboard da barbearia
  - Se for CLIENT → Tela de agendamento

**C. Trocar de barbearia (Admin Panel)**
- [ ] Criar dropdown/selector no header/sidebar
- [ ] Listar barbearias disponíveis (usar mesmo endpoint `/api/barbershops/public`)
- [ ] Ao selecionar outra barbearia:
  - Usar endpoint autenticado: `POST /api/barbershops/switch` (já existe no backend)
  - Atualizar token com novo shopId
  - Recarregar dados do dashboard

---

## 🔌 Guia de Conexão com API

### Setup da Conexão

**1. Configurar Base URL**
```javascript
// No arquivo de configuração (ex: api.config.js ou .env)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

**2. Criar serviço de Barbershops**
```javascript
// services/barbershops.service.js (ou .ts)

export const barbershopsService = {
  // Listar todas (sem auth)
  async getAll(search = '') {
    const url = `${API_BASE_URL}/barbershops/public${search ? `?search=${search}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Erro ao buscar barbearias')
    return response.json()
  },

  // Detalhes com preview (sem auth)
  async getPreview(shopId) {
    const response = await fetch(`${API_BASE_URL}/barbershops/public/${shopId}`)
    if (!response.ok) throw new Error('Barbearia não encontrada')
    return response.json()
  }
}
```

**3. Tratamento de erros**
- [ ] Implementar try-catch em todas as chamadas
- [ ] Mostrar mensagem amigável caso API esteja offline
- [ ] Exibir state de loading enquanto carrega dados
- [ ] Tratar caso nenhuma barbearia seja encontrada (empty state)

---

## 📱 Componentes Sugeridos (Estrutura)

### Para Home Pública:

```
📁 components/public/
  ├── BarbershopCard.jsx         // Card individual (nome, endereço, horário)
  ├── BarbershopsList.jsx        // Grid/lista de cards
  ├── BarbershopSearch.jsx       // Input de busca com debounce
  └── EmptyState.jsx             // Quando não há resultados
```

### Para Página de Detalhes:

```
📁 components/barbershop-details/
  ├── ShopHeader.jsx             // Info principal (nome, endereço, contato)
  ├── ServicesPreview.jsx        // Top 3 serviços
  ├── ProductsPreview.jsx        // Top 3 produtos
  ├── BarbersPreview.jsx         // Top 3 barbeiros
  ├── BarberCard.jsx             // Card de barbeiro individual
  └── CallToAction.jsx           // Botão "Agendar"
```

---

## 🎨 Elementos de UI Necessários

### Estados Visuais:

**Loading State:**
- [ ] Skeleton loaders para cards enquanto carrega
- [ ] Spinner/indicador durante busca

**Empty State:**
- [ ] Mensagem quando busca não retorna resultados
- [ ] Ilustração + texto "Nenhuma barbearia encontrada"

**Error State:**
- [ ] Toast/alerta quando houver erro na API
- [ ] Botão "Tentar novamente"

---

## 🔄 Fluxo Completo do Usuário

### Cenário 1: Usuário Novo (Não Autenticado)

1. ✅ Acessa home pública
2. ✅ Vê lista de barbearias
3. ✅ Usa busca para filtrar (opcional)
4. ✅ Clica em "Ver detalhes" de uma barbearia
5. ✅ Vê preview com top 3 de cada categoria
6. ✅ Clica em "Agendar Horário"
7. → **Redireciona para login/cadastro**
8. → **Após login** → Vai para tela de agendamento

### Cenário 2: Admin/Barber Logado

1. ✅ Faz login
2. ✅ Vai direto para dashboard da sua barbearia
3. ✅ Pode trocar de barbearia usando dropdown (se tiver acesso a múltiplas)
4. ✅ Gerencia agendamentos, serviços, produtos, etc

### Cenário 3: Cliente Logado

1. ✅ Faz login
2. ✅ Pode ver lista de barbearias (opcional)
3. ✅ Seleciona barbearia desejada
4. ✅ Vai direto para tela de agendamento

---

## ✅ Checklist de Implementação Frontend

### Essencial (MVP):

- [ ] **API Service criado** (barbershops.service.js)
- [ ] **Home pública** com lista de barbearias
- [ ] **Busca funcionando** (com debounce)
- [ ] **Página de detalhes** com preview dos 3 itens
- [ ] **Armazenamento de shopId** no localStorage
- [ ] **Integração com fluxo de login** (redirecionar após auth)
- [ ] **Loading states** implementados
- [ ] **Error handling** básico

### Melhorias (Nice to Have):

- [ ] **Filtros avançados** (por localização, preço, avaliação)
- [ ] **Mapa** mostrando localização das barbearias
- [ ] **Compartilhar** barbearia (redes sociais)
- [ ] **Favoritar** barbearias (requer auth)
- [ ] **Ver avaliações** de clientes
- [ ] **Galeria de fotos** da barbearia
- [ ] **Animações** de transição entre páginas
- [ ] **SEO otimizado** (meta tags, Open Graph)

---

## 🚨 Pontos de Atenção

### 1. **Sem Autenticação Necessária**
- As rotas `/api/barbershops/public` e `/api/barbershops/public/:shopId` **NÃO** precisam de token
- Não enviar header `Authorization` nestas chamadas
- Qualquer usuário (autenticado ou não) pode acessar

### 2. **Dados Limitados**
- Endpoint retorna apenas preview (3 itens de cada)
- Para ver lista completa, usuário precisa estar logado
- Usar endpoints autenticados: `/api/services`, `/api/products`, `/api/barbers`

### 3. **Campos Nullable**
- `logo`, `image`, `avatar` podem ser `null`
- Sempre verificar e usar placeholder quando necessário

### 4. **Formatação de Dados**
- **Preço:** Formatar para BRL (R$ 180,00)
- **Horário:** Converter string "09:00" para formato amigável
- **Duração:** Converter minutos para horas/minutos (150 → "2h 30min")
- **Telefone:** Adicionar máscara (11987654321 → "(11) 98765-4321")

### 5. **Responsividade**
- Garantir que lista/cards funcionem bem em mobile
- Preview deve ser scrollável horizontalmente em telas pequenas
- Botões de CTA devem ser fixos/sticky em mobile

---

## 🔗 Endpoints Relacionados (Para Referência)

### Endpoints Públicos (Implementados):
- ✅ `GET /api/barbershops/public` - Lista barbearias
- ✅ `GET /api/barbershops/public/:shopId` - Detalhes + preview

### Endpoints Protegidos (Já existentes no backend):
- 🔒 `GET /api/barbershops` - Lista todas (para ADMIN)
- 🔒 `GET /api/barbershops/:id` - Detalhes completos (autenticado)
- 🔒 `POST /api/barbershops/switch` - Trocar de barbearia
- 🔒 `GET /api/services` - Lista completa de serviços
- 🔒 `GET /api/products` - Lista completa de produtos
- 🔒 `GET /api/barbers` - Lista completa de barbeiros
- 🔒 `POST /api/appointments` - Criar agendamento

---

## 📚 Documentação Complementar

**Arquivos de referência criados:**
- ✅ `docs/PUBLIC_BARBERSHOPS_API.md` - Documentação técnica completa
- ✅ `test-public-barbershops.ps1` - Script de teste dos endpoints

**Outras documentações úteis:**
- 📄 `docs/APPOINTMENTS_API.md` - Para implementar agendamentos
- 📄 `docs/TEST_CREDENTIALS.md` - Credenciais para testes

---

## 🎯 Resultado Esperado

Após implementação, o usuário deve conseguir:

1. ✅ **Navegar** pelas barbearias sem fazer login
2. ✅ **Buscar** barbearias por nome/endereço
3. ✅ **Ver detalhes** e preview de uma barbearia
4. ✅ **Decidir** qual barbearia escolher antes de criar conta
5. ✅ **Agendar** horário após fazer login (fluxo completo)

---

## 💡 Dicas de Implementação

### Performance:
- Implementar **cache** de requisições (ex: React Query, SWR)
- Fazer **prefetch** dos dados de detalhes ao passar mouse no card
- Usar **lazy loading** para imagens

### UX:
- Mostrar **preview em modal** antes de navegar para página completa
- Adicionar **breadcrumbs** (Home > Barbearias > BarberPro Centro)
- Implementar **skeleton screens** ao invés de spinners

### Acessibilidade:
- Adicionar **alt text** em todas as imagens
- Garantir **navegação por teclado**
- Usar **ARIA labels** adequados

---

## ✅ Pronto para Começar!

Com este guia, você tem todas as informações necessárias para implementar a integração frontend com as rotas públicas de barbearias.

**Dúvidas?** Consulte a documentação técnica em `docs/PUBLIC_BARBERSHOPS_API.md`

**Problemas?** Execute `.\test-public-barbershops.ps1` para validar que o backend está funcionando corretamente.

Boa implementação! 🚀
