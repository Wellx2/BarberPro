import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando serviços no banco...\n');
  
  // Buscar todas as barbearias
  const shops = await prisma.barbershop.findMany({
    select: { id: true, name: true },
  });

  if (shops.length === 0) {
    console.log('❌ Nenhuma barbearia encontrada! Execute: npm run prisma:seed');
    return;
  }

  console.log(`📍 ${shops.length} barbearia(s) encontrada(s)\n`);

  for (const shop of shops) {
    const services = await prisma.service.findMany({
      where: { shopId: shop.id, active: true },
    });
    
    console.log(`\n🏪 ${shop.name} (ID: ${shop.id.substring(0, 8)}...)`);
    console.log(`   📊 Total de serviços: ${services.length}\n`);
    
    if (services.length > 0) {
      services.slice(0, 5).forEach((service, idx) => {
        console.log(`   ${idx + 1}. ${service.name}`);
        console.log(`      💰 R$ ${service.price.toFixed(2)}`);
        console.log(`      ⏱️  ${service.duration} min`);
        console.log('');
      });
      
      if (services.length > 5) {
        console.log(`   ... e mais ${services.length - 5} serviços\n`);
      }
    } else {
      console.log('   ⚠️  Nenhum serviço encontrado para esta barbearia\n');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
