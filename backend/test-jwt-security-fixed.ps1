param()

$baseUrl = "http://localhost:3000/api"
$results = @()

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "TESTE DE SEGURANÇA JWT - AGENDAMENTOS" -ForegroundColor Magenta  
Write-Host "========================================`n" -ForegroundColor Magenta

# TEST 1: CLIENT
Write-Host "TEST 1: CLIENT agendando para si mesmo" -ForegroundColor Yellow

$login1 = @{
    email = "roberto@email.com"
    password = "senha123"
} | ConvertTo-Json

$resp1 = try {
    Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $login1 -ErrorAction Stop
} catch {
    $_.Response
}

if ($resp1.StatusCode -eq 200) {
    $loginData = $resp1.Content | ConvertFrom-Json
    $token1 = $loginData.accessToken
    Write-Host "[OK] CLIENT login" -ForegroundColor Green
    
    $appt1 = @{
        serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
        date = "2026-02-25T17:00:00.000Z"
        notes = "CLIENT test"
    } | ConvertTo-Json
    
    $respAppt1 = try {
        Invoke-WebRequest -Uri "$baseUrl/appointments" -Method POST -ContentType "application/json" -Body $appt1 -Headers @{ Authorization = "Bearer $token1" } -ErrorAction Stop
    } catch {
        $_.Response
    }
    
    if ($respAppt1.StatusCode -eq 201) {
        Write-Host "[OK] CLIENT appointment created" -ForegroundColor Green
        $results += "✅ TEST 1: CLIENT"
    } else {
        Write-Host "[FAIL] CLIENT appointment: $($respAppt1.StatusCode)" -ForegroundColor Red
        $results += "❌ TEST 1: CLIENT"
    }
} else {
    Write-Host "[FAIL] CLIENT login: $($resp1.StatusCode)" -ForegroundColor Red
    $results += "❌ TEST 1: CLIENT"
}

# TEST 2: BARBER
Write-Host "`nTEST 2: BARBER agendando para cliente" -ForegroundColor Yellow

$login2 = @{
    email = "joao@barberpro.com"
    password = "senha123"
} | ConvertTo-Json

$resp2 = try {
    Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $login2 -ErrorAction Stop
} catch {
    $_.Response
}

if ($resp2.StatusCode -eq 200) {
    $loginData = $resp2.Content | ConvertFrom-Json
    $token2 = $loginData.accessToken
    Write-Host "[OK] BARBER login" -ForegroundColor Green
    
    $appt2 = @{
        clientId = "58b9fec5-047c-4285-8408-9f895401b8c8"
        serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
        date = "2026-02-25T18:00:00.000Z"
    } | ConvertTo-Json
    
    $respAppt2 = try {
        Invoke-WebRequest -Uri "$baseUrl/appointments" -Method POST -ContentType "application/json" -Body $appt2 -Headers @{ Authorization = "Bearer $token2" } -ErrorAction Stop
    } catch {
        $_.Response
    }
    
    if ($respAppt2.StatusCode -eq 201) {
        Write-Host "[OK] BARBER appointment created" -ForegroundColor Green
        $results += "✅ TEST 2: BARBER"
    } else {
        $errorData = $respAppt2.Content | ConvertFrom-Json
        Write-Host "[FAIL] BARBER appointment: $($respAppt2.StatusCode) - $($errorData.message)" -ForegroundColor Red
        $results += "❌ TEST 2: BARBER"
    }
} else {
    Write-Host "[FAIL] BARBER login: $($resp2.StatusCode)" -ForegroundColor Red
    $results += "❌ TEST 2: BARBER"
}

# TEST 3: ADMIN
Write-Host "`nTEST 3: ADMIN agendando com clientId + barberId" -ForegroundColor Yellow

$login3 = @{
    email = "admin@barberpro.com"
    password = "senha123"
} | ConvertTo-Json

$resp3 = try {
    Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $login3 -ErrorAction Stop
} catch {
    $_.Response
}

if ($resp3.StatusCode -eq 200) {
    $loginData = $resp3.Content | ConvertFrom-Json
    $token3 = $loginData.accessToken
    Write-Host "[OK] ADMIN login" -ForegroundColor Green
    
    $appt3 = @{
        clientId = "58b9fec5-047c-4285-8408-9f895401b8c8"
        barberId = "55d9452e-b68e-4b14-915a-cab888518e0b"
        serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
        date = "2026-02-25T19:00:00.000Z"
    } | ConvertTo-Json
    
    $respAppt3 = try {
        Invoke-WebRequest -Uri "$baseUrl/appointments" -Method POST -ContentType "application/json" -Body $appt3 -Headers @{ Authorization = "Bearer $token3" } -ErrorAction Stop
    } catch {
        $_.Response
    }
    
    if ($respAppt3.StatusCode -eq 201) {
        Write-Host "[OK] ADMIN appointment created" -ForegroundColor Green
        $results += "✅ TEST 3: ADMIN"
    } else {
        Write-Host "[FAIL] ADMIN appointment: $($respAppt3.StatusCode)" -ForegroundColor Red
        $results += "❌ TEST 3: ADMIN"
    }
} else {
    Write-Host "[FAIL] ADMIN login: $($resp3.StatusCode)" -ForegroundColor Red
    $results += "❌ TEST 3: ADMIN"
}

# SUMMARY
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "RESUMO" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

foreach ($result in $results) {
    Write-Host $result
}

$pass = ($results | Where-Object { $_ -match "✅" }).Count
$fail = ($results | Where-Object { $_ -match "❌" }).Count

Write-Host "`nResultado: $pass/3 testes passaram`n" -ForegroundColor $(if ($pass -eq 3) { 'Green' } else { 'Yellow' })
