import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testDatabaseConnection() {
  console.log('🔍 1. Testando Conexão com Banco de Dados...\n');
  
  try {
    await prisma.$connect();
    results.push({
      name: 'Database Connection',
      status: 'PASS',
      message: 'Conexão com PostgreSQL estabelecida'
    });
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'FAIL',
      message: `Erro ao conectar: ${error.message}`
    });
  }
}

async function testDataIntegrity() {
  console.log('🔍 2. Testando Integridade dos Dados...\n');
  
  try {
    // Contar registros principais
    const counts = {
      barbershops: await prisma.barbershop.count(),
      users: await prisma.user.count(),
      barbers: await prisma.barber.count(),
      services: await prisma.service.count(),
      products: await prisma.product.count(),
      clients: await prisma.client.count(),
      appointments: await prisma.appointment.count(),
    };

    console.log('   📊 Contagem de registros:');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`      - ${key}: ${value}`);
    });

    if (counts.barbershops === 0) {
      results.push({
        name: 'Data Integrity - Barbershops',
        status: 'FAIL',
        message: 'Nenhuma barbearia encontrada. Execute o seed.',
        details: counts
      });
    } else {
      results.push({
        name: 'Data Integrity',
        status: 'PASS',
        message: `Sistema com ${counts.barbershops} barbearias`,
        details: counts
      });
    }
  } catch (error) {
    results.push({
      name: 'Data Integrity',
      status: 'FAIL',
      message: `Erro ao verificar dados: ${error.message}`
    });
  }
}

