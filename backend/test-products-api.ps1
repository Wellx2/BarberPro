# Teste do endpoint público de produtos
$url = "http://localhost:3000/products/public/shop/shop-1?active=true"

Write-Host "🧪 Testando endpoint: $url`n" -ForegroundColor Cyan

try {
    $products = Invoke-RestMethod -Uri $url -Method Get
    
    Write-Host "✅ Sucesso! Encontrados $($products.Count) produtos`n" -ForegroundColor Green
    
    Write-Host "📦 Produtos disponíveis:`n" -ForegroundColor Yellow
    
    $products | ForEach-Object {
        Write-Host "  • $($_.name) - R$ $($_.price) (Estoque: $($_.stock))" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}
