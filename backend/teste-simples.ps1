# Script de teste simples
Write-Host "🔍 Verificando Docker..." -ForegroundColor Cyan
docker ps -a | findstr barberpro

Write-Host "`n🐘 Iniciando PostgreSQL..." -ForegroundColor Cyan
docker compose up -d postgres
Start-Sleep -Seconds 3

Write-Host "`n📡 Testando API (aguarde 15 segundos para o backend iniciar)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n🧪 GET /api/services/public/shop/shop-1" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/services/public/shop/shop-1"
    Write-Host "✅ Sucesso! Retornou $($response.Count) serviços" -ForegroundColor Green
    $response | Select-Object -First 5 name, category, price, duration | Format-Table
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}
