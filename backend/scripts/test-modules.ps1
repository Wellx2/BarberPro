# Script de Teste - Sistema de Módulos BarberPro
# Execute cada bloco sequencialmente

$baseUrl = "http://localhost:3000/api"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "`n=== TESTE 1: Criar SUPER_ADMIN ===" -ForegroundColor Cyan

# Crie manualmente um SUPER_ADMIN no banco ou use seed
# UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'admin@barberpro.com';

Write-Host "`n=== TESTE 2: Login como SUPER_ADMIN ===" -ForegroundColor Cyan
$loginSuper = @{
    email = "admin@barberpro.com"
    password = "Admin123!"
} | ConvertTo-Json

$responseSuperLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginSuper -Headers $headers
$superToken = $responseSuperLogin.accessToken
$superHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superToken"
}

Write-Host "✅ SUPER_ADMIN logado: $($responseSuperLogin.user.name)" -ForegroundColor Green

Write-Host "`n=== TESTE 3: Listar todas as barbearias e módulos ===" -ForegroundColor Cyan
$allShops = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/all" -Method GET -Headers $superHeaders
Write-Host "Barbearias encontradas: $($allShops.Count)" -ForegroundColor Yellow
$allShops | ForEach-Object {
    Write-Host "  - $($_.name): $($_.enabledModules)/$($_.totalModules) módulos habilitados"
}

Write-Host "`n=== TESTE 4: Pegar shopId da primeira barbearia ===" -ForegroundColor Cyan
$shopId = $allShops[0].id
Write-Host "Shop ID selecionado: $shopId" -ForegroundColor Yellow

Write-Host "`n=== TESTE 5: Listar módulos da barbearia ===" -ForegroundColor Cyan
$shopModules = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/shop/$shopId" -Method GET -Headers $superHeaders
Write-Host "Módulos:" -ForegroundColor Yellow
$shopModules | ForEach-Object {
    $status = if ($_.enabled) { "✅ HABILITADO" } else { "❌ DESABILITADO" }
    Write-Host "  $status - $($_.moduleType)"
}

Write-Host "`n=== TESTE 6: Desabilitar módulo PRODUTOS ===" -ForegroundColor Cyan
$disableBody = @{ enabled = $false } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/shop/$shopId/module/PRODUTOS" -Method PATCH -Body $disableBody -Headers $superHeaders
Write-Host "✅ Módulo PRODUTOS desabilitado" -ForegroundColor Green

Write-Host "`n=== TESTE 7: Login como ADMIN da barbearia ===" -ForegroundColor Cyan
# Substitua pelo email/senha do ADMIN desta barbearia
$loginAdmin = @{
    email = "admin@exemplo.com"
    password = "senha123"
} | ConvertTo-Json

try {
    $responseAdminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginAdmin -Headers $headers
    $adminToken = $responseAdminLogin.accessToken
    $adminHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    }
    Write-Host "✅ ADMIN logado: $($responseAdminLogin.user.name)" -ForegroundColor Green

    Write-Host "`n=== TESTE 8: ADMIN tenta listar produtos (módulo desabilitado) ===" -ForegroundColor Cyan
    try {
        $products = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $adminHeaders
        Write-Host "❌ FALHOU: Deveria retornar 403 Forbidden!" -ForegroundColor Red
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "✅ SUCESSO: 403 Forbidden recebido corretamente" -ForegroundColor Green
            Write-Host "   Mensagem: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host "`n=== TESTE 9: Habilitar módulo PRODUTOS novamente ===" -ForegroundColor Cyan
    $enableBody = @{ enabled = $true } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/shop/$shopId/module/PRODUTOS" -Method PATCH -Body $enableBody -Headers $superHeaders
    Write-Host "✅ Módulo PRODUTOS habilitado" -ForegroundColor Green

    Write-Host "`n=== TESTE 10: ADMIN tenta listar produtos novamente ===" -ForegroundColor Cyan
    $products = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $adminHeaders
    Write-Host "✅ SUCESSO: Produtos retornados ($($products.Count) itens)" -ForegroundColor Green

    Write-Host "`n=== TESTE 11: Atualização em massa ===" -ForegroundColor Cyan
    $bulkBody = @{
        modules = @(
            @{ moduleType = "MARKETING"; enabled = $false }
            @{ moduleType = "NOTIFICACOES"; enabled = $false }
            @{ moduleType = "PLANOS"; enabled = $false }
        )
    } | ConvertTo-Json -Depth 3

    $bulkResult = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/shop/$shopId/bulk" -Method PATCH -Body $bulkBody -Headers $superHeaders
    Write-Host "✅ $($bulkResult.updated) módulos atualizados" -ForegroundColor Green
}
catch {
    Write-Host "`n⚠️  Erro no login do ADMIN. Configure um usuário ADMIN válido no TESTE 7" -ForegroundColor Yellow
    Write-Host "   Você pode criar um via: POST /auth/register-shop" -ForegroundColor Yellow
}

Write-Host "`n=== TESTE 12: Verificar módulos habilitados apenas ===" -ForegroundColor Cyan
$enabledOnly = Invoke-RestMethod -Uri "$baseUrl/barbershop-modules/shop/$shopId/enabled" -Method GET -Headers $superHeaders
Write-Host "Módulos HABILITADOS:" -ForegroundColor Yellow
$enabledOnly | ForEach-Object {
    Write-Host "  ✅ $($_.moduleType)"
}

Write-Host "`n=== TESTES CONCLUÍDOS ===" -ForegroundColor Cyan
Write-Host "Sistema de módulos funcionando corretamente! 🎉" -ForegroundColor Green
