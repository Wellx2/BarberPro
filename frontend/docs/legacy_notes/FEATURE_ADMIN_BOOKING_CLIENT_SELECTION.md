# 🎯 FEATURE - ADMIN/BARBER Agendar para Clientes

## 📋 Requisito
ADMIN e BARBER devem poder criar agendamentos para clientes, com duas opções:

1. **Selecionar cliente existente** - Buscar por nome, telefone ou CPF
2. **Cliente walk-in (temporário)** - Criar agendamento sem cadastro prévio

---

## 🎨 Fluxo UX - Tela de Agendamento

### **Para CLIENTE:**
- Fluxo atual permanece igual
- Cliente agenda para si mesmo
- Backend infere `clientId` do JWT

### **Para ADMIN/BARBER:**

#### **Passo 0: Selecionar Cliente (NOVO)**
```
┌─────────────────────────────────────────┐
│  PARA QUEM É ESTE AGENDAMENTO?          │
├─────────────────────────────────────────┤
│                                         │
│  🔍 [Buscar cliente...]                 │
│     Digite nome, telefone ou CPF        │
│                                         │
│  📋 Resultados:                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 João Silva                   │   │
│  │    📞 (11) 98765-4321          │   │
│  │    📧 joao@email.com           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  OU                                     │
│                                         │
│  [+ Cliente Walk-in]                    │
│    (agendamento sem cadastro prévio)    │
│                                         │
└─────────────────────────────────────────┘
```

**Opção 1: Cliente Existente**
- Digita nome/telefone/CPF
- Sistema busca em tempo real
- Seleciona cliente
- Prossegue com agendamento normal

**Opção 2: Walk-in**
- Cria agendamento temporário
- Pode salvar nome e telefone opcionais
- Agendamento fica vinculado a "cliente genérico"
- **Se cliente se cadastrar depois:**
  - Sistema busca por telefone/CPF
  - Vincula agendamento automaticamente

---

## 💻 Implementação Frontend

### **1. Novo componente: ClientSelector.tsx**

```tsx
interface ClientSelectorProps {
  onSelectClient: (clientId: string | null) => void;
  onWalkIn: (tempName?: string, tempPhone?: string) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  onSelectClient,
  onWalkIn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar clientes em tempo real
  useEffect(() => {
    if (searchTerm.length < 3) return;
    
    const searchClients = async () => {
      setLoading(true);
      try {
        const results = await clientService.search(searchTerm);
        setClients(results);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar por nome, telefone ou CPF..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border"
      />
      
      {loading && <p>Buscando...</p>}
      
      {clients.map(client => (
        <button
          key={client.id}
          onClick={() => onSelectClient(client.id)}
          className="w-full p-4 border rounded-lg hover:bg-gray-50"
        >
          <p className="font-bold">{client.name}</p>
          <p className="text-sm text-gray-500">{client.phone}</p>
        </button>
      ))}
      
      <button
        onClick={() => onWalkIn()}
        className="w-full py-3 border-2 border-dashed rounded-lg"
      >
        + Cliente Walk-in (sem cadastro)
      </button>
    </div>
  );
};
```

### **2. Atualizar Booking.tsx**

```tsx
// Estado para cliente selecionado
const [selectedClient, setSelectedClient] = useState<string | null>(null);
const [isWalkIn, setIsWalkIn] = useState(false);

// Primeiro "step" para ADMIN/BARBER
{user?.role !== 'CLIENT' && step === 0 && (
  <ClientSelector
    onSelectClient={(clientId) => {
      setSelectedClient(clientId);
      setStep(1);
    }}
    onWalkIn={() => {
      setIsWalkIn(true);
      setStep(1);
    }}
  />
)}

// Ao criar agendamento
const appointmentData = {
  barberId: finalBarberId,
  serviceIds: selectedServices,
  date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
  ...(selectedClient && { clientId: selectedClient }), // Cliente selecionado
  ...(isWalkIn && { isWalkIn: true }), // Walk-in
};
```

---

## 🔧 Implementação Backend

### **1. Endpoint de Busca de Clientes**

```typescript
// GET /api/clients/search?q=termo
@Get('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'BARBER')
async searchClients(@Query('q') query: string, @Request() req) {
  return this.clientsService.search(query, req.user.shopId);
}
```

**Service:**
```typescript
async search(query: string, shopId: string) {
  // Buscar por nome, telefone ou CPF
  return this.clientsRepository.find({
    where: [
      { shopId, name: Like(`%${query}%`) },
      { shopId, phone: Like(`%${query}%`) },
      { shopId, cpf: Like(`%${query}%`) },
    ],
    select: ['id', 'name', 'phone', 'email', 'avatar'],
    take: 10, // Limitar resultados
  });
}
```

### **2. Atualizar CreateAppointmentDto**

