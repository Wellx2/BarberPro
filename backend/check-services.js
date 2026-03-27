const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkServices() {
  const shopId = '46fd2604-1d7f-4943-96f6-7a69523738d8';
  try {
    const services = await prisma.service.findMany({
      where: { shopId },
      select: { id: true, name: true, active: true, deletedAt: true }
    });
    
    console.log(`--- Serviços para Shop ${shopId} ---`);
    console.log('Total encontrados:', services.length);
    if (services.length > 0) {
      console.log('Exemplos:', services.slice(0, 5));
    }
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkServices();
