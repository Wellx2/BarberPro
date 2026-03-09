# Script para registrar barbearia

$baseUrl = "http://localhost:3000/api"

Write-Host "Registrando nova barbearia..." -ForegroundColor Cyan

$registerBody = @{
    name = "BarberPro Premium"
    email = "welltavaresgames@gmail.com"
    password = "@barberPr0"
    phone = "(11) 98765-4321"
    address = "Rua das Barbearias, 123"
    city = "Sao Paulo"
    state = "SP"
    zipCode = "01234-567"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register-shop" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "Barbearia registrada com sucesso!" -ForegroundColor Green
    Write-Host "Token: $($response.access_token)" -ForegroundColor Yellow
} catch {
    Write-Host "Erro ao registrar: $($_.Exception.Message)" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Detalhes: $($errorDetails.message)" -ForegroundColor Red
}
