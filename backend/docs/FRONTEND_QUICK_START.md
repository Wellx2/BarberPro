# 🚀 Quick Start - Agendamentos Frontend

## ⚡ Código Pronto para Usar

### 1. Configuração Base (api.js)

```javascript
// api.js - Configuração centralizada
const API_URL = 'http://localhost:3000/api';

// Obter token salvo
function getToken() {
  return localStorage.getItem('accessToken');
}

// Headers padrão
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Tratamento de erro padrão
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }
  return response.json();
}

export { API_URL, getHeaders, handleResponse };
```

---

### 2. Service de Agendamentos (agendamentos.service.js)

```javascript
// agendamentos.service.js
import { API_URL, getHeaders, handleResponse } from './api';

const AgendamentosService = {
  
  // 📝 CRIAR AGENDAMENTO
  async criar(dados) {
    /*
     * dados = {
     *   clientId: string (UUID),
     *   barberId: string (UUID),
     *   serviceIds: string[] (array de UUIDs),
     *   date: string (ISO 8601),
     *   products: [{ id: string, quantity: number }] (opcional)
     * }
     */
    
    // Formatar data para ISO 8601
    const dadosFormatados = {
      ...dados,
      date: new Date(dados.date).toISOString()
    };
    
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dadosFormatados)
    });
    
    return handleResponse(response);
  },
  
  // 📋 LISTAR AGENDAMENTOS
  async listar(filtros = {}) {
    /*
     * filtros = {
     *   date: string (opcional - ISO 8601),
     *   barberId: string (opcional - UUID),
     *   status: string (opcional - SCHEDULED, COMPLETED, etc)
     * }
     */
    
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
    
    const url = `${API_URL}/appointments${params.toString() ? '?' + params : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // 🔍 BUSCAR UM AGENDAMENTO
  async buscarPorId(id) {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // ❌ CANCELAR AGENDAMENTO
  async cancelar(id, motivo) {
    const response = await fetch(`${API_URL}/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ cancelReason: motivo })
    });
    
    return handleResponse(response);
  },
  
  // ✅ COMPLETAR AGENDAMENTO (Admin/Barber)
  async completar(id) {
    const response = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  }
  
};

export default AgendamentosService;
```

---

### 3. Service para Dados Auxiliares (dados.service.js)

```javascript
// dados.service.js
import { API_URL, getHeaders, handleResponse } from './api';

const DadosService = {
  
  // Buscar barbeiros
  async buscarBarbeiros() {
    const response = await fetch(`${API_URL}/barbers`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Buscar serviços
  async buscarServicos() {
    const response = await fetch(`${API_URL}/services`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Buscar produtos
  async buscarProdutos() {
    const response = await fetch(`${API_URL}/products`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Buscar clientes
  async buscarClientes() {
    const response = await fetch(`${API_URL}/clients`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Buscar dados da barbearia
  async buscarBarbearia() {
    const response = await fetch(`${API_URL}/barbershops/my-shop`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Buscar tudo de uma vez
  async buscarTodosDados() {
    const [barbeiros, servicos, produtos, clientes, barbearia] = await Promise.all([
      this.buscarBarbeiros(),
      this.buscarServicos(),
      this.buscarProdutos(),
      this.buscarClientes(),
      this.buscarBarbearia()
    ]);
    
    return {
      barbeiros,
      servicos,
      produtos,
      clientes,
      barbearia
    };
  }
  
};

export default DadosService;
```

---

### 4. Componente React - Formulário de Agendamento

```jsx
// FormularioAgendamento.jsx
import React, { useState, useEffect } from 'react';
import AgendamentosService from './services/agendamentos.service';
import DadosService from './services/dados.service';

function FormularioAgendamento({ onSuccess }) {
  // Estados
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Formulário
  const [form, setForm] = useState({
    clientId: '',
    barberId: '',
    serviceIds: [],
    date: '',
    time: '',
    products: []
  });
  
  // Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);
  
  async function carregarDados() {
    try {
      const dados = await DadosService.buscarTodosDados();
      setBarbeiros(dados.barbeiros);
      setServicos(dados.servicos);
      setClientes(dados.clientes);
      setProdutos(dados.produtos);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    }
  }
  
  // Calcular duração total
  const duracaoTotal = servicos
    .filter(s => form.serviceIds.includes(s.id))
    .reduce((sum, s) => sum + s.duration, 0);
  
  // Calcular preço total
  const precoServicos = servicos
    .filter(s => form.serviceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
    
  const precoProdutos = form.products.reduce((sum, p) => {
    const produto = produtos.find(prod => prod.id === p.id);
    return sum + (produto ? produto.price * p.quantity : 0);
  }, 0);
  
  const precoTotal = precoServicos + precoProdutos;
  
  // Submeter formulário
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validações
      if (!form.clientId) throw new Error('Selecione um cliente');
      if (!form.barberId) throw new Error('Selecione um barbeiro');
      if (form.serviceIds.length === 0) throw new Error('Selecione pelo menos um serviço');
      if (!form.date || !form.time) throw new Error('Selecione data e horário');
      
      // Combinar data e hora
      const dateTime = `${form.date}T${form.time}:00`;
      
      // Dados para enviar
      const dados = {
        clientId: form.clientId,
        barberId: form.barberId,
        serviceIds: form.serviceIds,
        date: dateTime,
        ...(form.products.length > 0 && { products: form.products })
      };
      
      // Criar agendamento
      const agendamento = await AgendamentosService.criar(dados);
      
      // Sucesso!
      alert('Agendamento criado com sucesso!');
      
      // Resetar form
      setForm({
        clientId: '',
        barberId: '',
        serviceIds: [],
        date: '',
        time: '',
        products: []
      });
      
      // Callback
      if (onSuccess) onSuccess(agendamento);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  // Toggle serviço
  function toggleServico(servicoId) {
    setForm(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(servicoId)
        ? prev.serviceIds.filter(id => id !== servicoId)
        : [...prev.serviceIds, servicoId]
    }));
  }
  
  // Atualizar quantidade de produto
  function atualizarProduto(produtoId, quantidade) {
    setForm(prev => ({
      ...prev,
      products: quantidade > 0
        ? [
            ...prev.products.filter(p => p.id !== produtoId),
            { id: produtoId, quantity: quantidade }
          ]
        : prev.products.filter(p => p.id !== produtoId)
    }));
  }
  
  return (
    <div className="formulario-agendamento">
      <h2>Novo Agendamento</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        
        {/* Cliente */}
        <div className="form-group">
          <label>Cliente *</label>
          <select
            value={form.clientId}
            onChange={e => setForm({...form, clientId: e.target.value})}
            required
          >
            <option value="">Selecione...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </option>
            ))}
          </select>
        </div>
        
        {/* Barbeiro */}
        <div className="form-group">
          <label>Barbeiro *</label>
          <select
            value={form.barberId}
            onChange={e => setForm({...form, barberId: e.target.value})}
            required
          >
            <option value="">Selecione...</option>
            {barbeiros.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} {b.specialty && `- ${b.specialty}`}
              </option>
            ))}
          </select>
        </div>
        
        {/* Data */}
        <div className="form-group">
          <label>Data *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({...form, date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        {/* Horário */}
        <div className="form-group">
          <label>Horário *</label>
          <input
            type="time"
            value={form.time}
            onChange={e => setForm({...form, time: e.target.value})}
            required
          />
        </div>
        
        {/* Serviços */}
        <div className="form-group">
          <label>Serviços * (selecione pelo menos um)</label>
          <div className="checkbox-list">
            {servicos.map(s => (
              <label key={s.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={() => toggleServico(s.id)}
                />
                <span>
                  {s.name} - R$ {s.price.toFixed(2)} ({s.duration} min)
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Produtos (Opcional) */}
        <div className="form-group">
          <label>Produtos (opcional)</label>
          <div className="produtos-list">
            {produtos.map(p => (
              <div key={p.id} className="produto-item">
                <span>{p.name} - R$ {p.price.toFixed(2)}</span>
                <span className="estoque">(Estoque: {p.stock})</span>
                <input
                  type="number"
                  min="0"
                  max={p.stock}
                  placeholder="Qtd"
                  onChange={e => atualizarProduto(p.id, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Resumo */}
        {form.serviceIds.length > 0 && (
          <div className="resumo">
            <h3>Resumo</h3>
            <p><strong>Duração:</strong> {duracaoTotal} minutos</p>
            <p><strong>Preço Total:</strong> R$ {precoTotal.toFixed(2)}</p>
          </div>
        )}
        
        {/* Botão */}
        <button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Confirmar Agendamento'}
        </button>
        
      </form>
    </div>
  );
}

export default FormularioAgendamento;
```

---

### 5. Componente React - Lista de Agendamentos

```jsx
// ListaAgendamentos.jsx
import React, { useState, useEffect } from 'react';
import AgendamentosService from './services/agendamentos.service';

function ListaAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'SCHEDULED'
  });
  
  useEffect(() => {
    carregarAgendamentos();
  }, [filtros]);
  
  async function carregarAgendamentos() {
    try {
      setLoading(true);
      const data = await AgendamentosService.listar(filtros);
      setAgendamentos(data);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function cancelarAgendamento(id) {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;
    
    try {
      await AgendamentosService.cancelar(id, motivo);
      alert('Agendamento cancelado');
      carregarAgendamentos();
    } catch (err) {
      alert('Erro ao cancelar: ' + err.message);
    }
  }
  
  function formatarData(dateString) {
    return new Date(dateString).toLocaleString('pt-BR');
  }
  
  function getStatusLabel(status) {
    const labels = {
      'SCHEDULED': 'Agendado',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado',
      'CANCELLED_BY_BARBER': 'Cancelado pelo Barbeiro',
      'NO_SHOW': 'Não Compareceu'
    };
    return labels[status] || status;
  }
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div className="lista-agendamentos">
      <h2>Agendamentos</h2>
      
      {/* Filtros */}
      <div className="filtros">
        <input
          type="date"
          value={filtros.date}
          onChange={e => setFiltros({...filtros, date: e.target.value})}
        />
        
        <select
          value={filtros.status}
          onChange={e => setFiltros({...filtros, status: e.target.value})}
        >
          <option value="">Todos</option>
          <option value="SCHEDULED">Agendados</option>
          <option value="COMPLETED">Completados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        
        <button onClick={carregarAgendamentos}>Atualizar</button>
      </div>
      
      {/* Lista */}
      {agendamentos.length === 0 ? (
        <p>Nenhum agendamento encontrado</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Cliente</th>
              <th>Barbeiro</th>
              <th>Serviços</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.map(a => (
              <tr key={a.id}>
                <td>{formatarData(a.date)}</td>
                <td>{a.client.name}</td>
                <td>{a.barber.name}</td>
                <td>
                  {a.services.map(s => s.service.name).join(', ')}
                </td>
                <td>R$ {a.totalPrice.toFixed(2)}</td>
                <td>
                  <span className={`status status-${a.status.toLowerCase()}`}>
                    {getStatusLabel(a.status)}
                  </span>
                </td>
                <td>
                  {a.status === 'SCHEDULED' && (
                    <button onClick={() => cancelarAgendamento(a.id)}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaAgendamentos;
```

---

### 6. Exemplo Vanilla JavaScript (sem React)

```html
<!-- agendamento.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Criar Agendamento</title>
</head>
<body>
  <h1>Novo Agendamento</h1>
  
  <form id="formAgendamento">
    <div>
      <label>Cliente:</label>
      <select id="clientId" required></select>
    </div>
    
    <div>
      <label>Barbeiro:</label>
      <select id="barberId" required></select>
    </div>
    
    <div>
      <label>Data:</label>
      <input type="date" id="date" required>
    </div>
    
    <div>
      <label>Horário:</label>
      <input type="time" id="time" required>
    </div>
    
    <div>
      <label>Serviços:</label>
      <div id="servicos"></div>
    </div>
    
    <div id="resumo" style="display:none;">
      <h3>Resumo</h3>
      <p>Duração: <span id="duracao"></span> minutos</p>
      <p>Preço: R$ <span id="preco"></span></p>
    </div>
    
    <button type="submit">Confirmar</button>
  </form>
  
  <div id="mensagem"></div>
  
  <script>
    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('accessToken');
    
    let servicos = [];
    let servicosSelecionados = [];
    
    // Carregar dados
    async function carregarDados() {
      try {
        const [clientesRes, barbeirosRes, servicosRes] = await Promise.all([
          fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/barbers`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const clientes = await clientesRes.json();
        const barbeiros = await barbeirosRes.json();
        servicos = await servicosRes.json();
        
        // Preencher selects
        const clientSelect = document.getElementById('clientId');
        clientes.forEach(c => {
          const option = document.createElement('option');
          option.value = c.id;
          option.textContent = `${c.name} - ${c.phone}`;
          clientSelect.appendChild(option);
        });
        
        const barberSelect = document.getElementById('barberId');
        barbeiros.forEach(b => {
          const option = document.createElement('option');
          option.value = b.id;
          option.textContent = b.name;
          barberSelect.appendChild(option);
        });
        
        // Preencher checkboxes de serviços
        const servicosDiv = document.getElementById('servicos');
        servicos.forEach(s => {
          const label = document.createElement('label');
          label.innerHTML = `
            <input type="checkbox" value="${s.id}" onchange="atualizarResumo()">
            ${s.name} - R$ ${s.price.toFixed(2)} (${s.duration} min)
          `;
          servicosDiv.appendChild(label);
          servicosDiv.appendChild(document.createElement('br'));
        });
        
      } catch (err) {
        alert('Erro ao carregar dados: ' + err.message);
      }
    }
    
    // Atualizar resumo
    function atualizarResumo() {
      const checkboxes = document.querySelectorAll('#servicos input:checked');
      servicosSelecionados = Array.from(checkboxes).map(cb => cb.value);
      
      if (servicosSelecionados.length === 0) {
        document.getElementById('resumo').style.display = 'none';
        return;
      }
      
      const servicosRes = servicos.filter(s => servicosSelecionados.includes(s.id));
      const duracao = servicosRes.reduce((sum, s) => sum + s.duration, 0);
      const preco = servicosRes.reduce((sum, s) => sum + s.price, 0);
      
      document.getElementById('duracao').textContent = duracao;
      document.getElementById('preco').textContent = preco.toFixed(2);
      document.getElementById('resumo').style.display = 'block';
    }
    
    // Submeter formulário
    document.getElementById('formAgendamento').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const mensagemDiv = document.getElementById('mensagem');
      mensagemDiv.textContent = 'Criando agendamento...';
      
      try {
        const clientId = document.getElementById('clientId').value;
        const barberId = document.getElementById('barberId').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        
        if (servicosSelecionados.length === 0) {
          throw new Error('Selecione pelo menos um serviço');
        }
        
        const dateTime = `${date}T${time}:00`;
        
        const response = await fetch(`${API_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            barberId,
            serviceIds: servicosSelecionados,
            date: new Date(dateTime).toISOString()
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        
        const agendamento = await response.json();
        mens agemDiv.textContent = 'Agendamento criado com sucesso!';
        mensagemDiv.style.color = 'green';
        
        // Limpar form
        document.getElementById('formAgendamento').reset();
        document.querySelectorAll('#servicos input').forEach(cb => cb.checked = false);
        atualizarResumo();
        
      } catch (err) {
        mensagemDiv.textContent = 'Erro: ' + err.message;
        mensagemDiv.style.color = 'red';
      }
    });
    
    // Inicializar
    carregarDados();
  </script>
</body>
</html>
```

---

## 🎯 Exemplo Mínimo (Copiar e Testar)

```javascript
// TESTE RÁPIDO - Copie e cole no console do navegador

const token = 'SEU_TOKEN_AQUI'; // Pegue do localStorage ou login
const API_URL = 'http://localhost:3000/api';

// Criar agendamento
async function testarAgendamento() {
  const dados = {
    clientId: 'UUID_DO_CLIENTE',
    barberId: 'UUID_DO_BARBEIRO',
    serviceIds: ['UUID_DO_SERVICO'],
    date: new Date('2026-02-20T14:30:00').toISOString()
  };
  
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  
  const result = await response.json();
  console.log(response.ok ? 'Sucesso!' : 'Erro:', result);
  return result;
}

// Executar
testarAgendamento();
```

---

## ✅ Checklist Rápido

1. ✅ Login e salvar token
2. ✅ Buscar clientes, barbeiros e serviços
3. ✅ Formatar data para ISO 8601
4. ✅ Enviar POST com todos os campos obrigatórios
5. ✅ Tratar erros 400, 404, 409

**Pronto para usar! Boas vendas! 🚀**
