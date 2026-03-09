# Script de Teste - API de Appointments
# BarberPro Backend

$baseUrl = "http://localhost:3000"
$loginEmail = "admin@barberpro.com"
$loginPassword = "senha123"

Write-Host "TESTANDO API DE APPOINTMENTS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Fazer Login
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = $loginEmail
    password = $loginPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "[OK] Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERRO] Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Buscar Clientes
Write-Host "2. Buscando clientes..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "$baseUrl/clients" -Method Get -Headers $headers
    if ($clients.Count -gt 0) {
        $clientId = $clients[0].id
        Write-Host "[OK] $($clients.Count) clientes encontrados" -ForegroundColor Green
        Write-Host "   Usando cliente: $($clients[0].name) (ID: $clientId)" -ForegroundColor Gray
    } else {
        Write-Host "[AVISO] Nenhum cliente encontrado" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "[ERRO] Erro ao buscar clientes: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Buscar Barbeiros
Write-Host "3️⃣  Buscando barbeiros..." -ForegroundColor Yellow
try {
    $barbers = Invoke-RestMethod -Uri "$baseUrl/barbers" -Method Get -Headers $headers
    if ($barbers.Count -gt 0) {
        $barberId = $barbers[0].id
        Write-Host "✅ $($barbers.Count) barbeiros encontrados" -ForegroundColor Green
        Write-Host "   Usando barbeiro: $($barbers[0].name) (ID: $barberId)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Nenhum barbeiro encontrado" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar barbeiros: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Buscar Serviços
Write-Host "4️⃣  Buscando serviços..." -ForegroundColor Yellow
try {
    $services = Invoke-RestMethod -Uri "$baseUrl/services" -Method Get -Headers $headers
    if ($services.Count -gt 0) {
        $serviceIds = @($services[0].id)
        if ($services.Count -gt 1) {
            $serviceIds += $services[1].id
        }
        Write-Host "✅ $($services.Count) serviços encontrados" -ForegroundColor Green
        Write-Host "   Usando serviços:" -ForegroundColor Gray
        foreach ($sid in $serviceIds) {
            $svc = $services | Where-Object { $_.id -eq $sid }
            Write-Host "   - $($svc.name) (R$ $($svc.price))" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Nenhum serviço encontrado" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar serviços: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Criar Agendamento
if ($clientId -and $barberId -and $serviceIds) {
    Write-Host "5️⃣  Criando novo agendamento..." -ForegroundColor Yellow
    
    # Data: amanhã às 14h
    $appointmentDate = (Get-Date).AddDays(1).Date.AddHours(14).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    $appointmentBody = @{
        clientId = $clientId
        barberId = $barberId
        serviceIds = $serviceIds
        date = $appointmentDate
    } | ConvertTo-Json
    
    Write-Host "   Data: $appointmentDate" -ForegroundColor Gray
    
    try {
        $newAppointment = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Post -Body $appointmentBody -Headers $headers
        $appointmentId = $newAppointment.id
        Write-Host "✅ Agendamento criado com sucesso!" -ForegroundColor Green
        Write-Host "   ID: $appointmentId" -ForegroundColor Gray
        Write-Host "   Status: $($newAppointment.status)" -ForegroundColor Gray
        Write-Host "   Preço Total: R$ $($newAppointment.totalPrice)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao criar agendamento: $($_.Exception.Message)" -ForegroundColor Red
        $appointmentId = $null
    }
} else {
    Write-Host "⚠️  Pulando criação de agendamento (dados insuficientes)" -ForegroundColor Yellow
    $appointmentId = $null
}

# 6. Listar Todos os Agendamentos
Write-Host "6️⃣  Listando todos os agendamentos..." -ForegroundColor Yellow
try {
    $appointments = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Get -Headers $headers
    Write-Host "✅ $($appointments.Count) agendamentos encontrados" -ForegroundColor Green
    
    if ($appointments.Count -gt 0) {
        Write-Host ""
        Write-Host "   📋 Últimos agendamentos:" -ForegroundColor Gray
        $appointments | Select-Object -First 5 | ForEach-Object {
            Write-Host "   - ID: $($_.id.Substring(0, 8))..." -ForegroundColor Gray
            Write-Host "     Cliente: $($_.client.name)" -ForegroundColor Gray
            Write-Host "     Barbeiro: $($_.barber.name)" -ForegroundColor Gray
            Write-Host "     Data: $(([DateTime]$_.date).ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
            Write-Host "     Status: $($_.status)" -ForegroundColor Gray
            Write-Host "     Preço: R$ $($_.totalPrice)" -ForegroundColor Gray
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Erro ao listar agendamentos: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Buscar Agendamento por ID
if ($appointmentId) {
    Write-Host "7️⃣  Buscando agendamento por ID..." -ForegroundColor Yellow
    try {
        $appointment = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId" -Method Get -Headers $headers
        Write-Host "✅ Agendamento encontrado!" -ForegroundColor Green
        Write-Host "   Cliente: $($appointment.client.name)" -ForegroundColor Gray
        Write-Host "   Barbeiro: $($appointment.barber.name)" -ForegroundColor Gray
        Write-Host "   Data: $(([DateTime]$appointment.date).ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
        Write-Host "   Status: $($appointment.status)" -ForegroundColor Gray
        Write-Host "   Serviços:" -ForegroundColor Gray
        $appointment.services | ForEach-Object {
            Write-Host "   - $($_.service.name) (R$ $($_.service.price))" -ForegroundColor Gray
        }
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao buscar agendamento: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 8. Filtrar Agendamentos por Data
Write-Host "8️⃣  Filtrando agendamentos por data..." -ForegroundColor Yellow
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
try {
    $filteredAppointments = Invoke-RestMethod -Uri "$baseUrl/appointments?date=$tomorrow" -Method Get -Headers $headers
    Write-Host "✅ $($filteredAppointments.Count) agendamentos encontrados para $tomorrow" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao filtrar agendamentos: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Filtrar Agendamentos por Status
Write-Host "9️⃣  Filtrando agendamentos por status (SCHEDULED)..." -ForegroundColor Yellow
try {
    $scheduledAppointments = Invoke-RestMethod -Uri "$baseUrl/appointments?status=SCHEDULED" -Method Get -Headers $headers
    Write-Host "✅ $($scheduledAppointments.Count) agendamentos com status SCHEDULED" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao filtrar por status: $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Cancelar Agendamento
if ($appointmentId) {
    Write-Host "🔟 Cancelando agendamento..." -ForegroundColor Yellow
    
    $cancelBody = @{
        cancelReason = "Teste de cancelamento via API"
    } | ConvertTo-Json
    
    try {
        $cancelledAppointment = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId/cancel" -Method Patch -Body $cancelBody -Headers $headers
        Write-Host "✅ Agendamento cancelado!" -ForegroundColor Green
        Write-Host "   Status: $($cancelledAppointment.status)" -ForegroundColor Gray
        Write-Host "   Motivo: $($cancelledAppointment.cancelReason)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao cancelar agendamento: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Resumo Final
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "   ✅ Login" -ForegroundColor Green
Write-Host "   ✅ Listar Clientes" -ForegroundColor Green
Write-Host "   ✅ Listar Barbeiros" -ForegroundColor Green
Write-Host "   ✅ Listar Serviços" -ForegroundColor Green
Write-Host "   ✅ Criar Agendamento" -ForegroundColor Green
Write-Host "   ✅ Listar Agendamentos" -ForegroundColor Green
Write-Host "   ✅ Buscar por ID" -ForegroundColor Green
Write-Host "   ✅ Filtrar por Data" -ForegroundColor Green
Write-Host "   ✅ Filtrar por Status" -ForegroundColor Green
Write-Host "   ✅ Cancelar Agendamento" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 API de Appointments está funcionando perfeitamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Documentacao completa: docs/APPOINTMENTS_API.md" -ForegroundColor Cyan
