# 🔧 Guia Rápido: Correção de Bad Request no Frontend

## 🚨 Problema Identificado

Quando você tenta **editar** ou **remover** produtos/serviços no frontend, recebe erro **400 Bad Request**.

### Causa Raiz

O backend requer que endpoints **DELETE** recebam um **body obrigatório** com o campo `reason`:

```typescript
// ❌ ERRADO - Causa Bad Request 400
fetch('/products/123', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});

// ❌ ERRADO - Body vazio
fetch('/products/123', {
  method: 'DELETE',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({}) // ❌ Vazio ou sem 'reason'
});

// ✅ CORRETO - Com reason obrigatório
fetch('/products/123', {
  method: 'DELETE',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    reason: 'Motivo da remoção' // ✅ OBRIGATÓRIO
  })
});
```

---

## 🛠️ Correções Necessárias no Frontend

### 1️⃣ **Remover Produto**

**Arquivo**: Onde você faz a chamada DELETE de produtos

**Antes (causando erro):**
```typescript
const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};
```

**Depois (corrigido):**
```typescript
const deleteProduct = async (id: string, reason: string) => {
  await api.delete(`/products/${id}`, {
    data: { reason } // Axios usa 'data' para body em DELETE
  });
};

// Ou com fetch:
const deleteProduct = async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) throw new Error('Erro ao remover produto');
  return response.json();
};
```

---

### 2️⃣ **Remover Serviço**

**Antes (causando erro):**
```typescript
const deleteService = async (id: string) => {
  await api.delete(`/services/${id}`);
};
```

**Depois (corrigido):**
```typescript
const deleteService = async (id: string, reason: string) => {
  await api.delete(`/services/${id}`, {
    data: { reason } // Axios
  });
};

// Ou com fetch:
const deleteService = async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) throw new Error('Erro ao remover serviço');
  return response.json();
};
```

---

### 3️⃣ **Editar Produto (se tiver problema)**

**Certifique-se de:**
- Usar método **PATCH** (não PUT)
- Enviar **Content-Type: application/json**
- Enviar apenas campos que deseja alterar

```typescript
const updateProduct = async (id: string, updates: Partial<Product>) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH', // ⚠️ PATCH, não PUT
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates) // Apenas campos alterados
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// Exemplo de uso:
await updateProduct('uuid-produto', {
  name: 'Novo Nome',
  price: 55.00
  // Não precisa enviar todos os campos, apenas os alterados
});
```

---

### 4️⃣ **Editar Serviço (se tiver problema)**

```typescript
const updateService = async (id: string, updates: Partial<Service>) => {
  const response = await fetch(`${API_URL}/services/${id}`, {
    method: 'PATCH', // ⚠️ PATCH, não PUT
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// Exemplo de uso:
await updateService('uuid-servico', {
  name: 'Corte Premium',
  price: 45.00,
  duration: 45
});
```

---

## 🎯 Ajustes na UI (Modais/Confirmações)

### Modal de Confirmação de Remoção

Para coletar o motivo da remoção, você precisa criar um modal ou prompt:

**Opção 1: Prompt Simples (Teste Rápido)**
```typescript
const handleDelete = async (id: string) => {
  const confirmed = window.confirm('Deseja realmente remover?');
  if (!confirmed) return;
  
  const reason = window.prompt('Motivo da remoção:');
  if (!reason) {
    alert('É necessário informar o motivo da remoção');
    return;
  }
  
  try {
    await deleteProduct(id, reason);
    toast.success('Removido com sucesso!');
    // Recarregar lista
  } catch (error) {
    toast.error(error.message);
  }
};
```

**Opção 2: Modal com React (Recomendado)**
```tsx
// DeleteConfirmModal.tsx
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title 
}: DeleteConfirmModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error('Informe o motivo da remoção');
      return;
    }
    onConfirm(reason);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Confirmar Remoção</h2>
        <p>Tem certeza que deseja remover: <strong>{title}</strong>?</p>
        
        <label>
          Motivo da remoção: *
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Produto descontinuado"
            required
          />
        </label>

        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleConfirm} className="danger">
            Confirmar Remoção
          </button>
        </div>
      </div>
    </div>
  );
}

// Uso:
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);

const handleDeleteClick = (product) => {
  setSelectedProduct(product);
  setShowDeleteModal(true);
};

const handleConfirmDelete = async (reason: string) => {
  try {
    await deleteProduct(selectedProduct.id, reason);
    toast.success('Produto removido com sucesso!');
    // Recarregar lista
  } catch (error) {
    toast.error(error.message);
  }
};

// No JSX:
<DeleteConfirmModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleConfirmDelete}
  title={selectedProduct?.name}
/>
```

---

## 📋 Checklist de Validação

Depois de fazer as correções, verifique:

- [ ] **DELETE** de produtos envia `{ reason: string }` no body
- [ ] **DELETE** de serviços envia `{ reason: string }` no body
- [ ] Header `Content-Type: application/json` está presente
- [ ] **PATCH** (não PUT) para edições
- [ ] Modal/prompt para coletar motivo da remoção
- [ ] Tratamento de erro exibindo mensagem ao usuário
- [ ] Feedback visual (toast/alert) após sucesso

---

## 🧪 Teste Rápido

**1. Teste DELETE via Postman/Insomnia:**

```http
DELETE http://localhost:3000/products/{id}
Authorization: Bearer {seu-token}
Content-Type: application/json

{
  "reason": "Teste de remoção"
}
```

**Resposta esperada**: 200 OK com produto retornado (active: false)

---

**2. Teste PATCH via Postman/Insomnia:**

```http
PATCH http://localhost:3000/products/{id}
Authorization: Bearer {seu-token}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "price": 60.00
}
```

**Resposta esperada**: 200 OK com produto atualizado

---

## 🔍 Estrutura de Erros do Backend

### Erro 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "reason must be a string",
    "reason should not be empty"
  ],
  "error": "Bad Request"
}
```

**Causa**: Campo obrigatório faltando ou inválido

---

### Erro 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "Módulo PRODUTOS não está ativo para esta barbearia"
}
```

**Causa**: Módulo não ativado no plano da barbearia

---

### Erro 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Produto não encontrado"
}
```

**Causa**: ID inválido ou produto não pertence ao tenant

---

## 📚 Documentação Completa

Para detalhes completos, consulte:
- [ENDPOINTS_FRONTEND.md](./ENDPOINTS_FRONTEND.md) - Documentação completa de todos os endpoints
- [FRONTEND_API_EXAMPLES.ts](./FRONTEND_API_EXAMPLES.ts) - Exemplos práticos de código

---

## ⚡ Deploy/Produção

Ao fazer deploy, certifique-se:

1. **Variável de ambiente**: 
   ```bash
   NEXT_PUBLIC_API_URL=https://api.barberpro.com.br
   ```

2. **CORS**: Backend deve permitir origem do frontend em produção

3. **HTTPS**: Use sempre HTTPS em produção

4. **Token**: Armazene token de forma segura (httpOnly cookies recomendado)

---

## 🆘 Suporte

Se o problema persistir:

1. ✅ Verifique console do navegador (Network tab)
2. ✅ Verifique logs do backend
3. ✅ Confirme que token é válido (não expirado)
4. ✅ Teste endpoint via Postman com mesmos dados
5. ✅ Verifique se módulo está ativo na barbearia

**Swagger UI**: http://localhost:3000/api (teste endpoints diretamente)
