# Endpoints Públicos da API

## GET /api/services/public/shop/:shopId

Endpoint público para listar os serviços de uma barbearia específica. **Não requer autenticação**.

### Parâmetros

- `shopId` (path, obrigatório): ID da barbearia
- `active` (query, opcional): Filtrar apenas serviços ativos (true/false)

### Exemplo de Requisição

```bash
GET http://localhost:3000/api/services/public/shop/shop-1?active=true
```

### Exemplo de Resposta

```json
[
  {
    "id": "service-uuid-1",
    "shopId": "shop-1",
    "name": "Corte de Cabelo",
    "description": "Corte clássico ou moderno",
    "duration": 30,
    "price": 50.00,
    "category": "HAIR",
    "active": true,
    "createdAt": "2026-01-30T00:00:00.000Z",
    "updatedAt": "2026-01-30T00:00:00.000Z"
  },
  {
    "id": "service-uuid-2",
    "shopId": "shop-1",
    "name": "Barba",
    "description": "Aparar e modelar barba",
    "duration": 20,
    "price": 30.00,
    "category": "BEARD",
    "active": true,
    "createdAt": "2026-01-30T00:00:00.000Z",
    "updatedAt": "2026-01-30T00:00:00.000Z"
  }
]
```

### Status Codes

- `200 OK`: Sucesso
- `500 Internal Server Error`: Erro no servidor

### Notas

- Este endpoint **não exige autenticação JWT**
- Útil para exibir serviços na home page/catálogo público
- Frontend deve chamar com o shopId selecionado pelo usuário
- A rota é registrada **antes** das rotas protegidas no controller para garantir precedência

## Implementação

### Controller ([services.controller.ts](../src/services/services.controller.ts))

```typescript
// Endpoint PÚBLICO para listar serviços de uma barbearia específica
@Get('public/shop/:shopId')
@ApiOperation({ summary: 'Listar serviços de uma barbearia (público)' })
@ApiQuery({ name: 'active', required: false, type: Boolean })
async findByShop(
  @Param('shopId') shopId: string,
  @Query('active') active?: boolean,
) {
  return this.servicesService.findByShop(shopId, active);
}
```

### Service ([services.service.ts](../src/services/services.service.ts))

```typescript
// Método público para buscar serviços por shopId (sem autenticação)
async findByShop(shopId: string, active?: boolean) {
  return this.prisma.service.findMany({
    where: {
      shopId,
      ...(active !== undefined ? { active } : {}),
    },
    orderBy: { name: 'asc' },
  });
}
```

## Uso no Frontend

O frontend deve atualizar o `serviceService.ts` para usar este novo endpoint:

```typescript
async list(barbershopId?: string): Promise<Service[]> {
  // Se não autenticado, usar endpoint público
  const token = localStorage.getItem('token');
  
  if (!token && barbershopId) {
    const response = await api.get(`/services/public/shop/${barbershopId}?active=true`);
    return response.data;
  }
  
  // Se autenticado, usar endpoint protegido (original)
  const response = await api.get('/services', {
    params: { barbershopId, active: true }
  });
  return response.data;
}
```

## Teste da API

### Usando curl (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-1" | Select-Object -First 2
```

### Usando Postman

1. Método: GET
2. URL: `http://localhost:3000/api/services/public/shop/shop-1`
3. Query Params (opcional): `active=true`
4. **Não adicionar** Authorization Header

### Usando navegador

Simplesmente acessar:
```
http://localhost:3000/api/services/public/shop/shop-1
```
