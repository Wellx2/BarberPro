import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  module: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  issues: string[];
}

const results: ValidationResult[] = [];

const REQUIRED_DTOS = ['create', 'update'];
const CRITICAL_MODULES = [
  'auth',
  'products',
  'services',
  'barbers',
  'clients',
  'appointments',
  'users',
  'barbershops'
];

function checkDTOFiles(modulePath: string, moduleName: string): ValidationResult {
  const result: ValidationResult = {
    module: moduleName,
    status: 'PASS',
    issues: []
  };

  const dtoPath = path.join(modulePath, 'dto');

  if (!fs.existsSync(dtoPath)) {
    result.status = 'FAIL';
    result.issues.push('Pasta dto/ não encontrada');
    return result;
  }

  const files = fs.readdirSync(dtoPath);

  // Verificar create-*.dto.ts
  const createDto = files.find(f => f.startsWith('create-') && f.endsWith('.dto.ts'));
  if (!createDto) {
    result.issues.push('❌ create-*.dto.ts não encontrado');
    result.status = 'FAIL';
  } else {
    result.issues.push(`✅ ${createDto} encontrado`);
  }

  // Verificar update-*.dto.ts
  const updateDto = files.find(f => f.startsWith('update-') && f.endsWith('.dto.ts'));
  if (!updateDto) {
    result.issues.push('⚠️  update-*.dto.ts não encontrado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else {
    result.issues.push(`✅ ${updateDto} encontrado`);
  }

  // Verificar arquivo de validação do DTO
  if (createDto) {
    const createDtoPath = path.join(dtoPath, createDto);
    const content = fs.readFileSync(createDtoPath, 'utf-8');

    // Verificar imports essenciais
    if (!content.includes('class-validator')) {
      result.issues.push('⚠️  class-validator não importado em create DTO');
      if (result.status !== 'FAIL') result.status = 'WARN';
    }

    // Verificar decorators de validação
    const hasValidators = 
      content.includes('@IsString') ||
      content.includes('@IsNotEmpty') ||
      content.includes('@IsNumber') ||
      content.includes('@IsBoolean') ||
      content.includes('@IsEmail');

    if (!hasValidators) {
      result.issues.push('❌ Nenhum decorator de validação encontrado');
      result.status = 'FAIL';
    } else {
      result.issues.push('✅ Decorators de validação presentes');
    }

    // Verificar ApiProperty para Swagger
    if (!content.includes('@ApiProperty')) {
      result.issues.push('⚠️  @ApiProperty não usado (Swagger incompleto)');
      if (result.status !== 'FAIL') result.status = 'WARN';
    } else {
      result.issues.push('✅ ApiProperty configurado');
    }
  }

  return result;
}

function checkControllerGuards(modulePath: string, moduleName: string): ValidationResult {
  const result: ValidationResult = {
    module: `${moduleName} (Controller)`,
    status: 'PASS',
    issues: []
  };

  const controllerPath = path.join(modulePath, `${moduleName}.controller.ts`);

  if (!fs.existsSync(controllerPath)) {
    result.status = 'WARN';
    result.issues.push('Controller não encontrado');
    return result;
  }

  const content = fs.readFileSync(controllerPath, 'utf-8');

  // Verificar guards de segurança
  if (!content.includes('JwtAuthGuard')) {
    result.issues.push('⚠️  JwtAuthGuard não aplicado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else {
    result.issues.push('✅ JwtAuthGuard aplicado');
  }

  if (!content.includes('RolesGuard')) {
    result.issues.push('⚠️  RolesGuard não aplicado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else {
    result.issues.push('✅ RolesGuard aplicado');
  }

  if (!content.includes('TenantGuard') && moduleName !== 'auth') {
    result.issues.push('⚠️  TenantGuard não aplicado (risco de vazamento de dados)');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else if (content.includes('TenantGuard')) {
    result.issues.push('✅ TenantGuard aplicado');
  }

  // Verificar @Roles decorator
  if (!content.includes('@Roles') && moduleName !== 'auth') {
    result.issues.push('⚠️  @Roles decorator não usado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else if (content.includes('@Roles')) {
    result.issues.push('✅ @Roles decorator configurado');
  }

  // Verificar ApiTags para Swagger
  if (!content.includes('@ApiTags')) {
    result.issues.push('⚠️  @ApiTags não configurado (Swagger incompleto)');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else {
    result.issues.push('✅ ApiTags configurado');
  }

  return result;
}

function checkServiceValidation(modulePath: string, moduleName: string): ValidationResult {
  const result: ValidationResult = {
    module: `${moduleName} (Service)`,
    status: 'PASS',
    issues: []
  };

  const servicePath = path.join(modulePath, `${moduleName}.service.ts`);

  if (!fs.existsSync(servicePath)) {
    result.status = 'WARN';
    result.issues.push('Service não encontrado');
    return result;
  }

  const content = fs.readFileSync(servicePath, 'utf-8');

  // Verificar validação de tenant em métodos
  if (!content.includes('shopId') && moduleName !== 'auth') {
    result.issues.push('⚠️  Validação de shopId pode estar ausente');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else if (content.includes('shopId')) {
    result.issues.push('✅ Validação de tenant presente');
  }

  // Verificar se usa ForbiddenException
  if (!content.includes('ForbiddenException') && moduleName !== 'auth') {
    result.issues.push('⚠️  ForbiddenException não usado (validação de acesso)');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else if (content.includes('ForbiddenException')) {
    result.issues.push('✅ ForbiddenException usado corretamente');
  }

  // Verificar NotFoundException
  if (!content.includes('NotFoundException')) {
    result.issues.push('⚠️  NotFoundException não usado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  } else {
    result.issues.push('✅ NotFoundException usado');
  }

  // Verificar if audit log é registrado (CREATE, UPDATE, REMOVE)
  if (content.includes('auditLog.create') || content.includes('logAction')) {
    result.issues.push('✅ Sistema de auditoria implementado');
  } else if (moduleName !== 'auth') {
    result.issues.push('⚠️  Sistema de auditoria pode não estar implementado');
    if (result.status !== 'FAIL') result.status = 'WARN';
  }

  return result;
}

function main() {
  console.log('🔍 Análise de DTOs e Validações - KlypBarber Backend\\n');
  console.log('='.repeat(70));

  const srcPath = path.join(__dirname, '..', 'src');

  for (const moduleName of CRITICAL_MODULES) {
    const modulePath = path.join(srcPath, moduleName);

    if (!fs.existsSync(modulePath)) {
      results.push({
        module: moduleName,
        status: 'FAIL',
        issues: [`Módulo ${moduleName} não encontrado em src/`]
      });
      continue;
    }

    console.log(`\n📦 Analisando módulo: ${moduleName.toUpperCase()}`);
    console.log('-'.repeat(70));

    // Verificar DTOs
    const dtoResult = checkDTOFiles(modulePath, moduleName);
    results.push(dtoResult);
    console.log('\n📋 DTOs:');
    dtoResult.issues.forEach(issue => console.log(`   ${issue}`));

    // Verificar Controller Guards
    const guardResult = checkControllerGuards(modulePath, moduleName);
    results.push(guardResult);
    console.log('\n🛡️  Guards e Segurança:');
    guardResult.issues.forEach(issue => console.log(`   ${issue}`));

    // Verificar Service Validation
    const serviceResult = checkServiceValidation(modulePath, moduleName);
    results.push(serviceResult);
    console.log('\n🔐 Service Validations:');
    serviceResult.issues.forEach(issue => console.log(`   ${issue}`));
  }

  // Relatório final
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('📊 RESUMO DA ANÁLISE DE VALIDAÇÕES');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  console.log(`\n✅ PASS: ${passed}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⚠️  WARN: ${warnings}`);

  // Listar problemas críticos
  const criticalIssues = results.filter(r => r.status === 'FAIL');
  if (criticalIssues.length > 0) {
    console.log('\n\n❌ PROBLEMAS CRÍTICOS ENCONTRADOS:\n');
    criticalIssues.forEach(issue => {
      console.log(`   Módulo: ${issue.module}`);
      issue.issues.forEach(i => console.log(`      - ${i}`));
      console.log('');
    });
  }

  // Listar avisos
  const warningIssues = results.filter(r => r.status === 'WARN');
  if (warningIssues.length > 0) {
    console.log('\n⚠️  AVISOS (Recomendações de Melhoria):\n');
    warningIssues.forEach(issue => {
      console.log(`   Módulo: ${issue.module}`);
      issue.issues.filter(i => i.includes('⚠️')).forEach(i => console.log(`      - ${i}`));
      console.log('');
    });
  }

  console.log('\n' + '='.repeat(70));

  if (failed > 0) {
    console.log('❌ AÇÃO NECESSÁRIA: Corrija os problemas críticos imediatamente!');
    process.exit(1);
  } else if (warnings > 5) {
    console.log('⚠️  Há vários avisos. Considere implementar as melhorias sugeridas.');
  } else {
    console.log('✅ Sistema de validações bem implementado!');
  }
}

main();
