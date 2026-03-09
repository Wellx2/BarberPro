# Script para popular servicos no backend BarberPro

$baseUrl = "http://localhost:3000/api"

Write-Host "Iniciando populacao de servicos..." -ForegroundColor Cyan

# 1. Fazer login
Write-Host "Fazendo login..." -ForegroundColor Yellow

$loginBody = @{
    email = "welltavaresgames@gmail.com"
    password = "@barberPr0"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro no login. Verifique as credenciais." -ForegroundColor Red
    Write-Host "Resposta: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Headers com autenticacao
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 3. Lista de servicos para criar
$services = @(
    @{
        name = "Corte Tradicional"
        description = "Corte classico e atemporal, executado com tecnicas refinadas."
        price = 45.00
        duration = 45
        category = "Cortes"
        isActive = $true
    },
    @{
        name = "Barba Completa"
        description = "Modelagem e finalizacao profissional com navalha e produtos premium."
        price = 35.00
        duration = 30
        category = "Barbas"
        isActive = $true
    },
    @{
        name = "Corte + Barba"
        description = "Combo completo para um visual impecavel."
        price = 70.00
        duration = 60
        category = "Combos"
        isActive = $true
    },
    @{
        name = "Corte Degrade"
        description = "Degrade preciso com transicoes suaves."
        price = 50.00
        duration = 50
        category = "Cortes"
        isActive = $true
    },
    @{
        name = "Alisamento"
        description = "Tratamento de alisamento profissional."
        price = 120.00
        duration = 90
        category = "Tratamentos"
        isActive = $true
    },
    @{
        name = "Hidratacao Capilar"
        description = "Tratamento intensivo de hidratacao com produtos premium."
        price = 80.00
        duration = 60
        category = "Tratamentos"
        isActive = $true
    }
)

Write-Host "Criando $($services.Count) servicos..." -ForegroundColor Yellow

$created = 0
$errors = 0

foreach ($service in $services) {
    try {
        $body = $service | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Body $body -Headers $headers
        Write-Host "Criado: $($service.name) - R$ $($service.price)" -ForegroundColor Green
        $created++
    } catch {
        Write-Host "Erro ao criar '$($service.name)': $($_.Exception.Message)" -ForegroundColor Yellow
        $errors++
    }
}

Write-Host "`nResumo:" -ForegroundColor Cyan
Write-Host "Criados: $created" -ForegroundColor Green
Write-Host "Erros: $errors" -ForegroundColor Yellow

# 4. Verificar servicos criados
Write-Host "`nVerificando servicos criados..." -ForegroundColor Yellow
try {
    $allServices = Invoke-RestMethod -Uri "$baseUrl/services" -Method GET -Headers $headers
    Write-Host "Total de servicos: $($allServices.Count)" -ForegroundColor Green
    
    foreach ($s in $allServices) {
        Write-Host "- $($s.name) - R$ $($s.price)" -ForegroundColor White
    }
} catch {
    Write-Host "Nao foi possivel listar servicos" -ForegroundColor Yellow
}

Write-Host "`nProcesso concluido!" -ForegroundColor Green
