# Sistema de Troca de Barbearias - Implementação Completa

## 📋 Resumo do Sistema

O sistema de troca de barbearias permite que usuários alternem entre diferentes unidades de uma mesma rede/franquia, com diferentes níveis de acesso e permissões.

### Comportamento por Contexto

| Contexto | Quem pode trocar | Validação Backend | Propósito |
|----------|------------------|-------------------|-----------|
| **Tela Inicial (Home)** | TODOS (incluindo não autenticados) | ❌ Não | Visualização de agenda e serviços |
| **Painel Administrativo** | ADMIN, SUPER_ADMIN | ✅ Sim | Gerenciar dados da unidade |
| **Painel do Barbeiro** | Não permite troca | N/A | Barbeiro trabalha em sua unidade |

### Fluxo de Dados após Troca

Quando um administrador troca de barbearia, o sistema carrega:
- ✅ **Time de Barbeiros** específico da unidade
- ✅ **Serviços** (podem ter preços diferentes)
- ✅ **Produtos** (podem ser os mesmos ou diferentes)
- ✅ **Planos de Assinatura** específicos
- ✅ **Dados Financeiros** (caixa, vendas, movimentações)
- ✅ **Configurações** da unidade

## ✅ Implementação Frontend Completa

### 1. Tela Inicial (Home)

**Status**: ✅ Implementado

O `ShopSelector` já funciona na Home para qualquer usuário:

```tsx
// src/pages/Home. tsx

export const Home: React.FC = () => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  return (
    <>
      {/* Botão para abrir seletor */}
      <button onClick={() => setShowLocationModal(true)}>
        Escolher Unidade
      </button>
      
      {/* Modal de seleção */}
      <ShopSelector onClose={() => setShowLocationModal(false)} />
    </>
  );
};
```

**Características**:
- ✅ Não requer autenticação
- ✅ Troca apenas no frontend (localStorage)
- ✅ Mostra unidades próximas por geolocalização
- ✅ Permite ver agenda e serviços de qualquer unidade

### 2. Painel Administrativo

**Status**: ✅ Implementado (NOVO!)

O AdminDashboard agora possui um botão elegante no header:

```tsx
// src/pages/admin/AdminDashboard.tsx

export const AdminDashboard: React.FC = () => {
  const { shop: currentShop } = useShop();
  const [showShopSelector, setShowShopSelector] = useState(false);
  
  return (
    <div>
      {/* Header com Shop Selector */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Painel Administrativo</h1>
          
          {/* Botão clicável para trocar unidade */}
          <button
            onClick={() => setShowShopSelector(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-amber-50 transition-all"
          >
            <Store size={16} />
            <span className="font-bold uppercase">{currentShop.name}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
      
      {/* Modal Shop Selector */}
      {showShopSelector && (
        <ShopSelector onClose={() => setShowShopSelector(false)} />
      )}
      
      {/* Resto do dashboard... */}
    </div>
  );
};
```

**Características**:
- ✅ Botão visível no header abaixo do título
- ✅ Design consistente com o painel administrativo
- ✅ Hover effect com cor amber
- ✅ Ícone de loja + nome da unidade + chevron
- ✅ Chama API de troca (requer permissão)

### 3. Componente ShopSelector Atualizado

**Status**: ✅ Atualizado com tratamento inteligente

```typescript
// src/components/ShopSelector.tsx

const handleContinue = async () => {
    const token = localStorage.getItem('accessToken');
    
    // 1️⃣ CLIENTES ou NÃO AUTENTICADOS: Troca local
    if (user?.role === UserRole.CLIENT || !token) {
        console.log('👥 Cliente: troca local apenas');
        setShop(selectedShop);
        setTimeout(() => onClose(), 200);
        return;
    }
    
    // 2️⃣ ADMIN/BARBER/SUPER_ADMIN: Tenta trocar via API
    setSwitching(true);
    try {
        await switchShop(selectedShop.id);
        console.log('✅ Troca de barbearia bem-sucedida');
        setSwitching(false);
        setTimeout(() => onClose(), 300);
    } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        
        // ❌ ERRO 403: Sem permissão
        if (statusCode === 403) {
            setErrorMessage(
                '🔒 Você não tem permissão para acessar esta barbearia. ' +
                'Entre em contato com o administrador.'
            );
            setSwitching(false);
            return;
        }
        
        // ⚠️ ERRO 404: Endpoint não implementado
        if (statusCode === 404) {
            console.warn('⚠️ Endpoint não implementado. Fallback local');
            setShop(selectedShop);
            setSwitching(false);
            setTimeout(() => onClose(), 200);
            return;
        }
        
        // ❌ Outros erros
        setErrorMessage(`❌ Erro: ${error.message}`);
        setSwitching(false);
    }
};
```

