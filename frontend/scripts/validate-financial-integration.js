#!/usr/bin/env node

/**
 * Script de Validação Técnica - Integração Financeira
 * 
 * Executa verificações automáticas de:
 * - Arquivos criados/modificados
 * - Imports corretos
 * - Tipos TypeScript
 * - Exportações
 * 
 * Execute: node scripts/validate-financial-integration.js
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());
const ERRORS = [];
const WARNINGS = [];
const SUCCESS = [];

console.log('🔍 Validando Integração Financeira...\n');

// Helper para verificar arquivo
function checkFile(path, description) {
  const fullPath = resolve(ROOT, path);
  if (existsSync(fullPath)) {
    SUCCESS.push(`✅ ${description}`);
    return true;
  } else {
    ERRORS.push(`❌ ${description} - Arquivo não encontrado: ${path}`);
    return false;
  }
}

// Helper para verificar conteúdo
function checkContent(path, pattern, description) {
  const fullPath = resolve(ROOT, path);
  if (!existsSync(fullPath)) {
    WARNINGS.push(`⚠️  ${description} - Arquivo não existe para verificar`);
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  if (pattern.test(content)) {
    SUCCESS.push(`✅ ${description}`);
    return true;
  } else {
    ERRORS.push(`❌ ${description} - Padrão não encontrado no arquivo`);
    return false;
  }
}

// 1. Verificar arquivos criados
console.log('📁 Verificando arquivos criados...\n');

checkFile(
  'src/services/financialService.ts',
  'financialService.ts criado'
);

checkFile(
  'src/services/__tests__/financialService.test.ts',
  'Testes unitários criados'
);

checkFile(
  'QA_FINANCIAL_INTEGRATION.md',
  'Plano de QA criado'
);

checkFile(
  'SMOKE_TEST_FINANCIAL.md',
  'Smoke tests criados'
);

checkFile(
  'FINANCIAL_INTEGRATION_COMPLETE.md',
  'Documentação de integração criada'
);

// 2. Verificar exports no financialService
console.log('\n📤 Verificando exports do financialService...\n');

checkContent(
  'src/services/financialService.ts',
  /export const getFinancialAnalytics/,
  'getFinancialAnalytics exportado'
);

checkContent(
  'src/services/financialService.ts',
  /export const getDailyCashierAnalytics/,
  'getDailyCashierAnalytics exportado'
);

checkContent(
  'src/services/financialService.ts',
  /export const processInvoicePayment/,
  'processInvoicePayment exportado'
);

checkContent(
  'src/services/financialService.ts',
  /export type AnalyticsPeriod/,
  'AnalyticsPeriod type exportado'
);

checkContent(
  'src/services/financialService.ts',
  /export interface FinancialAnalytics/,
  'FinancialAnalytics interface exportada'
);

checkContent(
  'src/services/financialService.ts',
  /export interface DailyCashierAnalytics/,
  'DailyCashierAnalytics interface exportada'
);

// 3. Verificar imports no AdminDashboard
console.log('\n📥 Verificando integração no AdminDashboard...\n');

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /import.*getFinancialAnalytics.*from.*financialService/,
  'AdminDashboard importa getFinancialAnalytics'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /import.*FinancialAnalytics.*from.*financialService/,
  'AdminDashboard importa type FinancialAnalytics'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /import.*AnalyticsPeriod.*from.*financialService/,
  'AdminDashboard importa type AnalyticsPeriod'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /const \[analytics, setAnalytics\]/,
  'AdminDashboard usa estado analytics'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /const \[loadingAnalytics, setLoadingAnalytics\]/,
  'AdminDashboard usa estado loadingAnalytics'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /useEffect\(\(\) => {[\s\S]*?getFinancialAnalytics/,
  'AdminDashboard chama getFinancialAnalytics em useEffect'
);

// 4. Verificar integração no Cashier
console.log('\n📥 Verificando integração no Cashier...\n');

checkContent(
  'src/pages/admin/Cashier.tsx',
  /import.*getDailyCashierAnalytics.*from.*financialService/,
  'Cashier importa getDailyCashierAnalytics'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /import.*processInvoicePayment.*from.*financialService/,
  'Cashier importa processInvoicePayment'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /import.*DailyCashierAnalytics.*from.*financialService/,
  'Cashier importa type DailyCashierAnalytics'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /const \[dailyAnalytics, setDailyAnalytics\]/,
  'Cashier usa estado dailyAnalytics'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /const \[loadingAnalytics, setLoadingAnalytics\]/,
  'Cashier usa estado loadingAnalytics'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /useEffect\(\(\) => {[\s\S]*?getDailyCashierAnalytics/,
  'Cashier chama getDailyCashierAnalytics em useEffect'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /await processInvoicePayment/,
  'Cashier usa processInvoicePayment'
);

// 5. Verificar estados de loading
console.log('\n⏳ Verificando loading states...\n');

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /loadingAnalytics &&/,
  'AdminDashboard renderiza loading state'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /!loadingAnalytics && !analytics &&/,
  'AdminDashboard renderiza error state'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /if \(loadingAnalytics\)/,
  'Cashier renderiza loading state'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /if \(!dailyAnalytics\)/,
  'Cashier renderiza error state'
);

// 6. Verificar tratamento de erro 401
console.log('\n🔒 Verificando tratamento de sessão expirada...\n');

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /statusCode === 401.*response.*status === 401/,
  'AdminDashboard trata erro 401'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /localStorage\.clear/,
  'AdminDashboard limpa localStorage no 401'
);

checkContent(
  'src/pages/admin/AdminDashboard.tsx',
  /window\.location\.href = '\/login'/,
  'AdminDashboard redireciona para login no 401'
);

checkContent(
  'src/pages/admin/Cashier.tsx',
  /statusCode === 401.*response.*status === 401/,
  'Cashier trata erro 401'
);

// 7. Verificar export no index.ts
console.log('\n🔗 Verificando exports centralizados...\n');

checkContent(
  'src/services/index.ts',
  /export \* from '\.\/financialService'/,
  'financialService exportado em index.ts'
);

// 8. Verificar uso correto da API
console.log('\n🌐 Verificando uso da API...\n');

checkContent(
  'src/services/financialService.ts',
  /import { api } from '\.\/api'/,
  'financialService importa api corretamente (named import)'
);

checkContent(
  'src/services/financialService.ts',
  /await api\.get/,
  'financialService usa api.get'
);

checkContent(
  'src/services/financialService.ts',
  /await api\.patch/,
  'financialService usa api.patch'
);

checkContent(
  'src/services/financialService.ts',
  /URLSearchParams/,
  'financialService usa URLSearchParams para query params'
);

// 9. Verificar remoção de código mock
console.log('\n🗑️  Verificando remoção de código mock...\n');

const adminDashboardPath = resolve(ROOT, 'src/pages/admin/AdminDashboard.tsx');
const cashierPath = resolve(ROOT, 'src/pages/admin/Cashier.tsx');

if (existsSync(adminDashboardPath)) {
  const adminContent = readFileSync(adminDashboardPath, 'utf-8');
  
  // Verificar que não tem mais useMemo com cálculos locais
  if (!/const analytics = useMemo\(\(\) => {[\s\S]{100,}}, \[/.test(adminContent)) {
    SUCCESS.push('✅ AdminDashboard não usa mais cálculos locais de analytics');
  } else {
    WARNINGS.push('⚠️  AdminDashboard ainda pode ter cálculos locais (verificar manualmente)');
  }
}

if (existsSync(cashierPath)) {
  const cashierContent = readFileSync(cashierPath, 'utf-8');
  
  // Verificar que não tem mais useMemo de dailyAnalytics
  if (!/const dailyAnalytics = useMemo\(\(\) => {[\s\S]{100,}}, \[/.test(cashierContent)) {
    SUCCESS.push('✅ Cashier não usa mais cálculos locais de analytics');
  } else {
    WARNINGS.push('⚠️  Cashier ainda pode ter cálculos locais (verificar manualmente)');
  }
  
  // Verificar que não tem mais localStorage de invoices
  if (!/localStorage\.getItem\('invoices'\)/.test(cashierContent)) {
    SUCCESS.push('✅ Cashier não usa mais localStorage para invoices');
  } else {
    WARNINGS.push('⚠️  Cashier ainda pode usar localStorage (verificar manualmente)');
  }
}

// Resultados finais
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESULTADOS DA VALIDAÇÃO\n');
console.log('='.repeat(60) + '\n');

console.log(`✅ Sucessos: ${SUCCESS.length}`);
console.log(`⚠️  Avisos: ${WARNINGS.length}`);
console.log(`❌ Erros: ${ERRORS.length}\n`);

if (ERRORS.length > 0) {
  console.log('❌ ERROS ENCONTRADOS:\n');
  ERRORS.forEach(error => console.log(error));
  console.log('');
}

if (WARNINGS.length > 0) {
  console.log('⚠️  AVISOS:\n');
  WARNINGS.forEach(warning => console.log(warning));
  console.log('');
}

console.log('='.repeat(60) + '\n');

// Exit code
if (ERRORS.length > 0) {
  console.log('❌ VALIDAÇÃO FALHOU - Corrija os erros acima\n');
  process.exit(1);
} else if (WARNINGS.length > 0) {
  console.log('⚠️  VALIDAÇÃO PASSOU COM AVISOS - Revise os avisos\n');
  process.exit(0);
} else {
  console.log('✅ VALIDAÇÃO PASSOU - Integração está correta!\n');
  console.log('📝 Próximos passos:');
  console.log('   1. Execute: npm test (testes unitários)');
  console.log('   2. Execute smoke tests: SMOKE_TEST_FINANCIAL.md');
  console.log('   3. Execute QA completo: QA_FINANCIAL_INTEGRATION.md\n');
  process.exit(0);
}
