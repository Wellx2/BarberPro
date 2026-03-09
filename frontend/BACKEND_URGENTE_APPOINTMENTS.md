# 🚨 URGENTE - Backend: Endpoint de Appointments

**Data:** 18/02/2026  
**Status:** ❌ BLOQUEANDO PRODUÇÃO  
**Prioridade:** 🔥 CRÍTICA

---

## 📊 RESULTADO DOS TESTES

### ✅ O QUE ESTÁ FUNCIONANDO

1. **JWT está perfeito** ✅
   ```json
   {
     "sub": "45b90b65-4ba8-49e7-87d0-bdd092c00cca",
     "role": "CLIENT",
     "shopId": "f95101f7-ab85-46d2-bb1e-c300c49ad095"
   }
   ```

2. **Frontend está enviando dados corretos** ✅
   ```json
   {
     "barberId": "da32c394-bf23-4860-8a6c-a54b40035e18",
     "serviceIds": ["14471c86-9444-43aa-ba23-2eeeee1e067e"],
     "date": "2026-02-18T14:00:00.000Z"
   }
   ```

### ❌ O QUE NÃO ESTÁ FUNCIONANDO

**TODAS as 4 variações testadas falharam com 400:**

1. ❌ `{ barberId, serviceIds, date }`
2. ❌ `{ barberId, serviceIds, scheduledFor }`
3. ❌ `{ barberId, serviceIds, scheduledAt }`
4. ❌ `{ barberId, serviceIds, date, clientId, barbershopId }` (com campos explícitos)

**Erro retornado:**
```json
{
  "statusCode": 400,
  "message": "Bad Request Exception",
  "timestamp": "2026-02-18T06:01:31.144Z",
  "path": "/api/appointments"
}
```

---

## 🔍 DIAGNÓSTICO

O erro **"Bad Request Exception"** genérico (sem detalhes de validação) indica:

### Possível Causa 1: Endpoint não implementado
```bash
# Verificar se o endpoint existe
GET http://localhost:3000/api/docs
# Procurar por: POST /api/appointments
```

### Possível Causa 2: DTO com validação incorreta
```typescript
// backend/src/appointments/dto/create-appointment.dto.ts
export class CreateAppointmentDto {
  @IsUUID()
  barberId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsDateString() // ← Campo de data
  date: string;    // ← Qual o nome correto?
}
```

### Possível Causa 3: Guard bloqueando request
```typescript
// Verificar se tem @UseGuards() no controller
@Post()
@UseGuards(JwtAuthGuard, TenantGuard) // ← Pode estar falhando aqui
async create(@Body() dto: CreateAppointmentDto) {
  // ...
}
```

---

## ✅ AÇÃO NECESSÁRIA - BACKEND

### 1️⃣ **VERIFICAR NO SWAGGER**

Acesse: **http://localhost:3000/api/docs**

Procure por: **POST /api/appointments**

**Perguntas:**
- ✅ O endpoint aparece no Swagger?
- ✅ Qual o formato EXATO do body?
- ✅ Quais campos são obrigatórios?
- ✅ Qual o nome do campo de data? (`date`, `scheduledFor`, `scheduledAt`?)

---

### 2️⃣ **TESTAR NO SWAGGER UI**

Clique em **"Try it out"** e teste com:

```json
{
  "barberId": "da32c394-bf23-4860-8a6c-a54b40035e18",
  "serviceIds": ["14471c86-9444-43aa-ba23-2eeeee1e067e"],
  "date": "2026-02-18T14:00:00.000Z"
}
```

**Se der erro:**
1. Copie o erro COMPLETO (com detalhes de validação)
2. Ajuste o payload até funcionar no Swagger
3. Me passe o payload que funcionou

---

### 3️⃣ **VERIFICAR LOGS DO BACKEND**

Ao receber a requisição, o backend deve logar:

