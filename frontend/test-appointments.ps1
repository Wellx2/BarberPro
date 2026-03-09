# Teste de agendamentos - 3 cenarios (CLIENT, BARBER, ADMIN)
$BASE_URL = "http://localhost:3000/api"

# IDs reais do banco
$CLIENT_ID = "b7bf0f37-01db-4fd9-9bc7-4afdcf9c491f"
$BARBER_ID = "e82b9c39-a4b4-49af-b537-0f0d5704cd35"
$SERVICE_ID = "556c5374-2a70-48b2-9a42-98c7a4371777"

# Data futura
$appointmentDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddT17:00:00.000Z")

Write-Host "TESTE DE AGENDAMENTO - 3 CENARIOS"
Write-Host "IDs: $CLIENT_ID | $BARBER_ID | $SERVICE_ID"
Write-Host "Data: $appointmentDate"
Write-Host ""

function Test-Appointment {
    param([string]$Role, [string]$Email, [string]$Password, [bool]$SendClientId)
    
    Write-Host "--- $Role ---"
    
    # Login
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    try {
        $loginResp = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST `
            -ContentType "application/json" -Body $loginBody -ErrorAction Stop
        $token = ($loginResp.Content | ConvertFrom-Json).accessToken
        Write-Host "Login OK - Token: $($token.Substring(0,20))..."
    } catch {
        Write-Host "Login ERRO: $($_.Exception.Message)"
        return
    }
    
    # Agendamento
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $appointmentBody = @{
        barberId = $BARBER_ID
        serviceIds = @($SERVICE_ID)
        date = $appointmentDate
        notes = "Teste $Role"
    }
    
    if ($SendClientId) {
        $appointmentBody.Add("clientId", $CLIENT_ID)
    }
    
    try {
        $appointmentResp = Invoke-WebRequest -Uri "$BASE_URL/appointments" -Method POST `
            -Headers $headers -Body ($appointmentBody | ConvertTo-Json) -ErrorAction Stop
        $id = ($appointmentResp.Content | ConvertFrom-Json).id
        Write-Host "Agendamento OK - ID: $id"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "Agendamento ERRO: HTTP $status - $($_.Exception.Message)"
    }
    
    Write-Host ""
}

# Testar 3 cenarios
Test-Appointment "CLIENT" "cliente@test.com" "senha123" $false
Test-Appointment "BARBER" "barber@test.com" "senha123" $true
Test-Appointment "ADMIN" "admin@test.com" "senha123" $true

Write-Host "TESTES CONCLUIDOS"
