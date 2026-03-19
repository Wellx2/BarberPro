# 📋 TODO BACKEND - Endpoint Público de Barbeiros

## 🎯 Objetivo
Criar endpoint público que retorne **TODOS os barbeiros ativos** de uma barbearia específica, similar ao endpoint de serviços.

---

## 🔧 Implementação Necessária

### **Endpoint a Criar:**
```
GET /api/barbers/public/shop/:shopId
```

**Características:**
- ✅ **Público** (sem autenticação)
- ✅ Retorna **TODOS** os barbeiros ativos da loja
- ✅ Filtra apenas `active: true`
- ✅ Inclui informações básicas (nome, avatar, especialidades, rating)

---

## 📝 Código Sugerido

### **Arquivo:** `backend/src/barbers/barbers.controller.ts`

Adicionar este método no controller:

```typescript
/**
 * Lista barbeiros públicos de uma loja
 * Endpoint público - não requer autenticação
 */
@Get('public/shop/:shopId')
async findPublicByShop(@Param('shopId') shopId: string) {
  return this.barbersService.findPublicByShop(shopId);
}
```

### **Arquivo:** `backend/src/barbers/barbers.service.ts`

Adicionar este método no service:

```typescript
/**
 * Busca barbeiros públicos de uma loja (sem autenticação)
 * Retorna apenas barbeiros ativos com informações públicas
 */
async findPublicByShop(shopId: string) {
  return this.barbersRepository.find({
    where: {
      shopId,
      active: true,
      deletedAt: IsNull(), // Soft delete
    },
    select: [
      'id',
      'name',
      'nickname',
      'avatar',
      'description',
      'specialties',
      'rating',
      'role',
    ],
    order: {
      rating: 'DESC', // Ordenar por melhor avaliação
      name: 'ASC',
    },
  });
}
```

---

## ✅ Resultado Esperado

### **Request:**
```bash
GET http://localhost:3000/api/barbers/public/shop/f95101f7-ab85-46d2-bb1e-c300c49ad095
```

### **Response:**
```json
[
  {
    "id": "1fd1f0a7-24e3-4904-ad09-a1c233951672",
    "name": "Pedro Navalheiro",
    "nickname": "Pedro",
    "avatar": "https://...",
    "description": "Especialista em cortes clássicos",
    "specialties": ["Corte Masculino", "Barba"],
    "rating": 4.8,
    "role": "BARBER"
  },
  {
    "id": "55d9452e-b68e-4b14-915a-ca8b88518c0b",
    "name": "Carlos Silva",
    "nickname": "Carlos",
    "avatar": "https://...",
    "description": "Expert em barbas",
    "specialties": ["Barba", "Bigode"],
    "rating": 4.7,
    "role": "BARBER"
  }
]
```

---

## 🎨 Por Que Isso é Importante?

### **Problema Atual:**
- Endpoint `/barbers` requer permissões de ADMIN/BARBER
- Clientes não conseguem ver todos os barbeiros disponíveis
- Atualmente usa preview que retorna apenas TOP 3

### **Com o Endpoint Público:**
- ✅ Clientes veem **TODOS** os barbeiros disponíveis
- ✅ Melhor experiência no agendamento
- ✅ Consistência com endpoint de serviços (`/services/public/shop/:shopId`)

---

## 🔒 Segurança

**Informações expostas publicamente:**
- ✅ Nome, avatar, descrição, especialidades, rating (informações públicas)

**Informações protegidas:**
- ❌ Email, telefone, endereço (dados pessoais)
- ❌ Comissões, salário (dados financeiros)
- ❌ Configurações internas

---

## 📊 Prioridade

**ALTA** - Necessário para funcionalidade completa de agendamento por clientes.

Atualmente, clientes conseguem agendar mas veem apenas 3 barbeiros (limitação do preview).

---

## ✅ Checklist de Implementação

- [ ] Criar método `findPublicByShop()` no service
- [ ] Adicionar rota pública no controller
- [ ] Testar endpoint sem autenticação
- [ ] Verificar se retorna todos os barbeiros ativos
- [ ] Verificar se filtra apenas dados públicos
- [ ] Validar response no Postman/Insomnia
- [ ] Atualizar documentação da API

---

**Data:** 18/02/2026  
**Status:** 🔄 Pendente de implementação no backend
