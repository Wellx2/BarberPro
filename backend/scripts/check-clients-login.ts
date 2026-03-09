import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClientsLogin() {
  console.log('🔍 Verificando usuários clientes criados...\n');

  try {
    // Buscar todos os usuários com role CLIENT
    const clientUsers = await prisma.user.findMany({
      where: {
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shopId: true,
        shop: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { shopId: 'asc' },
        { name: 'asc' },
      ],
    });

    console.log(`✅ Total de usuários clientes: ${clientUsers.length}\n`);

    if (clientUsers.length === 0) {
      console.log('⚠️  Nenhum usuário cliente encontrado!');
      return;
    }

    // Agrupar por barbearia
    const byShop = clientUsers.reduce((acc, user) => {
      const shopName = user.shop.name;
      if (!acc[shopName]) {
        acc[shopName] = [];
      }
      acc[shopName].push(user);
      return acc;
    }, {} as Record<string, typeof clientUsers>);

    // Mostrar por barbearia
    for (const [shopName, users] of Object.entries(byShop)) {
      console.log(`🏪 ${shopName} (${users.length} clientes com login):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      🔑 Senha: senha123`);
        console.log(`      🎫 Role: ${user.role}`);
        console.log('');
      });
    }

    // Teste de login simulado
    console.log('\n🧪 Testando hash de senha...');
    const bcrypt = require('bcrypt');
    const testPassword = 'senha123';
    const testUser = clientUsers[0];
    
    const userWithHash = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { passwordHash: true },
    });

    if (userWithHash?.passwordHash) {
      const isValid = await bcrypt.compare(testPassword, userWithHash.passwordHash);
      console.log(`   ✅ Senha "${testPassword}" ${isValid ? 'válida' : 'inválida'} para ${testUser.name}`);
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📝 Use essas credenciais para testar login de cliente:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: { "email": "roberto@email.com", "password": "senha123" }');

  } catch (error) {
    console.error('❌ Erro ao verificar clientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientsLogin();
