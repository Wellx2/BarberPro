const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const shops = await prisma.barbershop.count();
    const users = await prisma.user.count();
    const services = await prisma.service.count();
    const products = await prisma.product.count();
    const barbers = await prisma.barber.count();
    
    console.log('--- Database Count ---');
    console.log('Barbearias:', shops);
    console.log('Usuários:', users);
    console.log('Serviços:', services);
    console.log('Produtos:', products);
    console.log('Barbeiros:', barbers);
    console.log('----------------------');
    
    if (shops > 0) {
      const firstShop = await prisma.barbershop.findFirst();
      console.log('Primeira Barbearia:', firstShop.name, 'ID:', firstShop.id);
    }
  } catch (err) {
    console.error('Erro ao verificar dados:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
