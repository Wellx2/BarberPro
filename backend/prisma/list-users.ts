import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Buscando usuários no banco de dados...\n');
  
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true
    }
  });

  if (users.length === 0) {
    console.log('⚠️ Nenhum usuário encontrado no banco de dados.');
  } else {
    console.log('📋 Lista de Usuários Encontrados:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Nome: ${user.name}`);
    });
  }

  await prisma.$disconnect();
}

main();
