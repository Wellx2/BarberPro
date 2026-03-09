# Teste de Endpoints Publicos - Barbershops
# Rotas sem autenticacao

$baseUrl = "http://localhost:3000/api"

Write-Host "`n========================================"
Write-Host "  TESTE DE ROTAS PUBLICAS"
Write-Host "========================================`n"

$passed = 0
$total = 3

# TESTE 1: Listar todas barbearias
Write-Host "[1/3] GET /barbershops/public"
try {
    $res = curl "$baseUrl/barbershops/public" -UseBasicParsing 2>$null | ConvertFrom-Json
    if ($res.Count -gt 0) {
        Write-Host "  [OK] Retornou $($res.Count) barbearia(s)" -ForegroundColor Green
        $shopId = $res[0].id
        $passed++
    } else {
        Write-Host "  [ERRO] Resposta vazia" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# TESTE 2: Busca com parametro
Write-Host "`n[2/3] GET /barbershops/public?search=centro"
try {
    $res = curl "$baseUrl/barbershops/public?search=centro" -UseBasicParsing 2>$null | ConvertFrom-Json
    if ($res) {
        Write-Host "  [OK] Busca funcionando" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [ERRO] Busca falhou" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# TESTE 3: Detalhes com preview
Write-Host "`n[3/3] GET /barbershops/public/:shopId (com preview)"
try {
    if ($shopId) {
        $res = curl "$baseUrl/barbershops/public/$shopId" -UseBasicParsing 2>$null | ConvertFrom-Json
        
        if ($res.shop -and $res.services -and $res.products -and $res.barbers) {
            Write-Host "  [OK] Preview completo" -ForegroundColor Green
            Write-Host "     Shop: $($res.shop.name)" -ForegroundColor Gray
            Write-Host "     Servicos: $($res.services.Count)" -ForegroundColor Gray
            Write-Host "     Produtos: $($res.products.Count)" -ForegroundColor Gray
            Write-Host "     Barbeiros: $($res.barbers.Count)" -ForegroundColor Gray
            $passed++
        } else {
            Write-Host "  [ERRO] Preview incompleto" -ForegroundColor Red
        }
    } else {
        Write-Host "  [AVISO] Sem ID para testar" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red
}

# Resumo
Write-Host "`n========================================"
Write-Host "RESULTADO: $passed/$total testes passaram"
if ($passed -eq $total) {
    Write-Host "[OK] Todos testes passaram!" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Alguns testes falharam" -ForegroundColor Yellow
}
Write-Host "========================================`n"
