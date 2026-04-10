import { PrismaClient, TeamMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✂️ Iniciando criação de barbeiros...');

  // 1. Encontrar as barbearias pelos nomes conhecidos
  const ozShop = await prisma.barbershop.findFirst({
    where: { name: { contains: 'Oz', mode: 'insensitive' } }
  });

  const jblackShop = await prisma.barbershop.findFirst({
    where: { name: { contains: 'JBlack', mode: 'insensitive' } }
  });

  if (!ozShop || !jblackShop) {
    console.error('❌ Uma ou ambas as barbearias não foram encontradas no banco.');
    process.exit(1);
  }

  console.log(`📍 Barbearia de Oz ID: ${ozShop.id}`);
  console.log(`📍 Studio JBlack ID: ${jblackShop.id}`);

  // 2. Criar Sara na Barbearia de Oz
  // Verificar se já existe por nome + loja antes de criar (idempotência sem ID fixo)
  const saraExisting = await prisma.barber.findFirst({
    where: { shopId: ozShop.id, name: 'Sara' }
  });

  if (!saraExisting) {
    await prisma.barber.create({
      data: {
        // id omitido: Prisma gera UUID automaticamente via @default(uuid())
        shopId: ozShop.id,
        name: 'Sara',
        nickname: 'Sara Oz',
        experienceYears: 5,
        specialties: ['Corte Masculino', 'Degradê'],
        description: 'Especializada em cortes masculinos e degradê, com mais de 5 anos de carreira.',
        active: true,
        role: TeamMemberRole.BARBER
      }
    });
    console.log('✅ Sara (Oz) criada.');
  } else {
    console.log('⚠️  Sara (Oz) já existe, pulando.');
  }

  // 3. Criar Josué no Studio JBlack
  const josueExisting = await prisma.barber.findFirst({
    where: { shopId: jblackShop.id, name: 'Josué' }
  });

  if (!josueExisting) {
    await prisma.barber.create({
      data: {
        // id omitido: Prisma gera UUID automaticamente via @default(uuid())
        shopId: jblackShop.id,
        name: 'Josué',
        nickname: 'Mestre Josué',
        experienceYears: 20,
        specialties: ['Degradê', 'Corte Masculino'],
        description: 'Mestre em cortes de cabelo masculino, especialista em degradê com mais de 20 anos de experiência.',
        active: true,
        role: TeamMemberRole.BARBER
      }
    });
    console.log('✅ Josué (JBlack) criado.');
  } else {
    console.log('⚠️  Josué (JBlack) já existe, pulando.');
  }

  console.log('🎉 Finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
