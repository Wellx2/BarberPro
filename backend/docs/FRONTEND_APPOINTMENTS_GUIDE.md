# Guia Completo: Agendamentos para Frontend

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Criar Agendamento](#criar-agendamento)
- [Estrutura de Dados](#estrutura-de-dados)
- [Validações e Regras](#validações-e-regras)
- [Tratamento de Erros](#tratamento-de-erros)
- [Exemplos Práticos](#exemplos-práticos)
- [Fluxo Completo no Frontend](#fluxo-completo-no-frontend)

---

## 🎯 Visão Geral

O sistema de agendamentos permite que clientes agendem serviços com barbeiros específicos. A API valida automaticamente:
- ✅ Disponibilidade do barbeiro
- ✅ Horário de funcionamento da barbearia
- ✅ Conflitos com outros agendamentos
- ✅ Horários bloqueados
- ✅ Estoque de produtos (se houver)

---

## 🔐 Autenticação

**Todas as requisições** devem incluir o token JWT no header:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Obter Token (Login)

```javascript
// POST /api/auth/login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@email.com',
    password: 'senha123'
  })
});

const { accessToken, refreshToken, user } = await response.json();
// Salvar no localStorage/sessionStorage
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

---

## 📝 Criar Agendamento

### Endpoint
```
POST /api/appointments
```

### Headers Obrigatórios
```javascript
{
  'Authorization': 'Bearer SEU_ACCESS_TOKEN',
  'Content-Type': 'application/json'
}
```

### Body da Requisição

#### Campos Obrigatórios

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `clientId` | `string (UUID)` | ID do cliente | UUID v4 válido |
| `barberId` | `string (UUID)` | ID do barbeiro | UUID v4 válido |
| `serviceIds` | `array<string>` | IDs dos serviços | Array com pelo menos 1 UUID |
| `date` | `string (ISO 8601)` | Data/hora do agendamento | Formato: `YYYY-MM-DDTHH:mm:ss.sssZ` |

#### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `products` | `array<object>` | Produtos adicionais para venda |

**Estrutura de `products`:**
```typescript
{
  id: string;      // UUID do produto
  quantity: number; // Quantidade (mínimo: 1)
}
```

---

## 🏗️ Estrutura de Dados

### Exemplo Completo de Body

```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "barberId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "serviceIds": [
    "9a2e1234-5678-90ab-cdef-123456789012",
    "1b3c4567-89de-0123-4567-89abcdef0123"
  ],
  "date": "2026-02-20T14:30:00.000Z",
  "products": [
    {
      "id": "8d4f5a6b-7c8e-9d0a-1b2c-3d4e5f6a7b8c",
      "quantity": 2
    }
  ]
}
```

### Resposta de Sucesso (201)

```json
{
  "id": "appointment-uuid",
  "shopId": "shop-uuid",
  "clientId": "cliente-uuid",
  "barberId": "barbeiro-uuid",
  "date": "2026-02-20T14:30:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 75.00,
  "cancelReason": null,
  "createdAt": "2026-02-18T00:43:57.890Z",
  "updatedAt": "2026-02-18T00:43:57.890Z",
  "client": {
    "id": "cliente-uuid",
    "name": "João Silva",
    "phone": "(11) 98765-4321",
    "email": "joao@example.com"
  },
  "barber": {
    "id": "barbeiro-uuid",
    "name": "Carlos Barbeiro",
    "specialty": "Cortes modernos"
  },
  "services": [
    {
      "id": "rel-uuid",
      "service": {
        "id": "service-uuid",
        "name": "Corte Tradicional",
        "price": 50.00,
        "duration": 30
      }
    },
    {
      "id": "rel-uuid-2",
      "service": {
        "id": "service-uuid-2",
        "name": "Barba Completa",
        "price": 25.00,
        "duration": 20
      }
    }
  ],
  "products": [
    {
      "id": "prod-rel-uuid",
      "productId": "product-uuid",
      "name": "Pomada Modeladora",
      "price": 15.00,
      "quantity": 2,
      "product": {
        "id": "product-uuid",
        "name": "Pomada Modeladora"
      }
    }
  ]
}
```

---

## ⚠️ Validações e Regras

### 1. **Formato da Data**
A data DEVE estar no formato ISO 8601 com timezone:

```javascript
// ✅ CORRETO
const date = new Date('2026-02-20T14:30:00').toISOString();
// Resultado: "2026-02-20T14:30:00.000Z"

// ❌ ERRADO
const date = "20/02/2026 14:30";
const date = "2026-02-20 14:30";
```

**Como formatar no JavaScript:**
```javascript
// Opção 1: Criar Date e converter
const dataHora = new Date(ano, mes - 1, dia, hora, minuto);
const dateISO = dataHora.toISOString();

// Opção 2: Manipular strings
const dateISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00.000Z`;

// Opção 3: Usar biblioteca (recomendado)
// Com date-fns:
import { format } from 'date-fns';
const dateISO = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
```

### 2. **IDs Válidos (UUID v4)**
Todos os IDs devem ser UUIDs válidos no formato:
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

### 3. **Array de Serviços**
- Mínimo de **1 serviço**
- Máximo: sem limite
- Todos os IDs devem existir no banco e pertencer ao shop

### 4. **Horário de Funcionamento**
O sistema calcula automaticamente:
- **Hora início**: data fornecida
- **Hora fim**: hora início + duração total dos serviços

Exemplo:
```
Serviços: 
  - Corte (30min) 
  - Barba (20min)
Total: 50min

Agendamento: 14:30
Fim calculado: 15:20

Se a barbearia fecha às 18:00:
  ✅ 14:30 - 15:20 (OK)
  ❌ 17:30 - 18:20 (ultrapassa horário)
```

### 5. **Disponibilidade do Barbeiro**
O sistema verifica automaticamente:
- Barbeiro não pode ter outro agendamento no mesmo horário
- Barbeiro não pode estar com horário bloqueado
- Barbeiro deve estar ativo (`active: true`)

### 6. **Produtos (Opcional)**
Se incluir produtos:
- Verifica estoque disponível
- Decrementa estoque automaticamente
- Adiciona ao preço total
- Em caso de cancelamento, restaura o estoque

---

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções

#### 1. **400 Bad Request - Validação de Campos**

```json
{
  "statusCode": 400,
  "message": [
    "clientId must be a UUID",
    "serviceIds must contain at least 1 elements"
  ],
  "error": "Bad Request"
}
```

**Causas:**
- Campo obrigatório ausente
- Formato de UUID inválido
- Array vazio de serviços
- Data em formato inválido

**Solução:**
```javascript
// Validar antes de enviar
function validateAppointmentData(data) {
  const errors = [];
  
  if (!data.clientId || !isValidUUID(data.clientId)) {
    errors.push('Cliente inválido');
  }
  
  if (!data.barberId || !isValidUUID(data.barberId)) {
    errors.push('Barbeiro inválido');
  }
  
  if (!Array.isArray(data.serviceIds) || data.serviceIds.length === 0) {
    errors.push('Selecione pelo menos um serviço');
  }
  
  if (!data.date || !isValidISODate(data.date)) {
    errors.push('Data inválida');
  }
  
  return errors;
}

function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

function isValidISODate(dateString) {
  const date = new Date(dateString);
  return date.toISOString() === dateString;
}
```

#### 2. **404 Not Found - Entidade Não Encontrada**

```json
{
  "statusCode": 404,
  "message": "Cliente não encontrado"
}
```

**Causas:**
- Cliente não existe ou pertence a outro shop
- Barbeiro não encontrado, inativo ou de outro shop
- Serviço não encontrado

**Solução:**
- Verificar se os IDs estão corretos
- Buscar entidades antes de criar agendamento
- Garantir que pertencem ao mesmo shop

#### 3. **409 Conflict - Conflito de Horário**

```json
{
  "statusCode": 409,
  "message": "Horário indisponível - conflito com outro agendamento"
}
```

```json
{
  "statusCode": 409,
  "message": "Horário bloqueado - Férias do barbeiro"
}
```

**Causas:**
- Barbeiro já tem agendamento nesse horário
- Horário está bloqueado

**Solução:**
- Buscar horários disponíveis antes de agendar
- Mostrar calendário com slots livres

#### 4. **400 Bad Request - Horário Fora do Expediente**

```json
{
  "statusCode": 400,
  "message": "Horário fora do expediente (09:00 - 18:00)"
}
```

**Solução:**
- Verificar horários da barbearia (`openingTime`, `closingTime`)
- Calcular duração total dos serviços
- Validar que [início, fim] está dentro do expediente

#### 5. **400 Bad Request - Estoque Insuficiente**

```json
{
  "statusCode": 400,
  "message": "Estoque insuficiente para Pomada Modeladora. Disponível: 3"
}
```

**Solução:**
- Verificar estoque antes de adicionar produto
- Mostrar quantidade disponível no frontend

#### 6. **401 Unauthorized - Token Inválido**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solução:**
- Verificar se o token está sendo enviado
- Verificar se o token não expirou
- Usar refresh token para renovar

#### 7. **403 Forbidden - Sem Permissão**

```json
{
  "statusCode": 403,
  "message": "Sem barbearia vinculada"
}
```

**Solução:**
- Garantir que usuário tem `shopId`
- Verificar se usuário tem role adequada

---

## 💡 Exemplos Práticos

### Exemplo 1: Agendamento Simples (Apenas Serviços)

```javascript
async function criarAgendamentoSimples() {
  const token = localStorage.getItem('accessToken');
  
  // Dados do formulário
  const dados = {
    clientId: '550e8400-e29b-41d4-a716-446655440000', // UUID do cliente
    barberId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', // UUID do barbeiro
    serviceIds: [
      '9a2e1234-5678-90ab-cdef-123456789012' // Corte tradicional
    ],
    date: new Date('2026-02-20T14:30:00').toISOString()
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const agendamento = await response.json();
    console.log('Agendamento criado:', agendamento);
    
    // Redirecionar ou mostrar confirmação
    alert(`Agendamento confirmado para ${new Date(agendamento.date).toLocaleString()}`);
    
    return agendamento;
    
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    alert(`Erro: ${error.message}`);
  }
}
```

### Exemplo 2: Agendamento Completo (Serviços + Produtos)

```javascript
async function criarAgendamentoCompleto() {
  const token = localStorage.getItem('accessToken');
  
  const dados = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    barberId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    serviceIds: [
      '9a2e1234-5678-90ab-cdef-123456789012', // Corte
      '1b3c4567-89de-0123-4567-89abcdef0123'  // Barba
    ],
    date: new Date('2026-02-20T14:30:00').toISOString(),
    products: [
      {
        id: '8d4f5a6b-7c8e-9d0a-1b2c-3d4e5f6a7b8c', // Pomada
        quantity: 1
      },
      {
        id: '3e5d6c7b-8a9e-0f1a-2b3c-4d5e6f7a8b9c', // Shampoo
        quantity: 2
      }
    ]
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const agendamento = await response.json();
    return agendamento;
    
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 3: Validação Completa Antes de Enviar

```javascript
class AgendamentoService {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
  }
  
  // Validar UUID
  isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }
  
  // Validar data
  isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date > new Date();
  }
  
  // Validar dados completos
  validarDados(dados) {
    const erros = [];
    
    // Cliente
    if (!dados.clientId) {
      erros.push('Cliente é obrigatório');
    } else if (!this.isValidUUID(dados.clientId)) {
      erros.push('ID do cliente inválido');
    }
    
    // Barbeiro
    if (!dados.barberId) {
      erros.push('Barbeiro é obrigatório');
    } else if (!this.isValidUUID(dados.barberId)) {
      erros.push('ID do barbeiro inválido');
    }
    
    // Serviços
    if (!Array.isArray(dados.serviceIds) || dados.serviceIds.length === 0) {
      erros.push('Selecione pelo menos um serviço');
    } else {
      dados.serviceIds.forEach((id, index) => {
        if (!this.isValidUUID(id)) {
          erros.push(`Serviço ${index + 1} tem ID inválido`);
        }
      });
    }
    
    // Data
    if (!dados.date) {
      erros.push('Data é obrigatória');
    } else if (!this.isValidDate(dados.date)) {
      erros.push('Data inválida ou no passado');
    }
    
    // Produtos (opcional)
    if (dados.products && dados.products.length > 0) {
      dados.products.forEach((produto, index) => {
        if (!this.isValidUUID(produto.id)) {
          erros.push(`Produto ${index + 1} tem ID inválido`);
        }
        if (!produto.quantity || produto.quantity < 1) {
          erros.push(`Produto ${index + 1} deve ter quantidade mínima de 1`);
        }
      });
    }
    
    return erros;
  }
  
  // Criar agendamento
  async criar(dados) {
    // Validar
    const erros = this.validarDados(dados);
    if (erros.length > 0) {
      throw new Error(`Dados inválidos:\n- ${erros.join('\n- ')}`);
    }
    
    // Garantir formato ISO na data
    const dadosFormatados = {
      ...dados,
      date: new Date(dados.date).toISOString()
    };
    
    // Enviar
    const response = await fetch(`${this.apiUrl}/appointments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosFormatados)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar agendamento');
    }
    
    return await response.json();
  }
  
  // Listar agendamentos
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.date) {
      params.append('date', new Date(filtros.date).toISOString());
    }
    if (filtros.barberId) {
      params.append('barberId', filtros.barberId);
    }
    if (filtros.status) {
      params.append('status', filtros.status);
    }
    
    const url = `${this.apiUrl}/appointments${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao listar agendamentos');
    }
    
    return await response.json();
  }
  
  // Cancelar agendamento
  async cancelar(id, motivo) {
    const response = await fetch(`${this.apiUrl}/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cancelReason: motivo })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cancelar agendamento');
    }
    
    return await response.json();
  }
}

// Uso:
const service = new AgendamentoService('http://localhost:3000/api', token);

// Criar
try {
  const agendamento = await service.criar({
    clientId: 'uuid-cliente',
    barberId: 'uuid-barbeiro',
    serviceIds: ['uuid-servico'],
    date: '2026-02-20T14:30:00'
  });
  console.log('Sucesso:', agendamento);
} catch (error) {
  console.error('Erro:', error.message);
}
```

### Exemplo 4: Buscar Dados Necessários (Antes de Agendar)

```javascript
async function buscarDadosParaAgendamento() {
  const token = localStorage.getItem('accessToken');
  const apiUrl = 'http://localhost:3000/api';
  
  try {
    // Buscar em paralelo
    const [barbers, services, products, barbershop] = await Promise.all([
      fetch(`${apiUrl}/barbers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      
      fetch(`${apiUrl}/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      
      fetch(`${apiUrl}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      
      fetch(`${apiUrl}/barbershops/my-shop`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]);
    
    return {
      barbeiros: barbers,
      servicos: services,
      produtos: products,
      horarioFuncionamento: {
        abertura: barbershop.openingTime,
        fechamento: barbershop.closingTime
      }
    };
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
}
```

---

## 🔄 Fluxo Completo no Frontend

### 1. **Tela de Agendamento**

```jsx
// React Example
import { useState, useEffect } from 'react';

function TelaAgendamento() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  
  const [form, setForm] = useState({
    barberId: '',
    serviceIds: [],
    date: '',
    products: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);
  
  async function carregarDados() {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = 'http://localhost:3000/api';
      
      const [barbeirosRes, servicosRes, produtosRes] = await Promise.all([
        fetch(`${baseUrl}/barbers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/services`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setBarbeiros(await barbeirosRes.json());
      setServicos(await servicosRes.json());
      setProdutos(await produtosRes.json());
      
    } catch (err) {
      setError('Erro ao carregar dados');
    }
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const clientId = getUserClientId(); // Função para obter ID do cliente logado
      
      const dados = {
        clientId,
        barberId: form.barberId,
        serviceIds: form.serviceIds,
        date: new Date(form.date).toISOString(),
        ...(form.products.length > 0 && { products: form.products })
      };
      
      const response = await fetch('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const agendamento = await response.json();
      
      // Sucesso!
      alert(`Agendamento confirmado para ${new Date(agendamento.date).toLocaleString('pt-BR')}`);
      // Redirecionar ou limpar form
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Selecionar barbeiro */}
      <select 
        value={form.barberId}
        onChange={e => setForm({...form, barberId: e.target.value})}
        required
      >
        <option value="">Selecione um barbeiro</option>
        {barbeiros.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      
      {/* Selecionar serviços */}
      <div>
        {servicos.map(s => (
          <label key={s.id}>
            <input
              type="checkbox"
              checked={form.serviceIds.includes(s.id)}
              onChange={e => {
                if (e.target.checked) {
                  setForm({...form, serviceIds: [...form.serviceIds, s.id]});
                } else {
                  setForm({...form, serviceIds: form.serviceIds.filter(id => id !== s.id)});
                }
              }}
            />
            {s.name} - R$ {s.price} ({s.duration}min)
          </label>
        ))}
      </div>
      
      {/* Data e hora */}
      <input
        type="datetime-local"
        value={form.date}
        onChange={e => setForm({...form, date: e.target.value})}
        required
      />
      
      {/* Produtos opcionais */}
      <div>
        {produtos.map(p => (
          <label key={p.id}>
            <input
              type="number"
              min="0"
              placeholder="Quantidade"
              onChange={e => {
                const qty = parseInt(e.target.value) || 0;
                if (qty > 0) {
                  setForm({
                    ...form,
                    products: [...form.products.filter(prod => prod.id !== p.id), {id: p.id, quantity: qty}]
                  });
                } else {
                  setForm({
                    ...form,
                    products: form.products.filter(prod => prod.id !== p.id)
                  });
                }
              }}
            />
            {p.name} - R$ {p.price} (Estoque: {p.stock})
          </label>
        ))}
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  );
}
```

### 2. **Verificar Horários Disponíveis**

```javascript
async function verificarHorariosDisponiveis(barberId, data) {
  const token = localStorage.getItem('accessToken');
  const dataISO = new Date(data).toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Buscar agendamentos do dia
  const response = await fetch(
    `http://localhost:3000/api/appointments?barberId=${barberId}&date=${dataISO}T00:00:00.000Z`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const agendamentosExistentes = await response.json();
  
  // Buscar horários bloqueados
  const blockedResponse = await fetch(
    `http://localhost:3000/api/blocked-times?barberId=${barberId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const horariosB bloqueados = await blockedResponse.json();
  
  // Calcular slots disponíveis
  const slots = gerarSlots('09:00', '18:00', 30); // Intervalos de 30min
  const slotsDisponiveis = slots.filter(slot => {
    // Verificar se não conflita com agendamentos
    const temConflito = agendamentosExistentes.some(a => {
      const inicio = new Date(a.date);
      const duracao = a.services.reduce((sum, s) => sum + s.service.duration, 0);
      const fim = new Date(inicio.getTime() + duracao * 60000);
      
      return slot >= inicio && slot < fim;
    });
    
    return !temConflito;
  });
  
  return slotsDisponiveis;
}

function gerarSlots(horaInicio, horaFim, intervaloMinutos) {
  const slots = [];
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFim, minFim] = horaFim.split(':').map(Number);
  
  let hora = horaIni;
  let min = minIni;
  
  while (hora < horaFim || (hora === horaFim && min <= minFim)) {
    slots.push(`${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    min += intervaloMinutos;
    if (min >= 60) {
      hora += Math.floor(min / 60);
      min = min % 60;
    }
  }
  
  return slots;
}
```

---

## 📊 Status de Agendamento

Os agendamentos podem ter os seguintes status:

| Status | Descrição |
|--------|-----------|
| `SCHEDULED` | Agendado (padrão ao criar) |
| `COMPLETED` | Completado (serviço realizado) |
| `CANCELLED` | Cancelado pelo cliente |
| `CANCELLED_BY_BARBER` | Cancelado pelo barbeiro/admin |
| `NO_SHOW` | Cliente não compareceu |

---

## 🔍 Outros Endpoints Úteis

### Listar Agendamentos
```
GET /api/appointments
Query Params: ?date=2026-02-20T00:00:00.000Z&barberId=uuid&status=SCHEDULED
```

### Buscar um Agendamento
```
GET /api/appointments/:id
```

### Cancelar Agendamento
```
PATCH /api/appointments/:id/cancel
Body: { "cancelReason": "Motivo do cancelamento" }
```

### Completar Agendamento (Admin/Barber)
```
PATCH /api/appointments/:id/complete
```

---

## 📞 Suporte

Em caso de dúvidas:
1. Verificar este documento
2. Testar endpoints no Swagger: http://localhost:3000/api/docs
3. Verificar logs do backend para erros detalhados
4. Verificar [APPOINTMENTS_API.md](./APPOINTMENTS_API.md) para detalhes técnicos

---

## ✅ Checklist de Implementação

- [ ] Implementar autenticação e armazenar token
- [ ] Criar formulário de agendamento
- [ ] Validar campos obrigatórios no frontend
- [ ] Formatar data para ISO 8601
- [ ] Buscar e exibir barbeiros disponíveis
- [ ] Buscar e exibir serviços
- [ ] Permitir seleção múltipla de serviços
- [ ] (Opcional) Implementar seleção de produtos
- [ ] Calcular e exibir duração total
- [ ] Calcular e exibir preço total
- [ ] Implementar verificação de horários disponíveis
- [ ] Tratar erros adequadamente
- [ ] Exibir mensagens de sucesso/erro
- [ ] Implementar cancelamento de agendamentos
- [ ] Implementar listagem de agendamentos

---

**Última atualização**: 18/02/2026