```typescript
export class CreateAppointmentDto {
  @IsUUID()
  barberId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsDateString()
  date: string;

  // NOVO: clientId opcional (para ADMIN/BARBER)
  @IsOptional()
  @IsUUID()
  clientId?: string;

  // NOVO: marcador de walk-in
  @IsOptional()
  @IsBoolean()
  isWalkIn?: boolean;

  // NOVO: dados temporários para walk-in
  @IsOptional()
  @IsString()
  walkInName?: string;

  @IsOptional()
  @IsString()
  walkInPhone?: string;
}
```

### **3. Lógica no AppointmentsService**

```typescript
async create(dto: CreateAppointmentDto, userId: string, shopId: string) {
  let finalClientId: string;

  // Determinar clientId
  if (dto.clientId) {
    // ADMIN/BARBER selecionou um cliente
    finalClientId = dto.clientId;
  } else if (dto.isWalkIn) {
    // Walk-in: criar/buscar cliente genérico walk-in
    finalClientId = await this.getOrCreateWalkInClient(
      shopId,
      dto.walkInName,
      dto.walkInPhone
    );
  } else {
    // Cliente padrão: usar userId do JWT
    finalClientId = userId;
  }

  // Criar agendamento
  const appointment = this.appointmentsRepository.create({
    shopId,
    clientId: finalClientId,
    barberId: dto.barberId,
    serviceIds: dto.serviceIds,
    date: new Date(dto.date),
    isWalkIn: dto.isWalkIn || false,
    status: 'SCHEDULED',
  });

  return this.appointmentsRepository.save(appointment);
}

/**
 * Busca ou cria cliente genérico para walk-in
 */
private async getOrCreateWalkInClient(
  shopId: string,
  name?: string,
  phone?: string
) {
  // Se tiver telefone, tentar buscar cliente existente
  if (phone) {
    const existing = await this.clientsRepository.findOne({
      where: { shopId, phone },
    });
    if (existing) return existing.id;
  }

  // Criar cliente temporário walk-in
  const walkIn = this.clientsRepository.create({
    shopId,
    name: name || 'Cliente Walk-in',
    phone: phone || null,
    email: null,
    isWalkIn: true, // Marcador de walk-in
  });

  const saved = await this.clientsRepository.save(walkIn);
  return saved.id;
}
```

### **4. Vincular walk-in quando cliente se cadastrar**

```typescript
// No AuthService, ao criar novo cliente
async register(dto: RegisterDto) {
  const client = await this.clientsRepository.create(dto);
  const saved = await this.clientsRepository.save(client);

  // Buscar agendamentos walk-in com mesmo telefone/CPF
  if (dto.phone) {
    await this.appointmentsService.linkWalkInAppointments(
      saved.id,
      dto.phone,
      dto.shopId
    );
  }

  return saved;
}
```

```typescript
// No AppointmentsService
async linkWalkInAppointments(clientId: string, phone: string, shopId: string) {
  // Buscar cliente walk-in temporário com esse telefone
  const walkInClient = await this.clientsRepository.findOne({
    where: { shopId, phone, isWalkIn: true },
  });

  if (!walkInClient) return;

  // Transferir agendamentos para novo cliente
  await this.appointmentsRepository.update(
    { clientId: walkInClient.id },
    { clientId: clientId }
  );

  // Desativar ou excluir cliente walk-in temporário
  await this.clientsRepository.softDelete(walkInClient.id);
}
```

---

## ✅ Resumo da Feature

### **Frontend:**
1. ✅ Criar componente `ClientSelector`
2. ✅ Adicionar step 0 para ADMIN/BARBER
3. ✅ Busca de clientes em tempo real
4. ✅ Opção de walk-in

### **Backend:**
1. ✅ Endpoint de busca de clientes
2. ✅ Atualizar DTO de agendamento
3. ✅ Lógica de walk-in no service
4. ✅ Vincular walk-ins automaticamente

### **Banco de Dados:**
1. ✅ Campo `isWalkIn` na tabela `appointments`
2. ✅ Campo `isWalkIn` na tabela `clients`

---

## 🎨 Fluxo Completo

**ADMIN cria agendamento:**
1. Clica em "Novo Agendamento"
2. Busca cliente: "João" → Aparece "João Silva"
3. Seleciona João Silva
4. Escolhe serviços, barbeiro, data/hora
5. Confirma
6. ✅ Agendamento criado para João Silva

**ADMIN cria walk-in:**
1. Clica em "Novo Agendamento"
2. Clica "+ Cliente Walk-in"
3. (Opcional) Digita nome "José" e telefone "(11) 98888-8888"
4. Escolhe serviços, barbeiro, data/hora
5. Confirma
6. ✅ Agendamento criado para "José" (walk-in)

**José se cadastra depois:**
1. José cria conta com telefone "(11) 98888-8888"
2. Backend detecta walk-in com mesmo telefone
3. ✅ Agendamento vinculado automaticamente ao perfil de José

---

**Data:** 18/02/2026  
**Status:** 🔄 Pendente de implementação  
**Prioridade:** MÉDIA (funcionalidade adicional)
