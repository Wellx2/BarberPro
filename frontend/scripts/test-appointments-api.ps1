# Script de Teste - Appointments API
# Execute este script para testar o endpoint diretamente

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # ← COLE SEU TOKEN AQUI (do localStorage)

Write-Host "🧪 TESTE 1: Formato 'date'" -ForegroundColor Yellow
$body1 = @{
    barberId = "da32c394-bf23-4860-8a6c-a54b40035e18"
    serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
    date = "2026-02-18T14:00:00.000Z"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body1
    
    Write-Host "✅ SUCESSO com 'date'!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    exit 0
} catch {
    Write-Host "❌ Falhou com 'date'" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Erro: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n🧪 TESTE 2: Formato 'scheduledFor'" -ForegroundColor Yellow
$body2 = @{
    barberId = "da32c394-bf23-4860-8a6c-a54b40035e18"
    serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
    scheduledFor = "2026-02-18T14:00:00.000Z"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body2
    
    Write-Host "✅ SUCESSO com 'scheduledFor'!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    exit 0
} catch {
    Write-Host "❌ Falhou com 'scheduledFor'" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Erro: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n🧪 TESTE 3: Formato 'scheduledAt' + duration" -ForegroundColor Yellow
$body3 = @{
    barberId = "da32c394-bf23-4860-8a6c-a54b40035e18"
    serviceIds = @("14471c86-9444-43aa-ba23-2eeeee1e067e")
    scheduledAt = "2026-02-18T14:00:00.000Z"
    duration = 30
    clientId = "45b90b65-4ba8-49e7-87d0-bdd092c00cca"
    barbershopId = "f95101f7-ab85-46d2-bb1e-c300c49ad095"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body3
    
    Write-Host "✅ SUCESSO com 'scheduledAt + campos extras'!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    exit 0
} catch {
    Write-Host "❌ Falhou com 'scheduledAt + campos extras'" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Erro: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n❌ TODAS AS TENTATIVAS FALHARAM!" -ForegroundColor Red
Write-Host "⚠️ O endpoint /api/appointments não aceita NENHUM dos formatos comuns" -ForegroundColor Yellow
Write-Host "📋 AÇÃO: Verifique o Swagger em http://localhost:3000/api/docs" -ForegroundColor Cyan
