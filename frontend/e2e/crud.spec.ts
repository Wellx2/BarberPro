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

test.describe('6. CRUD Operações', () => {
  test('Navegação para página de Agendamentos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/appointments');
    await page.waitForTimeout(2000);

    // O título "Agendamentos" deve estar visível
    await expect(page.getByRole('heading', { name: /Agendamentos/i })).toBeVisible();

    // Pode ter agendamentos existentes ou "Nenhum agendamento encontrado"
    const bodyText = await page.locator('body').textContent();
    const hasAppointments = !bodyText?.includes('Nenhum agendamento encontrado');
    console.log(`Agendamentos encontrados: ${hasAppointments}`);
  });

  test('Navegação para Admin Stock', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/stock');
    await page.waitForTimeout(2000);

    // Verificar que a página carregou sem erros críticos
    await expect(page.locator('body')).not.toContainText('Cannot GET');
  });

  test('Filtros de Agendamentos funcionam', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/appointments');
    await page.waitForTimeout(2000);

    // Selecionar filtro de status "Agendado"
    const statusSelect = page.locator('select');
    await statusSelect.selectOption('SCHEDULED');
    await page.waitForTimeout(1000);

    // Selecionar filtro de status "Concluído"
    await statusSelect.selectOption('COMPLETED');
    await page.waitForTimeout(1000);

    // Resetar filtro
    await statusSelect.selectOption('');
    await page.waitForTimeout(500);

    // Sem erros
    await expect(page.locator('body')).not.toContainText('Cannot GET');
  });
});
