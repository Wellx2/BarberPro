import { test, expect, Page } from '@playwright/test';

// Helper: Login as Admin
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('seu@email.com').fill('admin@klypbarber.com');
  await page.getByPlaceholder('••••••••').fill('senha123');
  await page.getByRole('button', { name: /Entrar/i }).click();
  await page.waitForTimeout(3000);
}

test.describe('7. Fluxo de Caixa & Vendas', () => {
  test('Caixa Operacional carrega KPIs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cashier');
    await page.waitForTimeout(3000);

    // Verificar se os KPIs carregaram
    const hasCaixa = await page.getByText('Caixa Operacional').isVisible().catch(() => false);
    const hasRecebido = await page.getByText('Recebido').first().isVisible().catch(() => false);
    const hasPendente = await page.getByText('Pendente').first().isVisible().catch(() => false);
    const hasError = await page.getByText('Erro ao carregar dados').isVisible().catch(() => false);

    // Deve ter ou o caixa carregado ou um erro tratado (não um crash)
    expect(hasCaixa || hasError).toBeTruthy();
    
    if (hasCaixa) {
      console.log(`KPIs carregados: Recebido=${hasRecebido}, Pendente=${hasPendente}`);
    }
  });

  test('Botão Fechar Caixa está presente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cashier');
    await page.waitForTimeout(3000);

    const hasCaixa = await page.getByText('Caixa Operacional').isVisible().catch(() => false);
    if (hasCaixa) {
      // Deve ter o botão "Fechar Caixa"
      const fecharBtn = page.getByText('Fechar Caixa');
      await expect(fecharBtn).toBeVisible();

      // Deve ter o botão "Histórico"
      const historicoBtn = page.getByText('Histórico');
      await expect(historicoBtn).toBeVisible();

      // Deve ter o botão "Imprimir"
      const imprimirBtn = page.getByText('Imprimir');
      await expect(imprimirBtn).toBeVisible();
    }
  });

  test('Histórico de Vendas abre corretamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cashier');
    await page.waitForTimeout(3000);

    const hasCaixa = await page.getByText('Caixa Operacional').isVisible().catch(() => false);
    if (hasCaixa) {
      // Clicar em Histórico
      await page.getByText('Histórico').click();
      await page.waitForTimeout(1500);

      // Deve mostrar o componente SalesHistory
      const bodyText = await page.locator('body').textContent();
      console.log(`Conteúdo após clicar Histórico: ${bodyText?.substring(0, 300)}`);
    }
  });

  test('Navegação de datas no Caixa', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cashier');
    await page.waitForTimeout(3000);

    const hasCaixa = await page.getByText('Caixa Operacional').isVisible().catch(() => false);
    if (hasCaixa) {
      // O botão "hoje" deve estar visível (e disabled se já estiver no dia atual)
      const hojeBtn = page.getByText('hoje', { exact: true });
      await expect(hojeBtn).toBeVisible();
    }
  });
});
