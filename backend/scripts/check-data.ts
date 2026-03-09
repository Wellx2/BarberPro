import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🏪 BARBEARIAS CADASTRADAS E SEUS DADOS\n');
  console.log('='.repeat(80));

  try {
    const shops = await prisma.barbershop.findMany({
      include: {
        _count: {
          select: {
            services: true,
            products: true,
            barbers: true,
            clients: true,
            appointments: true,
            users: true,
            serviceOrders: true,
            expenses: true,
          },
        },
        services: {
          take: 5,
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            featured: true,
          },
          orderBy: { name: 'asc' },
        },
        products: {
          take: 3,
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            featured: true,
          },
          orderBy: { name: 'asc' },
        },
        barbers: {
          take: 2,
          where: { active: true },
          select: {
            id: true,
            name: true,
            nickname: true,
            workModel: true,
            monthlySalary: true,
            chairRentalFee: true,
            rating: true,
            experienceYears: true,
          },
        },
      },
    });

    for (const shop of shops) {
      console.log(`\n📍 ${shop.name}`);
      console.log('-'.repeat(80));
      
      // Informações básicas
      console.log('\n📋 Informações Básicas:');
      console.log(`   ID: ${shop.id}`);
      console.log(`   Status: ${shop.active ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`   Email: ${shop.email}`);
      console.log(`   Telefone: ${shop.phone}`);
      console.log(`   Endereço: ${shop.address}`);
      if (shop.imageUrl) {
        console.log(`   Imagem: ${shop.imageUrl.substring(0, 50)}...`);
      }

      // Plano e módulos
      console.log('\n💎 Plano e Módulos:');
      const modules = await prisma.barbershopModule.findMany({
        where: { shopId: shop.id, enabled: true },
        select: { moduleType: true },
      });
      console.log(`   Módulos ativos: ${modules.map(m => m.moduleType).join(', ')}`);

      // Estatísticas gerais
      console.log('\n📊 Estatísticas:');
      console.log(`   👥 Usuários: ${shop._count.users}`);
      console.log(`   💈 Barbeiros: ${shop._count.barbers}`);
      console.log(`   ✂️  Serviços: ${shop._count.services}`);
      console.log(`   🧴 Produtos: ${shop._count.products}`);
      console.log(`   👨‍🦱 Clientes: ${shop._count.clients}`);
      console.log(`   📅 Agendamentos: ${shop._count.appointments}`);
      console.log(`   🧾 Comandas: ${shop._count.serviceOrders}`);
      console.log(`   💰 Despesas: ${shop._count.expenses}`);

      // 5 Serviços
      console.log(`\n✂️  Serviços (amostra de ${Math.min(5, shop.services.length)}):`);
      shop.services.forEach((service, idx) => {
        console.log(`   ${idx + 1}. ${service.name}`);
        console.log(`      💰 R$ ${service.price.toFixed(2)}`);
        console.log(`      ⏱️  ${service.duration} min`);
        if (service.featured) console.log(`      ⭐ DESTAQUE`);
      });

      // 3 Produtos
      console.log(`\n🧴 Produtos (amostra de ${Math.min(3, shop.products.length)}):`);
      shop.products.forEach((product, idx) => {
        console.log(`   ${idx + 1}. ${product.name}`);
        console.log(`      💰 R$ ${product.price.toFixed(2)}`);
        console.log(`      📦 Estoque: ${product.stock} unidades`);
        if (product.featured) console.log(`      ⭐ DESTAQUE`);
      });

      // 2 Barbeiros
      console.log(`\n💈 Barbeiros (amostra de ${Math.min(2, shop.barbers.length)}):`);
      shop.barbers.forEach((barber, idx) => {
        console.log(`   ${idx + 1}. ${barber.name}${barber.nickname ? ` (${barber.nickname})` : ''}`);
        console.log(`      ⭐ Avaliação: ${barber.rating.toFixed(1)}/5.0`);
        if (barber.experienceYears) {
          console.log(`      📅 Experiência: ${barber.experienceYears} anos`);
        }
        console.log(`      💼 Modelo: ${barber.workModel}`);
        if (barber.monthlySalary) {
          console.log(`      💵 Salário: R$ ${barber.monthlySalary.toFixed(2)}`);
        }
        if (barber.chairRentalFee) {
          console.log(`      💵 Aluguel: R$ ${barber.chairRentalFee.toFixed(2)}`);
        }
      });

      // Dados Financeiros
      console.log('\n💰 Dados Financeiros:');
      
      // Comandas recentes
      const recentOrders = await prisma.serviceOrder.findMany({
        where: { shopId: shop.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          client: { select: { name: true } },
        },
      });
      
      console.log(`   🧾 Últimas 5 comandas:`);
      recentOrders.forEach((order, idx) => {
        console.log(`      ${idx + 1}. #${order.orderNumber} - ${order.client.name}`);
        console.log(`         Status: ${order.status} | Total: R$ ${order.total.toFixed(2)}`);
        console.log(`         Data: ${order.createdAt.toLocaleDateString('pt-BR')}`);
      });

      // Despesas
      const totalExpenses = await prisma.expense.aggregate({
        where: { shopId: shop.id },
        _sum: { amount: true },
      });
      console.log(`\n   💸 Total de despesas registradas: R$ ${(totalExpenses._sum.amount || 0).toFixed(2)}`);

      // Receita total de comandas
      const totalRevenue = await prisma.serviceOrder.aggregate({
        where: { shopId: shop.id, status: 'COMPLETED' },
        _sum: { total: true },
      });
      console.log(`   💵 Receita total (comandas finalizadas): R$ ${(totalRevenue._sum.total || 0).toFixed(2)}`);

      // Comissões
      const commissions = await prisma.barberCommission.count({
        where: { shopId: shop.id, active: true },
      });
      console.log(`   💼 Configurações de comissão ativas: ${commissions}`);

      // Daily Cash Flow (último registro)
      const lastCashFlow = await prisma.dailyCashFlow.findFirst({
        where: { shopId: shop.id },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          totalRevenue: true,
          totalExpenses: true,
          profit: true,
          netRevenue: true,
        },
      });

      if (lastCashFlow) {
        console.log(`\n   📊 Último fechamento diário (${lastCashFlow.date.toLocaleDateString('pt-BR')}):`);
        console.log(`      Receita Bruta: R$ ${lastCashFlow.totalRevenue.toFixed(2)}`);
        console.log(`      Receita Líquida: R$ ${lastCashFlow.netRevenue.toFixed(2)}`);
        console.log(`      Despesas: R$ ${lastCashFlow.totalExpenses.toFixed(2)}`);
        console.log(`      Lucro: R$ ${lastCashFlow.profit.toFixed(2)}`);
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log(`\n✅ Total de barbearias cadastradas: ${shops.length}`);

  } catch (error) {
    console.error('❌ Erro ao consultar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData().catch(console.error);
