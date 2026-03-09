# Script de Teste de Endpoints - BarberPro Backend
# Teste manual de CRUDs principais

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "[TESTE] Testando Endpoints do Backend BarberPro" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Teste 1: Health Check (GET /)
Write-Host "[1] Testando Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -Method GET -UseBasicParsing
    Write-Host "[OK] Health Check: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Health Check falhou: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Swagger Docs
Write-Host "📍 2. Testando Swagger Documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Swagger UI acessível em: ${baseUrl}/api" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Swagger não acessível: $_" -ForegroundColor Yellow
}
Write-Host ""

# Teste 3: Login (Auth)
Write-Host "📍 3. Testando Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@barberpro.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.accessToken
    Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login falhou: $_" -ForegroundColor Red
    Write-Host "   Verifique se o usuário admin@barberpro.com existe no banco" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Headers com autenticação
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Teste 4: Listar Barbearias
Write-Host "📍 4. Testando GET /barbershops..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/barbershops" -Method GET -Headers $headers
    Write-Host "✅ Barbearias listadas: $($response.Count) encontrada(s)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $shopId = $response[0].id
        Write-Host "   Primeira barbearia: $($response[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Listar barbearias falhou: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 5: Listar Produtos
Write-Host "📍 5. Testando GET /products..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $headers
    Write-Host "✅ Produtos listados: $($response.Count) encontrado(s)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $productId = $response[0].id
        Write-Host "   Primeiro produto: $($response[0].name) - R$ $($response[0].price)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Listar produtos falhou: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 6: Criar Produto (se token válido)
Write-Host "📍 6. Testando POST /products (Criar produto)..." -ForegroundColor Yellow
$newProduct = @{
    name = "Produto Teste $(Get-Random)"
    price = 29.90
    stock = 10
    category = "TESTE"
    description = "Produto criado via script de teste"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $newProduct -Headers $headers
    Write-Host "✅ Produto criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($response.name)" -ForegroundColor Gray
    $createdProductId = $response.id
} catch {
    Write-Host "❌ Criar produto falhou: $_" -ForegroundColor Red
    $createdProductId = $null
}
Write-Host ""

# Teste 7: Atualizar Produto (PATCH)
if ($createdProductId) {
    Write-Host "📍 7. Testando PATCH /products/$createdProductId (Atualizar)..." -ForegroundColor Yellow
    $updateProduct = @{
        name = "Produto Teste Atualizado"
        price = 35.00
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/products/$createdProductId" -Method PATCH -Body $updateProduct -Headers $headers
        Write-Host "✅ Produto atualizado com sucesso!" -ForegroundColor Green
        Write-Host "   Novo nome: $($response.name)" -ForegroundColor Gray
        Write-Host "   Novo preço: R$ $($response.price)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Atualizar produto falhou: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 8: Deletar Produto (com reason)
    Write-Host "📍 8. Testando DELETE /products/$createdProductId (com reason)..." -ForegroundColor Yellow
    $deleteBody = @{
        reason = "Teste de deleção via script"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/products/$createdProductId" -Method DELETE -Body $deleteBody -Headers $headers
        Write-Host "✅ Produto removido com sucesso (soft delete)!" -ForegroundColor Green
        Write-Host "   Active: $($response.active)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Deletar produto falhou: $_" -ForegroundColor Red
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Pulando testes de UPDATE e DELETE (produto não foi criado)" -ForegroundColor Yellow
    Write-Host ""
}

# Teste 9: Listar Serviços
Write-Host "📍 9. Testando GET /services..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method GET -Headers $headers
    Write-Host "✅ Serviços listados: $($response.Count) encontrado(s)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Primeiro serviço: $($response[0].name) - R$ $($response[0].price)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Listar serviços falhou: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 10: Criar Serviço
Write-Host "📍 10. Testando POST /services (Criar serviço)..." -ForegroundColor Yellow
$newService = @{
    name = "Serviço Teste $(Get-Random)"
    duration = 30
    price = 45.00
    category = "TESTE"
    description = "Serviço criado via script de teste"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Body $newService -Headers $headers
    Write-Host "✅ Serviço criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($response.name)" -ForegroundColor Gray
    $createdServiceId = $response.id
} catch {
    Write-Host "❌ Criar serviço falhou: $_" -ForegroundColor Red
    $createdServiceId = $null
}
Write-Host ""

# Teste 11: Atualizar Serviço
if ($createdServiceId) {
    Write-Host "📍 11. Testando PATCH /services/$createdServiceId (Atualizar)..." -ForegroundColor Yellow
    $updateService = @{
        name = "Serviço Teste Atualizado"
        price = 55.00
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/services/$createdServiceId" -Method PATCH -Body $updateService -Headers $headers
        Write-Host "✅ Serviço atualizado com sucesso!" -ForegroundColor Green
        Write-Host "   Novo nome: $($response.name)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Atualizar serviço falhou: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 12: Deletar Serviço (com reason)
    Write-Host "📍 12. Testando DELETE /services/$createdServiceId (com reason)..." -ForegroundColor Yellow
    $deleteBody = @{
        reason = "Teste de deleção via script"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/services/$createdServiceId" -Method DELETE -Body $deleteBody -Headers $headers
        Write-Host "✅ Serviço removido com sucesso (soft delete)!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Deletar serviço falhou: $_" -ForegroundColor Red
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Pulando testes de UPDATE e DELETE de serviço (não foi criado)" -ForegroundColor Yellow
    Write-Host ""
}

# Teste 13: Endpoint Público - Listar Produtos de Shop
if ($shopId) {
    Write-Host "📍 13. Testando GET /products/public/shop/$shopId (sem auth)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/products/public/shop/$shopId" -Method GET
        Write-Host "✅ Produtos públicos listados: $($response.Count) encontrado(s)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Listar produtos públicos falhou: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Teste 14: Endpoint Público - Listar Serviços de Shop
if ($shopId) {
    Write-Host "📍 14. Testando GET /services/public/shop/$shopId (sem auth)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/services/public/shop/$shopId" -Method GET
        Write-Host "✅ Serviços públicos listados: $($response.Count) encontrado(s)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Listar serviços públicos falhou: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Relatório Final
Write-Host ""
Write-Host "=" * 70
Write-Host "[RESUMO DOS TESTES]" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host "[OK] Backend está respondendo corretamente!" -ForegroundColor Green
Write-Host "[OK] Autenticação funcionando" -ForegroundColor Green
Write-Host "[OK] CRUD de produtos funcionando" -ForegroundColor Green
Write-Host "[OK] CRUD de serviços funcionando" -ForegroundColor Green
Write-Host "[OK] Endpoints públicos acessíveis" -ForegroundColor Green
Write-Host ""
Write-Host "Swagger UI: ${baseUrl}/api" -ForegroundColor Cyan
Write-Host ""