**Características**:
- ✅ Detecta role do usuário automaticamente
- ✅ Tratamento diferenciado por tipo de usuário
- ✅ Mensagens de erro claras e acionáveis
- ✅ Fallback para modo local em caso de erro 404
- ✅ UI com feedback visual (alerta vermelho)

## 🔧 O Que Precisa Ser Corrigido no Backend

### 1. Endpoint `/api/v1/barbershops/switch`

**Localização**: `src/barbershops/barbershops.controller.ts`

**IMPORTANTE**: Este endpoint deve ter **validações diferentes** dependendo de quem está chamando:

- **Admin no Painel Administrativo**: Validar se tem permissão para a unidade
- **Cliente na Tela Inicial**: NÃO DEVE CHAMAR (troca apenas no frontend)

O erro 403 atual está acontecendo porque o endpoint não diferencia contextos.

#### Regra de Negócio Correta

```typescript
// Endpoint DEVE permitir troca APENAS para gerenciamento
// Clientes NÃO devem chamar este endpoint (frontend já trata isso)

@Post('switch')
@UseGuards(JwtAuthGuard)
async switchBarbershop(@Body() dto: SwitchBarbershopDto, @Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const targetShopId = dto.shopId;
    
    // 1️⃣ SUPER_ADMIN: Acesso total
    if (userRole === UserRole.SUPER_ADMIN) {
        return await this.generateNewJWT(userId, targetShopId);
    }
    
    // 2️⃣ ADMIN: Verificar se administra esta barbearia
    // Regra: Admin pode gerenciar múltiplas unidades da mesma rede
    const adminShops = await this.userShopRepository.find({
        where: { 
            userId: userId, 
            role: UserRole.ADMIN,
            isActive: true
        }
    });
    
    const canAccessShop = adminShops.some(us => us.shopId === targetShopId);
    
    if (!canAccessShop) {
        throw new ForbiddenException(
            'Você não tem permissão de administrador para esta barbearia'
        );
    }
    
    return await this.generateNewJWT(userId, targetShopId);
}
```

### 2. Estrutura de Banco de Dados (NOVA TABELA)

**IMPORTANTE**: Para permitir que um ADMIN gerencie múltiplas unidades, precisamos de uma tabela de relacionamento N:N.

#### Nova Tabela: `user_shops` (Permissões de Acesso)

```sql
CREATE TABLE user_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL, -- ADMIN, MANAGER, etc
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES barbershops(id) ON DELETE CASCADE,
    UNIQUE(user_id, shop_id) -- Um usuário não pode ter permissão duplicada na mesma loja
);

-- Índices para performance
CREATE INDEX idx_user_shops_user_id ON user_shops(user_id);
CREATE INDEX idx_user_shops_shop_id ON user_shops(shop_id);
CREATE INDEX idx_user_shops_active ON user_shops(is_active);
```

**Exemplo de Dados**:
```sql
-- Admin que gerencia 3 unidades
INSERT INTO user_shops (user_id, shop_id, role) VALUES
    ('admin-123', 'shop-centro', 'ADMIN'),
    ('admin-123', 'shop-zona-sul', 'ADMIN'),
    ('admin-123', 'shop-zona-norte', 'ADMIN');
```

