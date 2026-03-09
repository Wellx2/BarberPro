#!/usr/bin/env pwsh

# 🧪 Teste de Segurança JWT - Agendamentos com Vínculo de Identidade

$baseUrl = "http://localhost:3000/api"
$results = @()

# Cores para output
function Write-Success {
    Write-Host "✅ $args" -ForegroundColor Green
}

function Write-ErrorMsg {
    Write-Host "❌ $args" -ForegroundColor Red
}

function Write-Info {
    Write-Host "ℹ️  $args" -ForegroundColor Cyan
}

Write-Host "`n🔒 TESTE DE SEGURANÇA JWT - AGENDAMENTOS`n" -ForegroundColor Magenta
Write-Host "Validando vínculo de identidade por JWT (User -> Client/Barber)`n"

# ============================================================================
# TESTE 1: CLIENT AGENDANDO PARA SI MESMO (sem clientId)
# ============================================================================

Write-Host "📋 TESTE 1: CLIENT agendando para si mesmo" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

try {
    # 1a. Login CLIENT
    Write-Info "1a. Login com Roberto (CLIENT)..."
    $loginPayload = @{
        email = "roberto@email.com"
        password = "senha123"
    } | ConvertTo-Json

    $loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -SkipHttpErrorCheck

    if ($loginResp.StatusCode -ne 200) {
        Write-ErrorMsg "Login falhou: $($loginResp.StatusCode)"
        exit 1
    }

    $loginData = $loginResp.Content | ConvertFrom-Json
    $clientAccessToken = $loginData.accessToken
    $clientUserId = $loginData.user.id

    Write-Success "Login OK - User ID: $clientUserId"

    # 1b. Agendamento SEM clientId
    Write-Info "1b. Criando agendamento SEM clientId (backend usa JWT.sub)..."
    
    $appointmentPayload = @{
        serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e") # Barba Completa
        date = (Get-Date -Date "2026-02-25T17:00:00.000Z" -AsUTC).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        notes = "Teste CLIENT"
    } | ConvertTo-Json

    $appointmentResp = Invoke-WebRequest -Uri "$baseUrl/appointments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $appointmentPayload `
        -Headers @{ Authorization = "Bearer $clientAccessToken" } `
        -SkipHttpErrorCheck

    if ($appointmentResp.StatusCode -eq 201) {
        $appointmentData = $appointmentResp.Content | ConvertFrom-Json
        Write-Success "Agendamento criado com sucesso!"
        Write-Success "Appointment ID: $($appointmentData.id)"
        $results += "✅ TESTE 1: CLIENT agendamento sem clientId"
    } else {
        $errorMsg = $appointmentResp.Content | ConvertFrom-Json
        Write-ErrorMsg "Falha ao criar agendamento: $($appointmentResp.StatusCode)"
        Write-ErrorMsg "Mensagem: $($errorMsg.message)"
        $results += "❌ TESTE 1: CLIENT agendamento falhou"
    }
} catch {
    Write-ErrorMsg "Erro em TESTE 1: $_"
    $results += "❌ TESTE 1: Exceção"
}

Write-Host "`n"

# ============================================================================
# TESTE 2: BARBER AGENDANDO PARA CLIENTE (com clientId, validado por vínculo)
# ============================================================================

Write-Host "📋 TESTE 2: BARBER agendando para cliente" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

try {
    # 2a. Login BARBER
    Write-Info "2a. Login com João (BARBER)..."
    $loginPayload = @{
        email = "joao@barberpro.com"
        password = "senha123"
    } | ConvertTo-Json

    $loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -SkipHttpErrorCheck

    if ($loginResp.StatusCode -ne 200) {
        Write-ErrorMsg "Login falhou: $($loginResp.StatusCode)"
        $errorMsg = $loginResp.Content | ConvertFrom-Json
        Write-ErrorMsg "Mensagem: $($errorMsg.message)"
        $results += "❌ TESTE 2: BARBER login falhou"
    } else {
        $loginData = $loginResp.Content | ConvertFrom-Json
        $barberAccessToken = $loginData.accessToken
        $barberUserId = $loginData.user.id

        Write-Success "Login OK - User ID: $barberUserId"

        # 2b. Agendamento COM clientId
        Write-Info "2b. Criando agendamento COM clientId para cliente..."
        
        $appointmentPayload = @{
            clientId = "58b9fec5-047c-4285-8408-9f895401b8c8" # André Oliveira
            serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
            date = (Get-Date -Date "2026-02-25T18:00:00.000Z" -AsUTC).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        } | ConvertTo-Json

        $appointmentResp = Invoke-WebRequest -Uri "$baseUrl/appointments" `
            -Method POST `
            -ContentType "application/json" `
            -Body $appointmentPayload `
            -Headers @{ Authorization = "Bearer $barberAccessToken" } `
            -SkipHttpErrorCheck

        if ($appointmentResp.StatusCode -eq 201) {
            $appointmentData = $appointmentResp.Content | ConvertFrom-Json
            Write-Success "Agendamento criado com sucesso!"
            Write-Success "Appointment ID: $($appointmentData.id)"
            $results += "✅ TESTE 2: BARBER agendamento com clientId"
        } else {
            $errorMsg = $appointmentResp.Content | ConvertFrom-Json
            Write-ErrorMsg "Falha ao criar agendamento: $($appointmentResp.StatusCode)"
            Write-ErrorMsg "Mensagem: $($errorMsg.message)"
            $results += "❌ TESTE 2: BARBER agendamento falhou"
        }
    }
} catch {
    Write-ErrorMsg "Erro em TESTE 2: $_"
    $results += "❌ TESTE 2: Exceção"
}

Write-Host "`n"

# ============================================================================
# TESTE 3: ADMIN AGENDANDO (clientId + barberId obrigatórios)
# ============================================================================

Write-Host "📋 TESTE 3: ADMIN agendando com clientId e barberId" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

try {
    # 3a. Login ADMIN
    Write-Info "3a. Login com Admin (ADMIN)..."
    $loginPayload = @{
        email = "admin@barberpro.com"
        password = "senha123"
    } | ConvertTo-Json

    $loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -SkipHttpErrorCheck

    if ($loginResp.StatusCode -ne 200) {
        Write-ErrorMsg "Login falhou: $($loginResp.StatusCode)"
        $results += "❌ TESTE 3: ADMIN login falhou"
    } else {
        $loginData = $loginResp.Content | ConvertFrom-Json
        $adminAccessToken = $loginData.accessToken
        $adminUserId = $loginData.user.id

        Write-Success "Login OK - User ID: $adminUserId"

        # 3b. Agendamento COM clientId + barberId
        Write-Info "3b. Criando agendamento COM clientId e barberId..."
        
        $appointmentPayload = @{
            clientId = "58b9fec5-047c-4285-8408-9f895401b8c8" # André Oliveira
            barberId = "55d9452e-b68e-4b14-915a-cab888518e0b" # Carla Silva
            serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
            date = (Get-Date -Date "2026-02-25T19:00:00.000Z" -AsUTC).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        } | ConvertTo-Json

        $appointmentResp = Invoke-WebRequest -Uri "$baseUrl/appointments" `
            -Method POST `
            -ContentType "application/json" `
            -Body $appointmentPayload `
            -Headers @{ Authorization = "Bearer $adminAccessToken" } `
            -SkipHttpErrorCheck

        if ($appointmentResp.StatusCode -eq 201) {
            $appointmentData = $appointmentResp.Content | ConvertFrom-Json
            Write-Success "Agendamento criado com sucesso!"
            Write-Success "Appointment ID: $($appointmentData.id)"
            $results += "✅ TESTE 3: ADMIN agendamento com clientId + barberId"
        } else {
            $errorMsg = $appointmentResp.Content | ConvertFrom-Json
            Write-ErrorMsg "Falha ao criar agendamento: $($appointmentResp.StatusCode)"
            Write-ErrorMsg "Mensagem: $($errorMsg.message)"
            $results += "❌ TESTE 3: ADMIN agendamento falhou"
        }
    }
} catch {
    Write-ErrorMsg "Erro em TESTE 3: $_"
    $results += "❌ TESTE 3: Exceção"
}

Write-Host "`n"

# ============================================================================
# RESUMO
# ============================================================================

Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

foreach ($result in $results) {
    Write-Host $result
}

$passCount = ($results | Where-Object { $_ -match "✅" }).Count
$failCount = ($results | Where-Object { $_ -match "❌" }).Count

Write-Host ""
Write-Host "Resultado: $passCount/3 testes passaram" -ForegroundColor $(if ($passCount -eq 3) { 'Green' } else { 'Yellow' })

if ($failCount -gt 0) {
    Write-ErrorMsg "$failCount teste(s) falharam!"
    Write-Info "Verifique os logs acima para detalhes"
}
