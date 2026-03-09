# Script de teste do fluxo de autenticação completo
$baseUrl = "http://localhost:3000"

Write-Host "`n🔐 TESTE DE AUTENTICAÇÃO - BarberPro Backend`n" -ForegroundColor Cyan

# 1. Login
Write-Host "1️⃣  Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@barberpro.com"
    password = "senha123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    $refreshToken = $loginResponse.refreshToken
    
    Write-Host "   ✅ Login bem-sucedido!" -ForegroundColor Green
    Write-Host "   📝 Access Token: $($accessToken.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "   📝 Refresh Token: $($refreshToken.Substring(0,50))...`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Testar token com endpoint /auth/me
Write-Host "2️⃣  Testando token com /auth/me..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $accessToken" }
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    
    Write-Host "   ✅ Token válido!" -ForegroundColor Green
    Write-Host "   👤 Usuário: $($meResponse.user.name) ($($meResponse.user.email))" -ForegroundColor Gray
    Write-Host "   🏪 Role: $($meResponse.user.role)" -ForegroundColor Gray
    Write-Host "   🆔 Shop ID: $($meResponse.user.shopId)`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro ao validar token: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar acesso a endpoint protegido (listar produtos)
Write-Host "3️⃣  Testando acesso a /products..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $accessToken" }
    $productsResponse = Invoke-RestMethod -Uri "$baseUrl/products?active=true" -Method GET -Headers $headers
    
    Write-Host "   ✅ Acesso autorizado!" -ForegroundColor Green
    Write-Host "   📦 $($productsResponse.Count) produtos encontrados`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro ao acessar produtos: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar refresh token
Write-Host "4️⃣  Testando refresh token..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    $newAccessToken = $refreshResponse.accessToken
    
    Write-Host "   ✅ Refresh bem-sucedido!" -ForegroundColor Green
    Write-Host "   🔄 Novo Access Token: $($newAccessToken.Substring(0,50))...`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro no refresh: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Detalhes: $($_.ErrorDetails.Message)`n" -ForegroundColor Yellow
}

# 5. Testar atualização de produto
Write-Host "5️⃣  Testando atualização de produto..." -ForegroundColor Yellow
try {
    # Primeiro pega a lista de produtos
    $headers = @{ Authorization = "Bearer $accessToken" }
    $products = Invoke-RestMethod -Uri "$baseUrl/products?active=true" -Method GET -Headers $headers
    
    if ($products.Count -gt 0) {
        $productId = $products[0].id
        $updateBody = @{
            name = $products[0].name
            price = $products[0].price + 1
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method PATCH -Body $updateBody -ContentType "application/json" -Headers $headers
        
        Write-Host "   ✅ Produto atualizado com sucesso!" -ForegroundColor Green
        Write-Host "   📝 Produto: $($updateResponse.name) - R$ $($updateResponse.price)`n" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Nenhum produto disponível para teste`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao atualizar produto: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "   💡 Detalhes: $($_.ErrorDetails.Message)`n" -ForegroundColor Yellow
}

Write-Host "✅ Teste completo!`n" -ForegroundColor Green
