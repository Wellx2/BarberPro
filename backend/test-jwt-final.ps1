$baseUrl = "http://localhost:3000/api"
$results = @()

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "TESTE DE SEGURANCA JWT - AGENDAMENTOS" -ForegroundColor Magenta  
Write-Host "========================================`n" -ForegroundColor Magenta

function Invoke-APIRequest {
    param($Uri, $Method, $Body, $Token)
    
    Write-Host "DEBUG: Calling $Method $Uri" -ForegroundColor DarkGray
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $response = Invoke-WebRequest -Uri $Uri -Method $Method -Body $Body -Headers $headers -UseBasicParsing -ErrorAction Stop -TimeoutSec 30
        Write-Host "DEBUG: Status $($response.StatusCode), Content length: $($response.Content.Length)" -ForegroundColor DarkGray
        return @{ StatusCode = $response.StatusCode; Content = $response.Content }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "DEBUG: Error Status $statusCode" -ForegroundColor DarkGray
            
            if ($_.Exception.Response.StatusCode -eq 'Forbidden' -or $_.Exception.Response.StatusCode -eq 'BadRequest' -or $_.Exception.Response.StatusCode -eq 'NotFound') {
                try {
                    $content = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($content)
                    $responseBody = $reader.ReadToEnd()
                    $reader.Close()
                    $content.Dispose()
                    Write-Host "DEBUG: Response body length: $($responseBody.Length)" -ForegroundColor DarkGray
                    return @{ StatusCode = $statusCode; Content = $responseBody }
                } catch {
                    return @{ StatusCode = $statusCode; Content = "" }
                }
            }
            return @{ StatusCode = $statusCode; Content = "" }
        } else {
            Write-Host "DEBUG: Exception - $($_.Exception.GetType().Name): $($_.Exception.Message)" -ForegroundColor DarkGray
            return @{ StatusCode = 0; Content = $_.Exception.Message }
        }
    }
}

# TEST 1: CLIENT
Write-Host "TEST 1: CLIENT agendando para si mesmo" -ForegroundColor Yellow

$login1 = @{ email = "roberto@email.com"; password = "senha123" } | ConvertTo-Json -Compress
$resp1 = Invoke-APIRequest -Uri "$baseUrl/auth/login" -Method POST -Body $login1

if ($resp1.StatusCode -eq 200) {
    $loginData = $resp1.Content | ConvertFrom-Json
    $token1 = $loginData.accessToken
    Write-Host "[OK] CLIENT login ($($resp1.StatusCode))" -ForegroundColor Green
    
    $appt1 = @{
        barberId = "acc34c94-2161-4613-ba0e-9458e95c1ee2"  # João Barbeiro
        serviceIds = @("531f6c72-cdb0-4d61-8eaa-abe07ca76545")  # Barba Completa
        date = "2026-02-25T14:00:00.000Z"
        notes = "CLIENT test"
    } | ConvertTo-Json -Compress
    
    Write-Host "DEBUG: Appointment payload: $appt1" -ForegroundColor DarkGray
    $respAppt1 = Invoke-APIRequest -Uri "$baseUrl/appointments" -Method POST -Body $appt1 -Token $token1
    
    if ($respAppt1.StatusCode -eq 201) {
        Write-Host "[OK] CLIENT appointment created ($($respAppt1.StatusCode))" -ForegroundColor Green
        $results += "✅ TEST 1: CLIENT"
    } else {
        $body = if ($respAppt1.Content) { 
            try { $respAppt1.Content | ConvertFrom-Json | ConvertTo-Json -Compress }
            catch { $respAppt1.Content }
        } else { "NO CONTENT" }
        Write-Host "[FAIL] CLIENT appointment: $($respAppt1.StatusCode) - $body" -ForegroundColor Red
        $results += "❌ TEST 1: CLIENT"
    }
} else {
    Write-Host "[FAIL] CLIENT login: $($resp1.StatusCode)" -ForegroundColor Red
    Write-Host "Response: $($resp1.Content)" -ForegroundColor DarkRed
    $results += "❌ TEST 1: CLIENT"
}

