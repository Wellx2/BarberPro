Write-Host "=== TESTE DE AUTENTICACAO ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Fazendo login..." -ForegroundColor Yellow
$login = @{
    email = "admin@barberpro.com"
    password = "senha123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $login -ContentType "application/json"
$token = $response.accessToken
Write-Host "OK - Token recebido" -ForegroundColor Green

# 2. Testar /auth/me
Write-Host "`n2. Testando /auth/me..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$me = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Headers $headers
Write-Host "OK - Usuario: $($me.user.name)" -ForegroundColor Green

# 3. Listar produtos
Write-Host "`n3. Listando produtos..." -ForegroundColor Yellow
$products = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Headers $headers
Write-Host "OK - $($products.Count) produtos encontrados" -ForegroundColor Green

# 4. Refresh token
Write-Host "`n4. Testando refresh..." -ForegroundColor Yellow
$refreshBody = @{ refreshToken = $response.refreshToken } | ConvertTo-Json
$refreshResp = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
Write-Host "OK - Novo token recebido" -ForegroundColor Green

Write-Host "`n=== TODOS OS TESTES PASSARAM ===" -ForegroundColor Green
