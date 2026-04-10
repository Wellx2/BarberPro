import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados...');

  // Deleta na ordem correta para respeitar as foreign keys
  await prisma.notificationLog.deleteMany();
  await prisma.serviceProductAnalytics.deleteMany();
  await prisma.dailyCashFlow.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointmentProduct.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.agendaLock.deleteMany();
  await prisma.blockedTime.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productStockMovement.deleteMany();
  await prisma.barberCommission.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fixedCost.deleteMany();
  await prisma.supplyItem.deleteMany();
  await prisma.barbershopAsset.deleteMany();
  await prisma.barbershopModule.deleteMany();
  await prisma.barbershopFaq.deleteMany();
  await prisma.barbershopHeroSettings.deleteMany();
  await prisma.barbershopPlansContent.deleteMany();
  await prisma.favoriteBarbershop.deleteMany();
  await prisma.address.deleteMany();
  await prisma.client.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.product.deleteMany();
  await prisma.serviceDisabledPeriod.deleteMany();
  await prisma.service.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.userShopAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.barbershop.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('✅ Banco limpo com sucesso!');
  console.log('');
  console.log('👤 Criando Super Admin...');

  const passwordHash = await bcrypt.hash('Klyp@Start2026', 12);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@klypbarber.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      active: true,
      emailVerified: true,
    },
  });

  console.log('');
  console.log('✅ Super Admin criado com sucesso!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📧 Email: superadmin@klypbarber.com');
  console.log('  🔑 Senha: Klyp@Start2026');
  console.log('  🆔 ID:   ', superAdmin.id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🚀 Banco pronto para produção!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