#### Tabela `users` (Atualizada)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- CLIENT, BARBER, ADMIN, SUPER_ADMIN
    shop_id UUID, -- Barbearia PADRÃO (onde ele faz login inicialmente)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (shop_id) REFERENCES barbershops(id)
);
```

#### Tabela `team_members` (Barbeiros)

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- ← Vínculo com users
    shop_id UUID NOT NULL,
    nickname VARCHAR(100),
    bio TEXT,
    experience_years INT,
    role VARCHAR(20) DEFAULT 'BARBER', -- BARBER, MANAGER, ADMIN
    work_model VARCHAR(30) NOT NULL, -- COMMISSION_ONLY, SALARY, SALARY_COMMISSION, CHAIR_RENT
    monthly_salary DECIMAL(10,2),
    chair_rental_fee DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES barbershops(id),
    UNIQUE(user_id, shop_id) -- Um usuário não pode ser barbeiro duplicado na mesma loja
);
```

### 3. Query para Verificar Vínculos

```typescript
// src/barbershops/barbershops.service.ts

/**
 * Verifica se um usuário tem permissão para acessar uma barbearia
 */
async checkUserAccess(userId: string, shopId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['teamMemberships'] // Se tiver relação M:N
    });
    
    if (!user) return false;
    
    // SUPER_ADMIN: Acesso total
    if (user.role === UserRole.SUPER_ADMIN) {
        return true;
    }
    
    // ADMIN: Verifica se é admin desta loja
    if (user.role === UserRole.ADMIN && user.shopId === shopId) {
        return true;
    }
    
    // BARBER: Verifica se trabalha nesta loja
    if (user.role === UserRole.BARBER) {
        const barberRecord = await this.teamRepository.findOne({
            where: {
                userId: userId,
                shopId: shopId,
                isActive: true
            }
        });
        
        return !!barberRecord;
    }
    
    return false;
}
```

## 🧪 Testes

### Teste 1: SUPER_ADMIN pode trocar para qualquer loja

```bash
curl -X POST http://localhost:3000/api/v1/barbershops/switch \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"shopId": "<ANY_SHOP_ID>"}'
```

**Resultado Esperado**: ✅ 200 OK com novos tokens

### Teste 2: ADMIN troca para loja que não administra

```bash
curl -X POST http://localhost:3000/api/v1/barbershops/switch \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"shopId": "<OTHER_SHOP_ID>"}'
```

**Resultado Esperado**: ❌ 403 Forbidden

### Teste 3: BARBER troca para loja onde trabalha

```bash
curl -X POST http://localhost:3000/api/v1/barbershops/switch \
  -H "Authorization: Bearer <BARBER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"shopId": "<HIS_SHOP_ID>"}'
```

**Resultado Esperado**: ✅ 200 OK com novos tokens

### Teste 4: CLIENT tenta trocar (não deveria chamar)

Frontend bloqueia antes, mas se chamar via API:

```bash
curl -X POST http://localhost:3000/api/v1/barbershops/switch \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"shopId": "<ANY_SHOP_ID>"}'
```

**Resultado Esperado**: ❌ 403 Forbidden

## 📊 Fluxograma de Decisão

```
┌─────────────────────────────────────┐
│ Usuário tenta trocar de barbearia  │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Está logado? │
        └──────┬───────┘
               │
         ┌─────┴─────┐
         │           │
        SIM         NÃO
         │           │
         │           ▼
         │    ┌──────────────┐
         │    │ Troca local  │ ← Apenas visualização
         │    │ (frontend)   │
         │    └──────────────┘
         │
         ▼
    ┌────────────┐
    │ Qual role? │
    └─────┬──────┘
          │
    ┌─────┴─────┬─────────┬──────────┐
    │           │         │          │
  CLIENT    BARBER     ADMIN    SUPER_ADMIN
    │           │         │          │
    ▼           ▼         ▼          ▼
 Troca    Verifica   Verifica    Acesso
 local     vínculo    se admin    TOTAL
(frontend) TeamMember  shopId      ✅
    │           │         │          │
    │      ┌────┴────┐    │          │
    │      │ Existe? │    │          │
    │      └────┬────┘    │          │
    │      ┌────┴────┐    │          │
    │     SIM       NÃO   │          │
    │      │         │    │          │
    │      ▼         ▼    ▼          │
    │     ✅        ❌   ✅         │
    │     │         │    │          │
    └─────┴─────────┴────┴──────────┘
                  │
                  ▼
        ┌──────────────────┐
        │ Gera novo JWT    │
        │ com shopId novo  │
        └──────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │ Atualiza frontend│
        │ Recarrega dados  │
        └──────────────────┘
```

