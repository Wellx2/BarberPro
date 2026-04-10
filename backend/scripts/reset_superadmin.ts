import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_SALT = 12;

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@klypbarber.com';
  const newPassword = process.env.NEW_PASSWORD || 'Admin@2026'; // Senha padrão para o teste

  console.log(`🔑 Resetando senha do Super Admin: ${email}...`);

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true
    },
    create: {
      email,
      name: 'Super Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      phone: '(00) 00000-0000'
    }
  });

  console.log(`✅ Super Admin resetado com sucesso!`);
  console.log(`📧 Login: ${user.email}`);
  console.log(`🔑 Senha: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
