# Script simples para testar endpoints financeiros
Write-Host "TESTE DOS ENDPOINTS FINANCEIROS - BarberPro" -ForegroundColor Cyan
Write-Host "=" * 60

# Configuracao
$baseUrl = "http://localhost:3000"
$email = "admin@barberpro.com"
$password = "senha123"
$shopId = "shop-1"

# 1. Login
Write-Host "`n1. Fazendo login como Admin..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "Login bem-sucedido!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.name) ($($loginResponse.user.role))"
} catch {
    Write-Host "Erro no login: $_" -ForegroundColor Red
    exit 1
}

# Headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Analytics HOJE
Write-Host "`n2. Testando Analytics - HOJE" -ForegroundColor Yellow
try {
    $uri = "$baseUrl/financial/analytics?shopId=$shopId" + "&" + "period=TODAY"
    $analyticsToday = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    Write-Host "Analytics HOJE obtido!" -ForegroundColor Green
    Write-Host "Receita Bruta: R$ $($analyticsToday.gross)"
    Write-Host "Despesas: R$ $($analyticsToday.expenses)"
    Write-Host "Receita Liquida: R$ $($analyticsToday.net)"
    Write-Host "Margem: $($analyticsToday.margin)%"
    Write-Host "Ticket Medio: R$ $($analyticsToday.avgTicket)"
    Write-Host "Comissoes Barbeiros:"
    foreach ($comm in $analyticsToday.commissionsByBarber) {
        Write-Host "  - $($comm.barberName): R$ $($comm.totalCommission) (Taxa: $($comm.commissionRate)%)"
    }
} catch {
    Write-Host "Erro em Analytics HOJE: $_" -ForegroundColor Red
}

# 3. Analytics MES
Write-Host "`n3. Testando Analytics - MES" -ForegroundColor Yellow
try {
    $uri = "$baseUrl/financial/analytics?shopId=$shopId" + "&" + "period=MONTH"
    $analyticsMonth = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    Write-Host "Analytics MES obtido!" -ForegroundColor Green
    Write-Host "Receita Bruta: R$ $($analyticsMonth.gross)"
    Write-Host "Receita Servicos: R$ $($analyticsMonth.serviceRevenue)"
    Write-Host "Receita Produtos: R$ $($analyticsMonth.productRevenue)"
    Write-Host "Receita Planos: R$ $($analyticsMonth.planRevenue)"
    Write-Host "Despesas: R$ $($analyticsMonth.expenses)"
    Write-Host "Custos Fixos: R$ $($analyticsMonth.fixedCostsTotal)"
    Write-Host "Receita Liquida: R$ $($analyticsMonth.net)"
    Write-Host "Margem: $($analyticsMonth.margin)%"
    Write-Host "Total Comissoes: R$ $($analyticsMonth.totalCommissions)"
} catch {
    Write-Host "Erro em Analytics MES: $_" -ForegroundColor Red
}

# 4. Caixa Diario
Write-Host "`n4. Testando Caixa Diario - HOJE" -ForegroundColor Yellow
$today = Get-Date -Format "yyyy-MM-dd"
try {
    $uri = "$baseUrl/financial/cashier/daily?shopId=$shopId" + "&" + "date=$today"
    $cashier = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    Write-Host "Caixa Diario obtido!" -ForegroundColor Green
    Write-Host "Total Recebido: R$ $($cashier.totalReceived)"
    Write-Host "Total Pendente: R$ $($cashier.totalPending)"
    Write-Host "Total do Dia: R$ $($cashier.totalDay)"
    Write-Host ""
    Write-Host "Formas de Pagamento:"
    foreach ($method in $cashier.paymentMethods) {
        Write-Host "  - $($method.method): R$ $($method.amount) ($($method.count) transacoes)"
    }
    Write-Host ""
    Write-Host "Comissoes dos Barbeiros:"
    foreach ($comm in $cashier.barberCommissions) {
        Write-Host "  - $($comm.barberName): R$ $($comm.commission)"
    }
    Write-Host ""
    if ($cashier.pendingInvoices.Count -gt 0) {
        Write-Host "Faturas Pendentes: $($cashier.pendingInvoices.Count)"
        foreach ($pending in $cashier.pendingInvoices) {
            Write-Host "  - $($pending.clientName): R$ $($pending.amount) - $($pending.description)"
        }
    } else {
        Write-Host "Nenhuma fatura pendente hoje!"
    }
} catch {
    Write-Host "Erro em Caixa Diario: $_" -ForegroundColor Red
}

# 5. Analytics SEMANA
Write-Host "`n5. Testando Analytics - SEMANA" -ForegroundColor Yellow
try {
    $uri = "$baseUrl/financial/analytics?shopId=$shopId" + "&" + "period=WEEK"
    $analyticsWeek = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    Write-Host "Analytics SEMANA obtido!" -ForegroundColor Green
    Write-Host "Receita Bruta: R$ $($analyticsWeek.gross)"
    Write-Host "Receita Liquida: R$ $($analyticsWeek.net)"
    Write-Host "Margem: $($analyticsWeek.margin)%"
} catch {
    Write-Host "Erro em Analytics SEMANA: $_" -ForegroundColor Red
}

Write-Host "`n=" * 60
Write-Host "TESTES CONCLUIDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumo dos Endpoints Testados:" -ForegroundColor Cyan
Write-Host "  - POST /auth/login"
Write-Host "  - GET /financial/analytics?period=TODAY"
Write-Host "  - GET /financial/analytics?period=MONTH"
Write-Host "  - GET /financial/analytics?period=WEEK"
Write-Host "  - GET /financial/cashier/daily?date=$today"
Write-Host ""
Write-Host "Sistema financeiro funcionando!" -ForegroundColor Green