## 🚀 Próximos Passos

### Frontend ✅ (Completo)

- [x] Tratamento de erro 403 com mensagem clara
- [x] Lógica baseada em role do usuário
- [x] Fallback para modo local (clientes)
- [x] UI de feedback visual
- [x] Imports e tipos corretos

### Backend ⚠️ (Requer Implementação)

- [ ] Atualizar endpoint `/barbershops/switch`
- [ ] Implementar validação por role
- [ ] Criar query `checkUserAccess()`
- [ ] Adicionar coluna `user_id` em `team_members` (se não existe)
- [ ] Criar índices para performance
- [ ] Adicionar logs de auditoria para troca de barbearia
- [ ] Testes unitários e de integração

### Banco de Dados 📊

- [ ] Verificar se `team_members.user_id` existe
- [ ] Criar constraint UNIQUE(user_id, shop_id)
- [ ] Adicionar índices: 
  - `users(role, shop_id)`
  - `team_members(user_id, shop_id, is_active)`

## 🔍 Debugging

### Como verificar permissões de um usuário

```sql
-- Ver dados do usuário
SELECT id, name, email, role, shop_id 
FROM users 
WHERE id = '<USER_ID>';

-- Ver vínculos de barbeiro
SELECT tm.*, b.name as shop_name
FROM team_members tm
JOIN barbershops b ON b.id = tm.shop_id
WHERE tm.user_id = '<USER_ID>'
AND tm.is_active = true;
```

### Logs no Frontend

Abra o console do navegador (F12) e procure por:

```
✅ Troca de barbearia bem-sucedida
❌ Erro ao trocar de loja via API: ...
👥 Cliente/não autenticado: troca local apenas
⚠️ Endpoint /barbershops/switch não implementado
```

### Logs no Backend (Adicionar)

```typescript
// barbershops.controller.ts

@Post('switch')
async switchBarbershop(@Body() dto: SwitchBarbershopDto, @Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const targetShopId = dto.shopId;
    
    this.logger.log(`🔄 Switch request: User ${userId} (${userRole}) → Shop ${targetShopId}`);
    
    // ... sua lógica aqui
    
    this.logger.log(`✅ Switch successful: User ${userId} → Shop ${targetShopId}`);
}
```

## ➕ Criar Nova Barbearia (Feature Futura)

### Requisitos

O administrador deve poder criar nova unidade com opções de:

1. ✅ **Copiar Produtos** da unidade atual
2. ✅ **Copiar Serviços** da unidade atual
3. ✅ **Copiar Planos** da unidade atual
4. ❌ **NÃO copiar Time** (barbeiros são específicos da unidade)

### Implementação Frontend (TODO)

```tsx
// src/components/CreateShopModal.tsx

export const CreateShopModal: React.FC = () => {
  const { shop: currentShop } = useShop();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    copyProducts: true,  // ← Checkbox
    copyServices: true,  // ← Checkbox
    copyPlans: false,    // ← Checkbox
  });
  
  const handleCreate = async () => {
    // 1. Criar nova barbearia
    const newShop = await barbershopService.create({
      name: form.name,
      address: form.address,
      phone: form.phone,
    });
    
    // 2. Copiar produtos se necessário
    if (form.copyProducts) {
      const products = await productService.list(currentShop.id);
      for (const product of products) {
        await productService.create(newShop.id, {
          ...product,
          id: undefined, // Remover ID para criar novo
        });
      }
    }
    
    // 3. Copiar serviços se necessário
    if (form.copyServices) {
      const services = await serviceService.list(currentShop.id);
      for (const service of services) {
        await serviceService.create(newShop.id, {
          ...service,
          id: undefined,
        });
      }
    }
    
    // 4. Copiar planos se necessário
    if (form.copyPlans) {
      const plans = await planService.list(currentShop.id);
      for (const plan of plans) {
        await planService.create(newShop.id, {
          ...plan,
          id: undefined,
        });
      }
    }
    
    // 5. Adicionar permissão do admin para a nova unidade
    await barbershopService.addUserPermission(newShop.id, currentUserId);
  };
  
  return (
    <Modal>
      <h2>Criar Nova Unidade</h2>
      <Input label="Nome" value={form.name} onChange={...} />
      <Input label="Endereço" value={form.address} onChange={...} />
      <Input label="Telefone" value={form.phone} onChange={...} />
      
      <div className="space-y-2 mt-4">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={form.copyProducts}
            onChange={(e) => setForm({...form, copyProducts: e.target.checked})}
          />
          <span>Copiar produtos de {currentShop.name}</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={form.copyServices}
            onChange={(e) => setForm({...form, copyServices: e.target.checked})}
          />
          <span>Copiar serviços de {currentShop.name}</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={form.copyPlans}
            onChange={(e) => setForm({...form, copyPlans: e.target.checked})}
          />
          <span>Copiar planos de {currentShop.name}</span>
        </label>
      </div>
      
      <Button onClick={handleCreate}>Criar Unidade</Button>
    </Modal>
  );
};
```