# TEST 2: BARBER
Write-Host "`nTEST 2: BARBER agendando para cliente" -ForegroundColor Yellow

$login2 = @{ email = "joao@barberpro.com"; password = "senha123" } | ConvertTo-Json -Compress
$resp2 = Invoke-APIRequest -Uri "$baseUrl/auth/login" -Method POST -Body $login2

if ($resp2.StatusCode -eq 200) {
    $loginData = $resp2.Content | ConvertFrom-Json
    $token2 = $loginData.accessToken
    Write-Host "[OK] BARBER login ($($resp2.StatusCode))" -ForegroundColor Green
    
    $appt2 = @{
        clientId = "7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5"  # Roberto Santos
        serviceIds = @("531f6c72-cdb0-4d61-8eaa-abe07ca76545")  # Barba Completa
        date = "2026-02-25T18:00:00.000Z"
    } | ConvertTo-Json -Compress
    
    Write-Host "DEBUG: Appointment payload: $appt2" -ForegroundColor DarkGray
    $respAppt2 = Invoke-APIRequest -Uri "$baseUrl/appointments" -Method POST -Body $appt2 -Token $token2
    
    if ($respAppt2.StatusCode -eq 201) {
        Write-Host "[OK] BARBER appointment created ($($respAppt2.StatusCode))" -ForegroundColor Green
        $results += "✅ TEST 2: BARBER"
    } else {
        $body = if ($respAppt2.Content) { 
            try { $respAppt2.Content | ConvertFrom-Json | ConvertTo-Json -Compress }
            catch { $respAppt2.Content }
        } else { "NO CONTENT" }
        Write-Host "[FAIL] BARBER appointment: $($respAppt2.StatusCode) - $body" -ForegroundColor Red
        $results += "❌ TEST 2: BARBER"
    }
} else {
    Write-Host "[FAIL] BARBER login: $($resp2.StatusCode)" -ForegroundColor Red
    $results += "❌ TEST 2: BARBER"
}

# TEST 3: ADMIN
Write-Host "`nTEST 3: ADMIN agendando com clientId + barberId" -ForegroundColor Yellow

$login3 = @{ email = "admin@barberpro.com"; password = "senha123" } | ConvertTo-Json -Compress
$resp3 = Invoke-APIRequest -Uri "$baseUrl/auth/login" -Method POST -Body $login3

if ($resp3.StatusCode -eq 200) {
    $loginData = $resp3.Content | ConvertFrom-Json
    $token3 = $loginData.accessToken
    Write-Host "[OK] ADMIN login ($($resp3.StatusCode))" -ForegroundColor Green
    
    $appt3 = @{
        clientId = "7ec9a4d8-1c21-40fc-b2cf-24f4c38c2bf5"  # Roberto Santos
        barberId = "acc34c94-2161-4613-ba0e-9458e95c1ee2"  # João Barbeiro
        serviceIds = @("531f6c72-cdb0-4d61-8eaa-abe07ca76545")  # Barba Completa
        date = "2026-02-25T19:00:00.000Z"
    } | ConvertTo-Json -Compress
    
    Write-Host "DEBUG: Appointment payload: $appt3" -ForegroundColor DarkGray
    $respAppt3 = Invoke-APIRequest -Uri "$baseUrl/appointments" -Method POST -Body $appt3 -Token $token3
    
    if ($respAppt3.StatusCode -eq 201) {
        Write-Host "[OK] ADMIN appointment created ($($respAppt3.StatusCode))" -ForegroundColor Green
        $results += "✅ TEST 3: ADMIN"
    } else {
        $body = if ($respAppt3.Content) { 
            try { $respAppt3.Content | ConvertFrom-Json | ConvertTo-Json -Compress }
            catch { $respAppt3.Content }
        } else { "NO CONTENT" }
        Write-Host "[FAIL] ADMIN appointment: $($respAppt3.StatusCode) - $body" -ForegroundColor Red
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
