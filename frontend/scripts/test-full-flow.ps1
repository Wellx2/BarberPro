# Test Appointments - 3 Scenarios
# Credentials from seed.ts
# Real IDs from database

$baseUrl = "http://localhost:3000"
$results = @()

# Real IDs
$barberID = "3ab0bc24-582d-432f-b809-483364a93d82"
$serviceID = "531f6c72-cdb0-4d61-8eaa-abe07ca76545"
$clientID = "c903c646-31b9-44b3-a339-79e01d18bf54"

Write-Host ""
Write-Host "TEST AGENDAMENTOS - 3 CENARIOS" -ForegroundColor Cyan
Write-Host "Using: Barber=$barberID Service=$serviceID Client=$clientID" -ForegroundColor Gray
Write-Host ""

# Test Case 1: CLIENT
Write-Host ">>> TESTE 1: Cliente agendando para si mesmo" -ForegroundColor Green
$email = "roberto@email.com"
$password = "senha123"

$loginBody = @{email=$email; password=$password} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $login.accessToken
    Write-Host "[OK] Login bem-sucedido - User ID: $($login.user.id)" -ForegroundColor Green
    
    # Create appointment (CLIENT: barberId obrigatorio, clientId omitido)
    $apptBody = @{
        barberId = $barberID
        serviceIds = @($serviceID)
        date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddT14:00:00Z")
        notes = "Test CLIENT"
    } | ConvertTo-Json
    
    Write-Host "Payload: $apptBody" -ForegroundColor DarkGray
    
    $appt = Invoke-RestMethod -Uri "$baseUrl/api/appointments" -Method Post -ContentType "application/json" -Body $apptBody -Headers @{Authorization="Bearer $token"}
    Write-Host "[OK] Agendamento criado - ID: $($appt.id)" -ForegroundColor Green
    $results += "CLIENTE: OK"
} catch {
    Write-Host "[ERRO] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Detail: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
    $results += "CLIENTE: ERRO"
}

# Test Case 2: BARBER
Write-Host ""
Write-Host ">>> TESTE 2: Barbeiro agendando para cliente" -ForegroundColor Green
$email = "joao@barberpro.com"
$password = "senha123"

$loginBody = @{email=$email; password=$password} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $login.accessToken
    Write-Host "[OK] Login bem-sucedido - User ID: $($login.user.id)" -ForegroundColor Green
    
    # Create appointment with clientId
    $apptBody = @{
        serviceIds = @($serviceID)
        date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddT14:00:00Z")
        clientId = $clientID
        notes = "Test BARBER"
    } | ConvertTo-Json
    
    Write-Host "Payload: $apptBody" -ForegroundColor DarkGray
    
    $appt = Invoke-RestMethod -Uri "$baseUrl/api/appointments" -Method Post -ContentType "application/json" -Body $apptBody -Headers @{Authorization="Bearer $token"}
    Write-Host "[OK] Agendamento criado - ID: $($appt.id)" -ForegroundColor Green
    $results += "BARBEIRO: OK"
} catch {
    Write-Host "[ERRO] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Detail: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
    $results += "BARBEIRO: ERRO"
}

# Test Case 3: ADMIN
Write-Host ""
Write-Host ">>> TESTE 3: Admin agendando para cliente" -ForegroundColor Green
$email = "admin@barberpro.com"
$password = "senha123"

$loginBody = @{email=$email; password=$password} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $login.accessToken
    Write-Host "[OK] Login bem-sucedido - User ID: $($login.user.id)" -ForegroundColor Green
    
    # Create appointment with clientId (ADMIN: ambos obrigatorios)
    $apptBody = @{
        barberId = $barberID
        clientId = $clientID
        serviceIds = @($serviceID)
        date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddT14:00:00Z")
        notes = "Test ADMIN"
    } | ConvertTo-Json
    
    Write-Host "Payload: $apptBody" -ForegroundColor DarkGray
    
    $appt = Invoke-RestMethod -Uri "$baseUrl/api/appointments" -Method Post -ContentType "application/json" -Body $apptBody -Headers @{Authorization="Bearer $token"}
    Write-Host "[OK] Agendamento criado - ID: $($appt.id)" -ForegroundColor Green
    $results += "ADMIN: OK"
} catch {
    Write-Host "[ERRO] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Detail: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
    $results += "ADMIN: ERRO"
}

Write-Host ""
Write-Host "RESULTADO FINAL:" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
Write-Host ""
