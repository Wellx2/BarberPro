# 🧪 Testes de API - Agendamentos

## 📋 Índice
- [Setup Inicial](#setup-inicial)
- [1. Login](#1-login)
- [2. Buscar Dados](#2-buscar-dados)
- [3. Criar Agendamento](#3-criar-agendamento)
- [4. Listar Agendamentos](#4-listar-agendamentos)
- [5. Cancelar Agendamento](#5-cancelar-agendamento)
- [Testes PowerShell](#testes-powershell)
- [Testes cURL](#testes-curl)

---

## Setup Inicial

### 1. Certifique-se que o backend está rodando:
```powershell
npm run start:dev
```

### 2. Acesse o Swagger Docs:
```
http://localhost:3000/api/docs
```

---

## 1. Login

### Request
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@barberpro.com",
  "password": "Admin@123"
}
```

### Response Esperado
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "admin@barberpro.com",
    "name": "Admin",
    "role": "ADMIN",
    "shopId": "shop-uuid"
  }
}
```

**💾 Salve o `accessToken` para usar nas próximas requisições!**

---

## 2. Buscar Dados

### 2.1 Listar Clientes
```http
GET http://localhost:3000/api/clients
Authorization: Bearer SEU_ACCESS_TOKEN
```

**Copie um `id` de cliente da resposta.**

### 2.2 Listar Barbeiros
```http
GET http://localhost:3000/api/barbers
Authorization: Bearer SEU_ACCESS_TOKEN
```

**Copie um `id` de barbeiro da resposta.**

### 2.3 Listar Serviços
```http
GET http://localhost:3000/api/services
Authorization: Bearer SEU_ACCESS_TOKEN
```

**Copie um ou mais `id` de serviços da resposta.**

### 2.4 Listar Produtos (Opcional)
```http
GET http://localhost:3000/api/products
Authorization: Bearer SEU_ACCESS_TOKEN
```

---

## 3. Criar Agendamento

### 3.1 Agendamento Simples (Apenas Serviços)

```http
POST http://localhost:3000/api/appointments
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "clientId": "SUBSTITUA_PELO_UUID_DO_CLIENTE",
  "barberId": "SUBSTITUA_PELO_UUID_DO_BARBEIRO",
  "serviceIds": [
    "SUBSTITUA_PELO_UUID_DO_SERVICO"
  ],
  "date": "2026-02-20T14:30:00.000Z"
}
```

### 3.2 Agendamento com Múltiplos Serviços

```http
POST http://localhost:3000/api/appointments
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "clientId": "SUBSTITUA_PELO_UUID_DO_CLIENTE",
  "barberId": "SUBSTITUA_PELO_UUID_DO_BARBEIRO",
  "serviceIds": [
    "UUID_SERVICO_1",
    "UUID_SERVICO_2"
  ],
  "date": "2026-02-20T15:00:00.000Z"
}
```

### 3.3 Agendamento Completo (com Produtos)

```http
POST http://localhost:3000/api/appointments
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "clientId": "SUBSTITUA_PELO_UUID_DO_CLIENTE",
  "barberId": "SUBSTITUA_PELO_UUID_DO_BARBEIRO",
  "serviceIds": [
    "UUID_SERVICO_1"
  ],
  "date": "2026-02-20T16:00:00.000Z",
  "products": [
    {
      "id": "UUID_PRODUTO_1",
      "quantity": 2
    },
    {
      "id": "UUID_PRODUTO_2",
      "quantity": 1
    }
  ]
}
```

### Response Esperado (201 Created)

```json
{
  "id": "appointment-uuid",
  "shopId": "shop-uuid",
  "clientId": "client-uuid",
  "barberId": "barber-uuid",
  "date": "2026-02-20T14:30:00.000Z",
  "status": "SCHEDULED",
  "totalPrice": 75.00,
  "cancelReason": null,
  "createdAt": "2026-02-18T01:00:00.000Z",
  "updatedAt": "2026-02-18T01:00:00.000Z",
  "client": {
    "id": "client-uuid",
    "name": "João Silva",
    "phone": "(11) 98765-4321",
    "email": "joao@email.com"
  },
  "barber": {
    "id": "barber-uuid",
    "name": "Carlos Barbeiro",
    "specialty": "Cortes modernos",
    "active": true
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
    }
  ],
  "products": []
}
```

---

## 4. Listar Agendamentos

### 4.1 Listar Todos
```http
GET http://localhost:3000/api/appointments
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 4.2 Filtrar por Data
```http
GET http://localhost:3000/api/appointments?date=2026-02-20T00:00:00.000Z
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 4.3 Filtrar por Barbeiro
```http
GET http://localhost:3000/api/appointments?barberId=UUID_DO_BARBEIRO
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 4.4 Filtrar por Status
```http
GET http://localhost:3000/api/appointments?status=SCHEDULED
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 4.5 Múltiplos Filtros
```http
GET http://localhost:3000/api/appointments?date=2026-02-20T00:00:00.000Z&barberId=UUID_BARBEIRO&status=SCHEDULED
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 4.6 Buscar Por ID
```http
GET http://localhost:3000/api/appointments/UUID_DO_AGENDAMENTO
Authorization: Bearer SEU_ACCESS_TOKEN
```

---

## 5. Cancelar Agendamento

```http
PATCH http://localhost:3000/api/appointments/UUID_DO_AGENDAMENTO/cancel
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "cancelReason": "Cliente solicitou reagendamento"
}
```

### Response Esperado
```json
{
  "id": "appointment-uuid",
  "status": "CANCELLED",
  "cancelReason": "Cliente solicitou reagendamento",
  ...
}
```

---

## 6. Completar Agendamento (Admin/Barber)

```http
PATCH http://localhost:3000/api/appointments/UUID_DO_AGENDAMENTO/complete
Authorization: Bearer SEU_ACCESS_TOKEN
```

### Response Esperado
```json
{
  "id": "appointment-uuid",
  "status": "COMPLETED",
  ...
}
```

---

## Testes PowerShell

### Script Completo de Teste

```powershell
# test-appointments.ps1

# Configuração
$baseUrl = "http://localhost:3000/api"
$email = "admin@barberpro.com"
$password = "Admin@123"

# 1. Login
Write-Host "=== 1. LOGIN ===" -ForegroundColor Cyan
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResponse.accessToken
Write-Host "✅ Token obtido: $($token.Substring(0, 20))..." -ForegroundColor Green

# Headers com token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Buscar Clientes
Write-Host "`n=== 2. BUSCAR CLIENTES ===" -ForegroundColor Cyan
$clientes = Invoke-RestMethod -Uri "$baseUrl/clients" `
    -Method Get `
    -Headers $headers

Write-Host "✅ Encontrados $($clientes.Count) clientes" -ForegroundColor Green
$clientId = $clientes[0].id
Write-Host "Cliente selecionado: $($clientes[0].name) ($clientId)"

# 3. Buscar Barbeiros
Write-Host "`n=== 3. BUSCAR BARBEIROS ===" -ForegroundColor Cyan
$barbeiros = Invoke-RestMethod -Uri "$baseUrl/barbers" `
    -Method Get `
    -Headers $headers

Write-Host "✅ Encontrados $($barbeiros.Count) barbeiros" -ForegroundColor Green
$barberId = $barbeiros[0].id
Write-Host "Barbeiro selecionado: $($barbeiros[0].name) ($barberId)"

# 4. Buscar Serviços
Write-Host "`n=== 4. BUSCAR SERVIÇOS ===" -ForegroundColor Cyan
$servicos = Invoke-RestMethod -Uri "$baseUrl/services" `
    -Method Get `
    -Headers $headers

Write-Host "✅ Encontrados $($servicos.Count) serviços" -ForegroundColor Green
$serviceId = $servicos[0].id
Write-Host "Serviço selecionado: $($servicos[0].name) ($serviceId)"

# 5. Criar Agendamento
Write-Host "`n=== 5. CRIAR AGENDAMENTO ===" -ForegroundColor Cyan

# Data/hora: amanhã às 14:30
$dataAgendamento = (Get-Date).AddDays(1).Date.AddHours(14).AddMinutes(30)
$dataISO = $dataAgendamento.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$appointmentBody = @{
    clientId = $clientId
    barberId = $barberId
    serviceIds = @($serviceId)
    date = $dataISO
} | ConvertTo-Json

Write-Host "Criando agendamento para: $dataISO"

try {
    $appointment = Invoke-RestMethod -Uri "$baseUrl/appointments" `
        -Method Post `
        -Headers $headers `
        -Body $appointmentBody
    
    Write-Host "✅ Agendamento criado com sucesso!" -ForegroundColor Green
    Write-Host "ID: $($appointment.id)"
    Write-Host "Cliente: $($appointment.client.name)"
    Write-Host "Barbeiro: $($appointment.barber.name)"
    Write-Host "Data: $($appointment.date)"
    Write-Host "Preço Total: R$ $($appointment.totalPrice)"
    Write-Host "Status: $($appointment.status)"
    
    $appointmentId = $appointment.id
    
    # 6. Listar Agendamentos
    Write-Host "`n=== 6. LISTAR AGENDAMENTOS ===" -ForegroundColor Cyan
    $appointments = Invoke-RestMethod -Uri "$baseUrl/appointments" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Total de agendamentos: $($appointments.Count)" -ForegroundColor Green
    
    # 7. Buscar Agendamento Específico
    Write-Host "`n=== 7. BUSCAR AGENDAMENTO ESPECÍFICO ===" -ForegroundColor Cyan
    $appointmentDetail = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Detalhes do agendamento:" -ForegroundColor Green
    Write-Host ($appointmentDetail | ConvertTo-Json -Depth 5)
    
    # 8. Cancelar Agendamento
    Write-Host "`n=== 8. CANCELAR AGENDAMENTO ===" -ForegroundColor Cyan
    $cancelBody = @{
        cancelReason = "Teste de cancelamento via API"
    } | ConvertTo-Json
    
    $cancelled = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId/cancel" `
        -Method Patch `
        -Headers $headers `
        -Body $cancelBody
    
    Write-Host "✅ Agendamento cancelado!" -ForegroundColor Green
    Write-Host "Status: $($cancelled.status)"
    Write-Host "Motivo: $($cancelled.cancelReason)"
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERRO ao criar agendamento:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
```

### Executar:
```powershell
.\test-appointments.ps1
```

---

## Testes cURL

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barberpro.com","password":"Admin@123"}'
```

### 2. Criar Agendamento
```bash
# Substitua SEU_TOKEN e os UUIDs
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "UUID_CLIENTE",
    "barberId": "UUID_BARBEIRO",
    "serviceIds": ["UUID_SERVICO"],
    "date": "2026-02-20T14:30:00.000Z"
  }'
```

### 3. Listar Agendamentos
```bash
curl -X GET "http://localhost:3000/api/appointments" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 4. Cancelar
```bash
curl -X PATCH "http://localhost:3000/api/appointments/UUID_AGENDAMENTO/cancel" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cancelReason": "Motivo do cancelamento"}'
```

---

## 🧪 Cenários de Teste

### ✅ Teste 1: Agendamento Válido
- Cliente existe
- Barbeiro ativo
- Serviço existe
- Horário dentro do expediente
- Sem conflitos

**Resultado Esperado**: 201 Created

---

### ❌ Teste 2: Cliente Inválido
```json
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "barberId": "UUID_VALIDO",
  "serviceIds": ["UUID_VALIDO"],
  "date": "2026-02-20T14:30:00.000Z"
}
```
**Resultado Esperado**: 404 Not Found - "Cliente não encontrado"

---

### ❌ Teste 3: Formato de Data Inválido
```json
{
  "clientId": "UUID_VALIDO",
  "barberId": "UUID_VALIDO",
  "serviceIds": ["UUID_VALIDO"],
  "date": "20/02/2026 14:30"
}
```
**Resultado Esperado**: 400 Bad Request - "date must be a valid ISO 8601 date string"

---

### ❌ Teste 4: Array de Serviços Vazio
```json
{
  "clientId": "UUID_VALIDO",
  "barberId": "UUID_VALIDO",
  "serviceIds": [],
  "date": "2026-02-20T14:30:00.000Z"
}
```
**Resultado Esperado**: 400 Bad Request - "serviceIds must contain at least 1 elements"

---

### ❌ Teste 5: Horário Fora do Expediente
```json
{
  "clientId": "UUID_VALIDO",
  "barberId": "UUID_VALIDO",
  "serviceIds": ["UUID_VALIDO"],
  "date": "2026-02-20T22:00:00.000Z"
}
```
**Resultado Esperado**: 400 Bad Request - "Horário fora do expediente"

---

### ❌ Teste 6: Conflito de Horário
1. Criar agendamento para 14:30
2. Tentar criar outro agendamento para mesmo barbeiro às 14:30

**Resultado Esperado**: 409 Conflict - "Horário indisponível"

---

### ❌ Teste 7: Produto com Estoque Insuficiente
```json
{
  "clientId": "UUID_VALIDO",
  "barberId": "UUID_VALIDO",
  "serviceIds": ["UUID_VALIDO"],
  "date": "2026-02-20T14:30:00.000Z",
  "products": [
    {
      "id": "UUID_PRODUTO",
      "quantity": 999999
    }
  ]
}
```
**Resultado Esperado**: 400 Bad Request - "Estoque insuficiente"

---

## 📊 Postman Collection

### Importar no Postman:

1. Abra o Postman
2. Click em Import
3. Cole o JSON abaixo:

```json
{
  "info": {
    "name": "BarberPro - Agendamentos",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "1. Login",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const response = pm.response.json();",
              "pm.collectionVariables.set('token', response.accessToken);"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@barberpro.com\",\n  \"password\": \"Admin@123\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      }
    },
    {
      "name": "2. Criar Agendamento",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"clientId\": \"UUID_CLIENTE\",\n  \"barberId\": \"UUID_BARBEIRO\",\n  \"serviceIds\": [\"UUID_SERVICO\"],\n  \"date\": \"2026-02-20T14:30:00.000Z\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/appointments",
          "host": ["{{baseUrl}}"],
          "path": ["appointments"]
        }
      }
    },
    {
      "name": "3. Listar Agendamentos",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/appointments",
          "host": ["{{baseUrl}}"],
          "path": ["appointments"]
        }
      }
    }
  ]
}
```

---

## ✅ Checklist de Testes

- [ ] Login bem-sucedido e token salvo
- [ ] Buscar clientes retorna lista
- [ ] Buscar barbeiros retorna lista
- [ ] Buscar serviços retorna lista
- [ ] Criar agendamento simples (201)
- [ ] Criar agendamento com múltiplos serviços (201)
- [ ] Criar agendamento com produtos (201)
- [ ] Listar agendamentos (200)
- [ ] Filtrar agendamentos por data (200)
- [ ] Filtrar agendamentos por barbeiro (200)
- [ ] Buscar agendamento por ID (200)
- [ ] Cancelar agendamento (200)
- [ ] Completar agendamento como admin (200)
- [ ] Erro: cliente inválido (404)
- [ ] Erro: barbeiro inválido (404)
- [ ] Erro: serviço inválido (400)
- [ ] Erro: data inválida (400)
- [ ] Erro: horário fora do expediente (400)
- [ ] Erro: conflito de horário (409)
- [ ] Erro: sem autenticação (401)

---

**Última atualização**: 18/02/2026
