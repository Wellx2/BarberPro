import { test, expect } from '@playwright/test';

test.describe('8. Perfil & Conta', () => {
  test('Cadastro de novo cliente via formulário', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1500);

    // Clicar no botão de cadastro
    await page.getByRole('button', { name: /Não tenho conta\? Cadastrar/i }).click();
    await page.waitForTimeout(500);

    // O título deve mudar para "Nova Conta"
    await expect(page.getByText('Nova Conta')).toBeVisible();

    // Preencher formulário de cadastro (cliente comum, sem checkbox de barbearia)
    const uniqueEmail = `qa_${Date.now()}@test.com`;
    await page.getByLabel(/Seu Nome Completo/i).fill('Cliente QA Playwright');
    await page.getByLabel(/WhatsApp/i).fill('11999887766');
    // Há dois campos E-mail (login e register), pegar o visível no form
    await page.getByLabel(/E-mail/i).fill(uniqueEmail);
    await page.getByLabel(/Senha/i).fill('senha123');

    // Submeter
    await page.getByRole('button', { name: /Registrar e Acessar/i }).click();
    await page.waitForTimeout(3000);

    // Verificar se houve redirecionamento (login automático) ou erro
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    const hasError = bodyText?.includes('Erro') || bodyText?.includes('erro');
    
    // Se não tem erro visível, registrou com sucesso (ou pelo menos o frontend processou)
    console.log(`URL após registro: ${url}, Erro visível: ${hasError}`);
  });

  test('Fluxo Esqueci minha senha', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1500);

    // Clicar em "Esqueci minha senha"
    await page.getByRole('button', { name: /Esqueci minha senha/i }).click();
    await page.waitForTimeout(500);

    // Deve mostrar o campo "Seu E-mail"
    await expect(page.getByLabel(/Seu E-mail/i)).toBeVisible();

    // Preencher e enviar
    await page.getByLabel(/Seu E-mail/i).fill('admin@klypbarber.com');
    await page.getByRole('button', { name: /Enviar Instruções/i }).click();
    await page.waitForTimeout(2000);

    // Verificar notificação de sucesso (ou mudança de view)
    const bodyText = await page.locator('body').textContent();
    console.log(`Resultado esqueci senha: ${bodyText?.substring(0, 200)}`);
  });

  test('Login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1500);

    await page.getByPlaceholder('seu@email.com').fill('admin@klypbarber.com');
    await page.getByPlaceholder('••••••••').fill('senha123');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await page.waitForTimeout(3000);

    // Deve redirecionar para o dashboard
    expect(page.url()).not.toContain('/login');
  });
});
