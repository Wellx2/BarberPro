# Investigar problema de vinculo do Barbeiro

$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "INVESTIGANDO VINCULO DO BARBEIRO" -ForegroundColor Cyan
Write-Host ""

# Login como admin
$loginBody = @{email="admin@barberpro.com"; password="senha123"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $login.accessToken

Write-Host "Admin logado." -ForegroundColor Green

# Get all users
Write-Host ""
Write-Host "Verificando usuarios..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Headers @{Authorization="Bearer $token"}
    $users | ForEach-Object {
        Write-Host "User: $($_.name) ($($_.email)) - Role: $($_.role)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Nao conseguiu listar usuarios" -ForegroundColor Red
}

# Get all barbers
Write-Host ""
Write-Host "Verificando barbeiros..." -ForegroundColor Yellow
try {
    $barbers = Invoke-RestMethod -Uri "$baseUrl/api/barbers" -Headers @{Authorization="Bearer $token"}
    $barbers | ForEach-Object {
        Write-Host "Barber: $($_.id) - $($_.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Erro ao listar barbeiros" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Try with barber login
Write-Host ""
Write-Host "Testando barber info apos login..." -ForegroundColor Yellow
$barberLoginBody = @{email="joao@barberpro.com"; password="senha123"} | ConvertTo-Json
$barberLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $barberLoginBody
$barberToken = $barberLogin.accessToken

Write-Host "Barber logado: $($barberLogin.user.id)" -ForegroundColor Green

try {
    $me = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Headers @{Authorization="Bearer $barberToken"}
    Write-Host "Me response:" -ForegroundColor Yellow
    Write-Host ($me | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "Erro ao obter me:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
