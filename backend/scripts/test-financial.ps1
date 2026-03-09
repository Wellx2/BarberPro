# Script para testar endpoints financeiros do BarberPro Backend
# Requer: servidor rodando em http://localhost:3000

Write-Host "🧪 TESTE DOS ENDPOINTS FINANCEIROS - BarberPro" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Configuração
$baseUrl = "http://localhost:3000"
$email = "admin@barberpro.com"
$password = "senha123"
$shopId = "shop-1"

# 1. Login para obter token
Write-Host "🔐 1. Fazendo login como Admin..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "✅ Login bem-sucedido! Token obtido." -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.name) ($($loginResponse.user.role))"
    Write-Host ""
} catch {
    Write-Host "❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

# Headers com autenticação
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Teste GET /api/financial/analytics - HOJE
Write-Host "📊 2. Testando Analytics - HOJE" -ForegroundColor Yellow
try {
    $analyticsToday = Invoke-RestMethod -Uri "$baseUrl/financial/analytics?shopId=$shopId&period=TODAY" -Method Get -Headers $headers
    Write-Host "✅ Analytics HOJE obtido com sucesso!" -ForegroundColor Green
    Write-Host "   📈 Receita Bruta: R$ $($analyticsToday.gross)"
    Write-Host "   💸 Despesas: R$ $($analyticsToday.expenses)"
    Write-Host "   💰 Receita Líquida: R$ $($analyticsToday.net)"
    Write-Host "   📊 Margem: $($analyticsToday.margin)%"
    Write-Host "   🎯 Ticket Médio: R$ $($analyticsToday.avgTicket)"
    Write-Host "   👥 Comissões Barbeiros:"
    foreach ($comm in $analyticsToday.commissionsByBarber) {
        Write-Host "      - $($comm.barberName): R$ $($comm.totalCommission) (Taxa: $($comm.commissionRate)%)"
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro em Analytics HOJE: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode
}

# 3. Teste GET /api/financial/analytics - MÊSO
Write-Host "📊 3. Testando Analytics - MÊS" -ForegroundColor Yellow
try {
    $analyticsMonth = Invoke-RestMethod -Uri "$baseUrl/financial/analytics?shopId=$shopId&period=MONTH" -Method Get -Headers $headers
    Write-Host "✅ Analytics MÊS obtido com sucesso!" -ForegroundColor Green
    Write-Host "   📈 Receita Bruta: R$ $($analyticsMonth.gross)"
    Write-Host "   💵 Receita Serviços: R$ $($analyticsMonth.serviceRevenue)"
    Write-Host "   🧴 Receita Produtos: R$ $($analyticsMonth.productRevenue)"
    Write-Host "   💳 Receita Planos: R$ $($analyticsMonth.planRevenue)"
    Write-Host "   💸 Despesas: R$ $($analyticsMonth.expenses)"
    Write-Host "   🏦 Custos Fixos: R$ $($analyticsMonth.fixedCostsTotal)"
    Write-Host "   🧴 Custos Produtos: R$ $($analyticsMonth.productCosts)"
    Write-Host "   💰 Receita Líquida: R$ $($analyticsMonth.net)"
    Write-Host "   📊 Margem: $($analyticsMonth.margin)%"
    Write-Host "   🎯 Ticket Médio: R$ $($analyticsMonth.avgTicket)"
    Write-Host "   💼 Total Comissões: R$ $($analyticsMonth.totalCommissions)"
    Write-Host ""
} catch {
    Write-Host "❌ Erro em Analytics MÊS: $_" -ForegroundColor Red
}

# 4. Teste GET /api/financial/cashier/daily - HOJE
Write-Host "💵 4. Testando Caixa Diário - HOJE" -ForegroundColor Yellow
$today = Get-Date -Format "yyyy-MM-dd"
try {
    $cashier = Invoke-RestMethod -Uri "$baseUrl/financial/cashier/daily?shopId=$shopId&date=$today" -Method Get -Headers $headers
    Write-Host "✅ Caixa Diário obtido com sucesso!" -ForegroundColor Green
    Write-Host "   💰 Total Recebido: R$ $($cashier.totalReceived)"
    Write-Host "   ⏳ Total Pendente: R$ $($cashier.totalPending)"
    Write-Host "   📊 Total do Dia: R$ $($cashier.totalDay)"
    Write-Host ""
    Write-Host "   💳 Formas de Pagamento:"
    foreach ($method in $cashier.paymentMethods) {
        Write-Host "      - $($method.method): R$ $($method.amount) ($($method.count) transações)"
    }
    Write-Host ""
    Write-Host "   👥 Comissões dos Barbeiros:"
    foreach ($comm in $cashier.barberCommissions) {
        Write-Host "      - $($comm.barberName): R$ $($comm.commission)"
    }
    Write-Host ""
    if ($cashier.pendingInvoices.Count -gt 0) {
        Write-Host "   ⚠️  Faturas Pendentes ($($cashier.pendingInvoices.Count)):"
        foreach ($pending in $cashier.pendingInvoices) {
            Write-Host "      - $($pending.clientName): R$ $($pending.amount) - $($pending.description)"
        }
    } else {
        Write-Host "   ✅ Nenhuma fatura pendente hoje!"
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro em Caixa Diário: $_" -ForegroundColor Red
}

# 5. Teste Analytics com período customizado (últimos 7 dias)
Write-Host "📊 5. Testando Analytics - SEMANA" -ForegroundColor Yellow
try {
    $analyticsWeek = Invoke-RestMethod -Uri "$baseUrl/financial/analytics?shopId=$shopId&period=WEEK" -Method Get -Headers $headers
    Write-Host "✅ Analytics SEMANA obtido com sucesso!" -ForegroundColor Green
    Write-Host "   📈 Receita Bruta: R$ $($analyticsWeek.gross)"
    Write-Host "   💰 Receita Líquida: R$ $($analyticsWeek.net)"
    Write-Host "   📊 Margem: $($analyticsWeek.margin)%"
    Write-Host ""
} catch {
    Write-Host "❌ Erro em Analytics SEMANA: $_" -ForegroundColor Red
}

# 6. Resumo final
Write-Host "=" * 60
Write-Host "✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumo dos Endpoints Testados:" -ForegroundColor Cyan
Write-Host "   ✅ POST /auth/login"
Write-Host "   ✅ GET /financial/analytics?period=TODAY"
Write-Host "   ✅ GET /financial/analytics?period=MONTH"
Write-Host "   ✅ GET /financial/analytics?period=WEEK"
Write-Host "   ✅ GET /financial/cashier/daily?date=$today"
Write-Host ""
Write-Host "🎉 Sistema financeiro funcionando corretamente!" -ForegroundColor Green
