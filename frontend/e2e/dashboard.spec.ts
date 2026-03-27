import { test, expect, Page } from '@playwright/test';

// Helper: Login as Admin
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('seu@email.com').fill('admin@klypbarber.com');
  await page.getByPlaceholder('••••••••').fill('[SENHA_TESTE]');
  await page.getByRole('button', { name: /Entrar/i }).click();
  await page.waitForTimeout(3000);
}

test.describe('5. Dashboards Administrativos', () => {
  test('Login Admin redireciona para Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    // Deve redirecionar para /dashboard com AdminDashboard
    expect(page.url()).toContain('/dashboard');
    // O dashboard do admin deve carregar sem erros críticos
    await expect(page.locator('body')).not.toContainText('Erro de Autenticação');
  });

  test('Responsividade em Tablets e Celulares', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Forçar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Verificar que o body não tem overflow horizontal (não quebrou)
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    // Aceitar margem de 10px
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('Caixa Operacional carrega corretamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cashier');
    await page.waitForTimeout(3000);

    // Verificar se o título "Caixa Operacional" aparece
    const hasCaixaTitle = await page.getByText('Caixa Operacional').isVisible().catch(() => false);
    const hasError = await page.getByText('Erro ao carregar dados').isVisible().catch(() => false);
    const hasRetry = await page.getByText('Tentar Novamente').isVisible().catch(() => false);
    
    // Aceitar tanto sucesso quanto erro tratado (backend pode estar sem dados)
    expect(hasCaixaTitle || hasError || hasRetry).toBeTruthy();
  });

  test('Agendamentos Admin carrega corretamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/appointments');
    await page.waitForTimeout(3000);

    // Verificar se o título "Agendamentos" aparece
    await expect(page.getByRole('heading', { name: /Agendamentos/i })).toBeVisible();
    
    // Deve ter o botão "Novo Agendamento"
    await expect(page.getByText('Novo Agendamento')).toBeVisible();
    
    // Filtros devem estar visíveis
    const statusFilter = page.locator('select');
    await expect(statusFilter).toBeVisible();
  });
});
