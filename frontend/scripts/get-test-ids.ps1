# Get Real IDs from Backend
$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "BUSCANDO IDs REAIS DO BANCO DE DADOS" -ForegroundColor Cyan
Write-Host ""

# Login como admin
$loginBody = @{email="admin@barberpro.com"; password="senha123"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $login.accessToken
$adminId = $login.user.id

Write-Host "Admin logado: $adminId" -ForegroundColor Green

# Get shop info
Write-Host ""
Write-Host "Buscando shop de admin..." -ForegroundColor Yellow
try {
    $shops = Invoke-RestMethod -Uri "$baseUrl/api/barbershops" -Headers @{Authorization="Bearer $token"}
    $shop = $shops[0]
    Write-Host "Shop encontrada: $($shop.id) - $($shop.name)" -ForegroundColor Green
    Write-Host ""
    
    # Get services
    Write-Host "Buscando servicos..." -ForegroundColor Yellow
    $services = Invoke-RestMethod -Uri "$baseUrl/api/services" -Headers @{Authorization="Bearer $token"}
    if ($services.length -gt 0) {
        Write-Host "Primeiro servico:" -ForegroundColor Green
        Write-Host "  ID: $($services[0].id)" -ForegroundColor Green
        Write-Host "  Nome: $($services[0].name)" -ForegroundColor Green
        Write-Host "  Preco: $($services[0].price)" -ForegroundColor Green
    }
    Write-Host ""
    
    # Get barbers
    Write-Host "Buscando barbeiros..." -ForegroundColor Yellow
    $barbers = Invoke-RestMethod -Uri "$baseUrl/api/barbers" -Headers @{Authorization="Bearer $token"}
    if ($barbers.length -gt 0) {
        Write-Host "Primeiro barbeiro:" -ForegroundColor Green
        Write-Host "  ID: $($barbers[0].id)" -ForegroundColor Green
        Write-Host "  Nome: $($barbers[0].name)" -ForegroundColor Green
    }
    Write-Host ""
    
    # Get clients
    Write-Host "Buscando clientes..." -ForegroundColor Yellow
    $clients = Invoke-RestMethod -Uri "$baseUrl/api/clients" -Headers @{Authorization="Bearer $token"}
    if ($clients.length -gt 0) {
        Write-Host "Primeiro cliente:" -ForegroundColor Green
        Write-Host "  ID: $($clients[0].id)" -ForegroundColor Green
        Write-Host "  Nome: $($clients[0].name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "DADOS ENCONTRADOS:" -ForegroundColor Cyan
    Write-Host "Service ID:  $($services[0].id)" -ForegroundColor Yellow
    Write-Host "Barber ID:   $($barbers[0].id)" -ForegroundColor Yellow
    Write-Host "Client ID:   $($clients[0].id)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro ao buscar dados:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