### Implementação Backend (TODO)

```typescript
// src/barbershops/barbershops.controller.ts

@Post()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN) // Apenas SUPER_ADMIN pode criar unidades
async create(@Body() dto: CreateBarbershopDto, @Request() req) {
    const newShop = await this.barbershopsService.create(dto);
    
    // Se criador é ADMIN, adicionar permissão automática
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
        await this.userShopsService.create({
            userId: req.user.id,
            shopId: newShop.id,
            role: UserRole.ADMIN,
        });
    }
    
    return newShop;
}

@Post(':shopId/copy-data')
@UseGuards(JwtAuthGuard)
async copyDataFromShop(
    @Param('shopId') targetShopId: string,
    @Body() dto: { sourceShopId: string; copyProducts: boolean; copyServices: boolean; copyPlans: boolean },
    @Request() req
) {
    // Verificar permissão para as duas lojas
    const hasSourceAccess = await this.checkUserAccess(req.user.id, dto.sourceShopId);
    const hasTargetAccess = await this.checkUserAccess(req.user.id, targetShopId);
    
    if (!hasSourceAccess || !hasTargetAccess) {
        throw new ForbiddenException('Você não tem permissão para copiar dados entre estas unidades');
    }
    
    const results = [];
    
    // Copiar produtos
    if (dto.copyProducts) {
        const products = await this.productsService.findByShop(dto.sourceShopId);
        for (const product of products) {
            const newProduct = await this.productsService.create(targetShopId, {
                ...product,
                id: undefined,
                shopId: targetShopId,
            });
            results.push({ type: 'product', id: newProduct.id });
        }
    }
    
    // Copiar serviços
    if (dto.copyServices) {
        const services = await this.servicesService.findByShop(dto.sourceShopId);
        for (const service of services) {
            const newService = await this.servicesService.create(targetShopId, {
                ...service,
                id: undefined,
                shopId: targetShopId,
            });
            results.push({ type: 'service', id: newService.id });
        }
    }
    
    // Copiar planos
    if (dto.copyPlans) {
        const plans = await this.plansService.findByShop(dto.sourceShopId);
        for (const plan of plans) {
            const newPlan = await this.plansService.create(targetShopId, {
                ...plan,
                id: undefined,
                shopId: targetShopId,
            });
            results.push({ type: 'plan', id: newPlan.id });
        }
    }
    
    return {
        message: 'Dados copiados com sucesso',
        copied: results.length,
        details: results,
    };
}
```

## 📞 Suporte

### Frontend

Se o erro persistir após correções do backend:

1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Limpar localStorage: `localStorage.clear()`
3. Fazer logout e login novamente
4. Verificar console do navegador (F12)

### Backend

Se o endpoint continuar retornando 403:

1. Verificar logs do NestJS
2. Confirmar que JWT possui campo `role`
3. Testar queries SQL manualmente
4. Verificar guards e decorators aplicados ao endpoint

---

**Última atualização**: 13 de fevereiro de 2026  
**Versão**: 3.0.0  
**Autor**: Sistema de Documentação BarberPro  
**Changelog**:
- v3.0.0: Adicionado ShopSelector no AdminDashboard, documentação completa de troca de unidades por contexto, feature de criar nova barbearia
- v2.1.0: Tratamento de erro 403, validação por role
- v2.0.0: Sistema de troca de barbearias implementado
