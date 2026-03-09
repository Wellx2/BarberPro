# Script de teste para DELETE de produtos
# Valida se a correção do 401 Unauthorized foi resolvida

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000/api"

Write-Host "`n🧪 TESTE DE DELETE DE PRODUTOS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Passo 1: Login como ADMIN
Write-Host "`n1️⃣  Fazendo login como ADMIN..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@barberpro.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.accessToken
    $shopId = $loginResponse.user.shopId
    Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "   ShopId: $shopId" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

# Passo 2: Criar produto de teste
Write-Host "`n2️⃣  Criando produto de teste..." -ForegroundColor Yellow
$productBody = @{
    name = "Produto Teste DELETE - $(Get-Date -Format 'HHmmss')"
    price = 25.50
    stock = 10
    costPrice = 15.00
    unit = "UN"
    category = "Teste"
    description = "Produto criado para testar DELETE"
    active = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/products" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $productBody
    
    $productId = $createResponse.id
    Write-Host "✅ Produto criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $productId" -ForegroundColor Gray
    Write-Host "   Nome: $($createResponse.name)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Erro ao criar produto: $_" -ForegroundColor Red
    exit 1
}

# Passo 3: Testar DELETE (correção do 401)
Write-Host "`n3️⃣  Testando DELETE do produto..." -ForegroundColor Yellow
$deleteBody = @{
    reason = "Teste de correção do bug 401 Unauthorized"
} | ConvertTo-Json

try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" `
        -Method DELETE `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $deleteBody
    
    Write-Host "✅ DELETE executado com sucesso!" -ForegroundColor Green
    Write-Host "   Resposta: $($deleteResponse.message)" -ForegroundColor Gray
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    Write-Host "❌ Erro no DELETE:" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    Write-Host "   Mensagem: $($errorBody.message)" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host "`n⚠️  ERRO 401 persistente!" -ForegroundColor Red
        Write-Host "   Verifique:" -ForegroundColor Yellow
        Write-Host "   - Guards estão aplicados corretamente" -ForegroundColor Yellow
        Write-Host "   - ModuleAccessGuard e @RequireModule estão presentes" -ForegroundColor Yellow
        Write-Host "   - Token está válido e não expirou" -ForegroundColor Yellow
    }
    exit 1
}

# Passo 4: Verificar se produto foi desativado (soft delete)
Write-Host "`n4️⃣  Verificando soft delete..." -ForegroundColor Yellow
try {
    $checkResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        }
    
    if ($checkResponse.active -eq $false) {
        Write-Host "✅ Soft delete confirmado! Produto está inativo." -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Produto ainda está ativo após DELETE" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ℹ️  Produto não encontrado (pode ter sido removido completamente)" -ForegroundColor Cyan
}

# Passo 5: Testar DELETE de serviço para comparação
Write-Host "`n5️⃣  Testando DELETE de serviço (comparação)..." -ForegroundColor Yellow
$serviceBody = @{
    name = "Serviço Teste DELETE - $(Get-Date -Format 'HHmmss')"
    duration = 30
    price = 45.00
    category = "Teste"
    active = $true
} | ConvertTo-Json

try {
    # Criar serviço
    $serviceResponse = Invoke-RestMethod -Uri "$baseUrl/services" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $serviceBody
    
    $serviceId = $serviceResponse.id
    Write-Host "✅ Serviço criado: $serviceId" -ForegroundColor Green
    
    # Deletar serviço
    $deleteServiceBody = @{
        reason = "Teste comparativo"
    } | ConvertTo-Json
    
    $deleteServiceResponse = Invoke-RestMethod -Uri "$baseUrl/services/$serviceId" `
        -Method DELETE `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $deleteServiceBody
    
    Write-Host "✅ DELETE de serviço funcionou!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Erro no DELETE de serviço: $_" -ForegroundColor Yellow
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