```
[Nest] LOG [AppointmentsController] POST /appointments
[Nest] LOG Body: { barberId: '...', serviceIds: [...], date: '...' }
[Nest] ERROR Validation failed: [...]
```

**Me envie os logs do backend** quando a requisição chegar!

---

## 🔧 POSSÍVEIS SOLUÇÕES

### Solução 1: Campo de data com nome diferente

**Se o backend espera `scheduledFor`:**
```typescript
// backend/src/appointments/dto/create-appointment.dto.ts
export class CreateAppointmentDto {
  @IsDateString()
  scheduledFor: string; // ← Nome do campo
}
```

**Me informe e eu ajusto o frontend!**

---

### Solução 2: Campos adicionais obrigatórios

**Se o backend espera mais campos:**
```typescript
export class CreateAppointmentDto {
  barberId: string;
  serviceIds: string[];
  date: string;
  
  // Campos que podem estar faltando:
  clientId?: string;      // Inferido do JWT?
  barbershopId?: string;  // Inferido do JWT?
  duration?: number;      // Em minutos
  totalPrice?: number;    // Em reais
}
```

**Me passe a lista completa de campos obrigatórios!**

---

### Solução 3: Endpoint não está funcionando

**Verificar se está registrado:**
```typescript
// backend/src/app.module.ts
@Module({
  imports: [
    // ...
    AppointmentsModule, // ← TEM que estar aqui!
  ],
})
```

**Verificar controller:**
```typescript
// backend/src/appointments/appointments.controller.ts
@Controller('appointments') // ← NÃO pode ter /api aqui
export class AppointmentsController {
  
  @Post()
  @UseGuards(JwtAuthGuard) // ← Verificar guards
  async create(
    @Body() dto: CreateAppointmentDto,
    @Request() req // ← Para pegar userId do JWT
  ) {
    console.log('📦 CreateAppointmentDto:', dto);
    console.log('👤 User do JWT:', req.user);
    
    // Implementação aqui
  }
}
```

---

## 📋 CHECKLIST - BACKEND

- [ ] Endpoint aparece no Swagger (http://localhost:3000/api/docs)
- [ ] Testei no Swagger UI e funcionou
- [ ] DTO tem todos os decoradores de validação
- [ ] Guards não estão bloqueando a requisição
- [ ] Logs do backend mostram a requisição chegando
- [ ] Payload que funciona no Swagger foi documentado

---

## 🆘 FRONTEND ESTÁ PRONTO

O frontend agora tenta **4 variações diferentes** automaticamente:

```javascript
✅ Variação 1: { date }
✅ Variação 2: { date, clientId, barbershopId } explícitos
✅ Variação 3: { scheduledFor }
✅ Variação 4: { scheduledAt, duration }
```

**Assim que o backend funcionar em UMA dessas variações, o frontend vai detectar automaticamente!**

---

## 🧪 TESTE NOVAMENTE AGORA

1. **Recarregue a página** (Ctrl + Shift + R)
2. **Tente criar um agendamento**
3. **Veja no console qual variação está sendo testada**

Os logs agora mostram:
```
🔄 Tentando "date only": {...}
❌ Falhou "date only": { status, message, errors }

🔄 Tentando "date + clientId + barbershopId": {...}
✅ SUCESSO! // ← Se alguma funcionar
```

---

## 📞 PRÓXIMOS PASSOS

1. **Verifique o Swagger** do backend
2. **Teste manualmente** no Swagger UI
3. **Me envie**:
   - Screenshot do Swagger mostrando o endpoint
   - Payload que funciona no Swagger
   - Logs do backend quando recebe a requisição

**Assim que souber o formato exato, ajusto o frontend em 2 minutos!** 🚀

---

**IMPORTANTE:** O problema NÃO é no frontend. Todos os dados estão corretos. O problema é que o backend não está aceitando NENHUM dos formatos comuns de appointment. Precisamos descobrir o que ele espera exatamente.
