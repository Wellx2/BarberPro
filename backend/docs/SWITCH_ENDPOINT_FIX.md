# 🔧 Correção: Bad Request no Endpoint Switch

**Data:** 07/02/2026  
**Problema:** Frontend recebia erro 400 Bad Request ao chamar POST `/api/barbershops/switch`

---

## 🐛 Causa do Problema

O controller estava esperando receber o `shopId` diretamente como parâmetro:

```typescript
// ❌ ANTES (causava bad request)
async switchBarbershop(@Req() req, @Body('shopId') shopId: string) {
  return this.barbershopsService.switchBarbershop(req.user.id, shopId);
}
```

Isso funcionaria apenas se o frontend enviasse:
```typescript
// Formato incompatível
await fetch('/api/barbershops/switch', {
  body: 'uuid-da-barbearia' // ❌ Não é JSON válido
});
```

---

## ✅ Solução Implementada

### 1. Criado DTO Específico

**Arquivo:** [src/barbershops/dto/switch-barbershop.dto.ts](../src/barbershops/dto/switch-barbershop.dto.ts)

```typescript
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchBarbershopDto {
  @ApiProperty({
    description: 'ID da barbearia para a qual deseja trocar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'O ID da barbearia é obrigatório' })
  @IsUUID('4', { message: 'O ID da barbearia deve ser um UUID válido' })
  shopId: string;
}
```

**Validações:**
- `shopId` é obrigatório (`@IsNotEmpty`)
- `shopId` deve ser UUID v4 válido (`@IsUUID`)
- Mensagens de erro em português

---

### 2. Atualizado Controller

**Arquivo:** [src/barbershops/barbershops.controller.ts](../src/barbershops/barbershops.controller.ts)

```typescript
// ✅ AGORA (funciona corretamente)
import { SwitchBarbershopDto } from './dto/switch-barbershop.dto';

@Post('switch')
@Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.BARBER)
@ApiOperation({ summary: 'Trocar de barbearia' })
async switchBarbershop(@Req() req, @Body() dto: SwitchBarbershopDto) {
  return this.barbershopsService.switchBarbershop(req.user.id, dto.shopId);
}
```

**Mudanças:**
- Importou `SwitchBarbershopDto`
- Substituiu `@Body('shopId')` por `@Body() dto: SwitchBarbershopDto`
- Acessa `dto.shopId` ao chamar o service

---

## 📝 Formato Correto do Request

### Frontend deve enviar JSON completo:

```typescript
// ✅ CORRETO
const response = await fetch('http://localhost:3000/api/barbershops/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json', // ← Importante!
  },
  body: JSON.stringify({
    shopId: 'uuid-da-barbearia' // ← Objeto JSON
  }),
});
```

---

## 🧪 Testando a Correção

### Teste com cURL:

```bash
curl -X POST http://localhost:3000/api/barbershops/switch \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Teste no Console do Navegador:

```javascript
// Deve retornar 200 OK com novos tokens
const response = await fetch('http://localhost:3000/api/barbershops/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shopId: 'uuid-da-barbearia-valido',
  }),
});

const data = await response.json();
console.log(data); // { message, shop, user, accessToken, refreshToken }
```

---

## 📋 Validações do DTO

O DTO agora valida automaticamente:

### ✅ Request válido:
```json
{
  "shopId": "123e4567-e89b-12d3-a456-426614174000"
}
```
**Resposta:** `200 OK` com dados + tokens

---

### ❌ shopId vazio:
```json
{
  "shopId": ""
}
```
**Resposta:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["O ID da barbearia é obrigatório"],
  "error": "Bad Request"
}
```

---

### ❌ shopId não é UUID:
```json
{
  "shopId": "abc123"
}
```
**Resposta:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["O ID da barbearia deve ser um UUID válido"],
  "error": "Bad Request"
}
```

---

### ❌ shopId ausente:
```json
{}
```
**Resposta:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["O ID da barbearia é obrigatório"],
  "error": "Bad Request"
}
```

---

## 🎯 Benefícios da Correção

1. **Validação Automática**: class-validator valida formato UUID
2. **Mensagens Claras**: Erros em português para o frontend
3. **Swagger Atualizado**: Documentação da API gerada automaticamente
4. **Padrão NestJS**: Consistente com outros endpoints do projeto
5. **Type Safety**: TypeScript garante tipagem correta

---

## 📚 Referências

- Guia completo: [SWITCH_SHOP_GUIDE.md](./SWITCH_SHOP_GUIDE.md)
- Análise arquitetural: [MULTITENANT_ANALYSIS.md](./MULTITENANT_ANALYSIS.md)
- DTO criado: [switch-barbershop.dto.ts](../src/barbershops/dto/switch-barbershop.dto.ts)

---

**Status:** ✅ **CORRIGIDO**

O endpoint agora funciona corretamente com o formato JSON esperado pelo frontend! 🎉