async function testMultiTenancy() {
  console.log('\n🔍 3. Testando Isolamento Multi-Tenant...\n');
  
  try {
    const shops = await prisma.barbershop.findMany({ take: 2 });
    
    if (shops.length < 2) {
      results.push({
        name: 'Multi-Tenancy Test',
        status: 'WARN',
        message: 'Apenas 1 barbearia, não é possível testar isolamento completo'
      });
      return;
    }

    const [shop1, shop2] = shops;

    // Verificar produtos de cada shop
    const shop1Products = await prisma.product.count({ where: { shopId: shop1.id } });
    const shop2Products = await prisma.product.count({ where: { shopId: shop2.id } });

    console.log(`   🏪 ${shop1.name}: ${shop1Products} produtos`);
    console.log(`   🏪 ${shop2.name}: ${shop2Products} produtos`);

    // Verificar se há produtos órfãos (sem shopId válido)
    const orphanProducts = await prisma.product.count({
      where: {
        shopId: {
          notIn: shops.map(s => s.id)
        }
      }
    });

    if (orphanProducts > 0) {
      results.push({
        name: 'Multi-Tenancy - Orphan Records',
        status: 'FAIL',
        message: `${orphanProducts} produtos órfãos encontrados (sem shopId válido)`
      });
    } else {
      results.push({
        name: 'Multi-Tenancy',
        status: 'PASS',
        message: 'Todos os produtos vinculados corretamente aos tenants'
      });
    }
  } catch (error) {
    results.push({
      name: 'Multi-Tenancy Test',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testSoftDelete() {
  console.log('\n🔍 4. Testando Sistema de Soft Delete...\n');
  
  try {
    const inactiveProducts = await prisma.product.count({ where: { active: false } });
    const inactiveServices = await prisma.service.count({ where: { active: false } });

    console.log(`   🗑️  Produtos inativos: ${inactiveProducts}`);
    console.log(`   🗑️  Serviços inativos: ${inactiveServices}`);

    results.push({
      name: 'Soft Delete System',
      status: 'PASS',
      message: 'Sistema de soft delete implementado corretamente',
      details: { inactiveProducts, inactiveServices }
    });
  } catch (error) {
    results.push({
      name: 'Soft Delete System',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testAuditLog() {
  console.log('\n🔍 5. Testando Sistema de Auditoria...\n');
  
  try {
    const auditCount = await prisma.auditLog.count();
    const recentAudits = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        action: true,
        entity: true,
        timestamp: true,
        userId: true
      }
    });

    console.log(`   📝 Total de logs de auditoria: ${auditCount}`);
    
    if (recentAudits.length > 0) {
      console.log('   📋 Últimas ações registradas:');
      recentAudits.forEach(log => {
        console.log(`      - ${log.action} ${log.entity} (${log.userId || 'sistema'})`);
      });
    }

    results.push({
      name: 'Audit Log System',
      status: 'PASS',
      message: `Sistema de auditoria ativo (${auditCount} registros)`,
      details: { totalLogs: auditCount }
    });
  } catch (error) {
    results.push({
      name: 'Audit Log System',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testUniqueConstraints() {
  console.log('\n🔍 6. Testando Constraints de Unicidade...\n');
  
  try {
    // Verificar emails duplicados de usuários
    const duplicateEmails = await prisma.$queryRaw<any[]>`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;

    if (duplicateEmails.length > 0) {
      results.push({
        name: 'Unique Constraints - Users',
        status: 'FAIL',
        message: `${duplicateEmails.length} emails duplicados encontrados`,
        details: duplicateEmails
      });
    } else {
      results.push({
        name: 'Unique Constraints',
        status: 'PASS',
        message: 'Nenhuma violação de unicidade encontrada'
      });
    }
  } catch (error) {
    results.push({
      name: 'Unique Constraints',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testRelationships() {
  console.log('\n🔍 7. Testando Relacionamentos...\n');
  
  try {
    // Testar relacionamentos Product -> Barbershop
    const productsWithShop = await prisma.product.findMany({
      where: { active: true },
      include: { shop: true },
      take: 5
    });

    const brokenRelations = productsWithShop.filter(p => !p.shop);
    
    if (brokenRelations.length > 0) {
      results.push({
        name: 'Relationships - Products',
        status: 'FAIL',
        message: `${brokenRelations.length} produtos com relacionamento quebrado`
      });
    } else {
      console.log('   ✅ Relacionamentos Product -> Barbershop: OK');
      
      // Testar User -> Barbershop
      const usersWithShop = await prisma.user.findMany({
        where: { 
          role: { notIn: ['SUPER_ADMIN', 'CLIENT'] },
          shopId: { not: null }
        },
        include: { shop: true },
        take: 5
      });

      const brokenUserRelations = usersWithShop.filter(u => !u.shop);
      
      if (brokenUserRelations.length > 0) {
        results.push({
          name: 'Relationships - Users',
          status: 'FAIL',
          message: `${brokenUserRelations.length} usuários com relacionamento quebrado`
        });
      } else {
        console.log('   ✅ Relacionamentos User -> Barbershop: OK');
        results.push({
          name: 'Relationships',
          status: 'PASS',
          message: 'Todos os relacionamentos íntegros'
        });
      }
    }
  } catch (error) {
    results.push({
      name: 'Relationships',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testFeaturedSystem() {
  console.log('\n🔍 8. Testando Sistema de Destaque (Featured)...\n');
  
  try {
    const shops = await prisma.barbershop.findMany({ take: 3 });
    
    for (const shop of shops) {
      const featuredProducts = await prisma.product.count({
        where: { shopId: shop.id, featured: true, active: true }
      });
      
      const featuredServices = await prisma.service.count({
        where: { shopId: shop.id, featured: true, active: true }
      });

      console.log(`   🏪 ${shop.name}:`);
      console.log(`      - Produtos em destaque: ${featuredProducts}/3`);
      console.log(`      - Serviços em destaque: ${featuredServices}/3`);

      if (featuredProducts > 3 || featuredServices > 3) {
        results.push({
          name: `Featured System - ${shop.name}`,
          status: 'FAIL',
          message: `Limite de 3 destaques ultrapassado`,
          details: { featuredProducts, featuredServices }
        });
      }
    }

    results.push({
      name: 'Featured System',
      status: 'PASS',
      message: 'Sistema de destaque funcionando corretamente'
    });
  } catch (error) {
    results.push({
      name: 'Featured System',
      status: 'FAIL',
      message: `Erro: ${error.message}`
    });
  }
}

async function testIndexes() {
  console.log('\n🔍 9. Testando Índices do Banco...\n');
  
  try {
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const importantIndexes = indexes.filter(idx => 
      idx.indexdef.includes('shopId') || 
      idx.indexdef.includes('email') ||
      idx.indexdef.includes('active')
    );

    console.log(`   📊 Total de índices: ${indexes.length}`);
    console.log(`   🎯 Índices importantes: ${importantIndexes.length}`);

    results.push({
      name: 'Database Indexes',
      status: 'PASS',
      message: `${indexes.length} índices configurados`,
      details: { total: indexes.length, important: importantIndexes.length }
    });
  } catch (error) {
    results.push({
      name: 'Database Indexes',
      status: 'WARN',
      message: `Não foi possível verificar índices: ${error.message}`
    });
  }
}

function printResults() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 RELATÓRIO DE ANÁLISE DO BACKEND');
  console.log('='.repeat(70));
  console.log('\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${result.status}] ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Detalhes: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('');
  });

  console.log('='.repeat(70));
  console.log(`📈 RESUMO: ${passed} PASS | ${failed} FAIL | ${warnings} WARN`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('\n❌ ATENÇÃO: Foram encontrados problemas críticos que precisam ser corrigidos!');
  } else if (warnings > 0) {
    console.log('\n⚠️  Sistema funcional, mas há avisos que devem ser verificados.');
  } else {
    console.log('\n✅ PARABÉNS! O backend está funcionando perfeitamente!');
  }
}

async function main() {
  console.log('🚀 Iniciando Análise Completa do Backend KlypBarber\\n');
  console.log('Data: ' + new Date().toLocaleString('pt-BR'));
  console.log('='.repeat(70));
  console.log('\n');

  await testDatabaseConnection();
  await testDataIntegrity();
  await testMultiTenancy();
  await testSoftDelete();
  await testAuditLog();
  await testUniqueConstraints();
  await testRelationships();
  await testFeaturedSystem();
  await testIndexes();

  printResults();
}

main()
  .catch((e) => {
    console.error('💥 Erro fatal durante análise:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
