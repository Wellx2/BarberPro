# Script de Teste - API de Appointments
# BarberPro Backend

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000/api"

Write-Host "`nTESTANDO API DE APPOINTMENTS`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginBody = @{ email = "admin@barberpro.com"; password = "senha123" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.accessToken
Write-Host "[OK] Login realizado`n" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Buscar Clientes
Write-Host "2. Buscando clientes..." -ForegroundColor Yellow
$clients = Invoke-RestMethod -Uri "$baseUrl/clients" -Headers $headers
$clientId = $clients[0].id
Write-Host "[OK] $($clients.Count) clientes encontrados" -ForegroundColor Green
Write-Host "   Cliente: $($clients[0].name)`n" -ForegroundColor Gray

# 3. Buscar Barbeiros
Write-Host "3. Buscando barbeiros..." -ForegroundColor Yellow
$barbers = Invoke-RestMethod -Uri "$baseUrl/barbers" -Headers $headers
$barberId = $barbers[0].id
Write-Host "[OK] $($barbers.Count) barbeiros encontrados" -ForegroundColor Green
Write-Host "   Barbeiro: $($barbers[0].name)`n" -ForegroundColor Gray

# 4. Buscar Servicos
Write-Host "4. Buscando servicos..." -ForegroundColor Yellow
$services = Invoke-RestMethod -Uri "$baseUrl/services" -Headers $headers
$serviceIds = @($services[0].id, $services[1].id)
Write-Host "[OK] $($services.Count) servicos encontrados" -ForegroundColor Green
Write-Host "   Servico 1: $($services[0].name) - R$ $($services[0].price)" -ForegroundColor Gray
Write-Host "   Servico 2: $($services[1].name) - R$ $($services[1].price)`n" -ForegroundColor Gray

# 5. Criar Agendamento
Write-Host "5. Criando agendamento..." -ForegroundColor Yellow
$appointmentDate = (Get-Date).AddDays(1).Date.AddHours(14).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$appointmentBody = @{
    clientId = $clientId
    barberId = $barberId
    serviceIds = $serviceIds
    date = $appointmentDate
} | ConvertTo-Json

$newAppointment = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Post -Body $appointmentBody -Headers $headers
$appointmentId = $newAppointment.id
Write-Host "[OK] Agendamento criado!" -ForegroundColor Green
Write-Host "   ID: $appointmentId" -ForegroundColor Gray
Write-Host "   Status: $($newAppointment.status)" -ForegroundColor Gray
Write-Host "   Preco: R$ $($newAppointment.totalPrice)`n" -ForegroundColor Gray

# 6. Listar Agendamentos
Write-Host "6. Listando agendamentos..." -ForegroundColor Yellow
$appointments = Invoke-RestMethod -Uri "$baseUrl/appointments" -Headers $headers
Write-Host "[OK] $($appointments.Count) agendamentos encontrados`n" -ForegroundColor Green

# 7. Buscar por ID
Write-Host "7. Buscando agendamento por ID..." -ForegroundColor Yellow
$appointment = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId" -Headers $headers
Write-Host "[OK] Agendamento encontrado!" -ForegroundColor Green
Write-Host "   Cliente: $($appointment.client.name)" -ForegroundColor Gray
Write-Host "   Barbeiro: $($appointment.barber.name)" -ForegroundColor Gray
Write-Host "   Servicos: $($appointment.services.Count)`n" -ForegroundColor Gray

# 8. Filtrar por Data
Write-Host "8. Filtrando por data..." -ForegroundColor Yellow
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$filtered = Invoke-RestMethod -Uri "$baseUrl/appointments?date=$tomorrow" -Headers $headers
Write-Host "[OK] $($filtered.Count) agendamentos para $tomorrow`n" -ForegroundColor Green

# 9. Filtrar por Status
Write-Host "9. Filtrando por status (SCHEDULED)..." -ForegroundColor Yellow
$scheduled = Invoke-RestMethod -Uri "$baseUrl/appointments?status=SCHEDULED" -Headers $headers
Write-Host "[OK] $($scheduled.Count) agendamentos SCHEDULED`n" -ForegroundColor Green

# 10. Cancelar Agendamento
Write-Host "10. Cancelando agendamento..." -ForegroundColor Yellow
$cancelBody = @{ cancelReason = "Teste de cancelamento via API" } | ConvertTo-Json
$cancelled = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId/cancel" -Method Patch -Body $cancelBody -Headers $headers
Write-Host "[OK] Agendamento cancelado!" -ForegroundColor Green
Write-Host "   Status: $($cancelled.status)" -ForegroundColor Gray
Write-Host "   Motivo: $($cancelled.cancelReason)`n" -ForegroundColor Gray

# Resumo
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "  [OK] Login" -ForegroundColor Green
Write-Host "  [OK] Listar Clientes" -ForegroundColor Green
Write-Host "  [OK] Listar Barbeiros" -ForegroundColor Green
Write-Host "  [OK] Listar Servicos" -ForegroundColor Green
Write-Host "  [OK] Criar Agendamento" -ForegroundColor Green
Write-Host "  [OK] Listar Agendamentos" -ForegroundColor Green
Write-Host "  [OK] Buscar por ID" -ForegroundColor Green
Write-Host "  [OK] Filtrar por Data" -ForegroundColor Green
Write-Host "  [OK] Filtrar por Status" -ForegroundColor Green
Write-Host "  [OK] Cancelar Agendamento" -ForegroundColor Green
Write-Host "`nAPI de Appointments funcionando perfeitamente!" -ForegroundColor Green
Write-Host "Documentacao: docs/APPOINTMENTS_API.md`n" -ForegroundColor Cyan
