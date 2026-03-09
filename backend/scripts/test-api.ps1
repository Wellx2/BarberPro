#!/usr/bin/env pwsh

Write-Host "🧪 Iniciando bateria de testes da API..." -ForegroundColor Cyan
Write-Host ""

# Aguardar backend estar pronto
Write-Host "⏳ Aguardando backend iniciar..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$backendReady = $false

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend está pronto!" -ForegroundColor Green
    }
    catch {
        $retryCount++
        Write-Host "   Tentativa $retryCount/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend não respondeu após $maxRetries tentativas" -ForegroundColor Red
    Write-Host "💡 Certifique-se de que o backend está rodando: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TESTES DE ENDPOINTS PÚBLICOS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Teste 1: Serviços Shop 1
Write-Host "📍 Testando: Serviços Shop 1 (BarberPro Centro)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-1" -Method Get
    Write-Host "   ✅ Sucesso! Retornou $($response.Count) serviços" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $response | Select-Object -First 3 | ForEach-Object {
            Write-Host "      - $($_.name) ($($_.category)) - R$ $($_.price)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Serviços Shop 2
Write-Host "📍 Testando: Serviços Shop 2 (BarberPro Zona Sul)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-2" -Method Get
    Write-Host "   ✅ Sucesso! Retornou $($response.Count) serviços" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $response | Select-Object -First 3 | ForEach-Object {
            Write-Host "      - $($_.name) ($($_.category)) - R$ $($_.price)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 3: Filtro por active
Write-Host "📍 Testando: Serviços ativos Shop 1" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-1?active=true" -Method Get
    Write-Host "   ✅ Retornou $($response.Count) serviços ativos" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Estatísticas gerais
Write-Host "📊 Estatísticas do Banco:" -ForegroundColor Cyan
try {
    $shop1Services = (Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-1" -Method Get).Count
    $shop2Services = (Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-2" -Method Get).Count
    $totalServices = $shop1Services + $shop2Services
    
    Write-Host "   - Shop 1: $shop1Services serviços" -ForegroundColor White
    Write-Host "   - Shop 2: $shop2Services serviços" -ForegroundColor White
    Write-Host "   - Total: $totalServices serviços" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Erro ao coletar estatísticas" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
