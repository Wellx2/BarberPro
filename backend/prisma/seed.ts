import { PrismaClient, UserRole, AppointmentStatus, BarberWorkModel, CommissionType, OrderStatus, OrderItemType, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_SALT = 12;

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes (cuidado em produção!)
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.serviceOrder.deleteMany(),
    prisma.barberCommission.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.blockedTime.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.service.deleteMany(),
    prisma.barber.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
    prisma.barbershop.deleteMany(),
  ]);

  console.log('✅ Dados antigos removidos\n');

  // ===== BARBEARIA 1: BarberPro Centro =====
  console.log('📍 Criando Barbearia 1: BarberPro Centro...');
  const shop1 = await prisma.barbershop.create({
    data: {
      name: 'BarberPro Centro',
      cnpj: '12345678000190',
      phone: '(11) 98765-4321',
      address: 'Rua Augusta, 1234 - Centro, São Paulo - SP',
      openingTime: '09:00',
      closingTime: '20:00',
      intervalMinutes: 30,
      loyaltyEnabled: true,
      subscriptionEnabled: true,
    },
  });

  // Usuários da Barbearia 1
  console.log('👤 Criando usuários...');
  const passwordHash = await bcrypt.hash('senha123', BCRYPT_SALT);

  const admin1 = await prisma.user.create({
    data: {
      name: 'Carlos Silva',
      email: 'admin@barberpro.com',
      phone: '(11) 98765-4321',
      passwordHash,
      role: UserRole.ADMIN,
      shopId: shop1.id,
    },
  });

  const userBarber1 = await prisma.user.create({
    data: {
      name: 'João Barbeiro',
      email: 'joao@barberpro.com',
      phone: '(11) 98765-1111',
      passwordHash,
      role: UserRole.BARBER,
      shopId: shop1.id,
    },
  });

  const userBarber2 = await prisma.user.create({
    data: {
      name: 'Pedro Navalheiro',
      email: 'pedro@barberpro.com',
      phone: '(11) 98765-2222',
      passwordHash,
      role: UserRole.BARBER,
      shopId: shop1.id,
    },
  });

  // Barbeiros
  console.log('💈 Criando barbeiros...');
  const barber1 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'João Barbeiro',
      nickname: 'Joãozinho',
      description: 'Especialista em cortes clássicos e modernos. 10 anos de experiência.',
      specialties: ['Corte Social', 'Barba', 'Degradê'],
      rating: 4.8,
      experienceYears: 10,
      workModel: BarberWorkModel.SALARY_COMMISSION,
      monthlySalary: 2500.00,
      active: true,
    },
  });

  const barber2 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'Pedro Navalheiro',
      nickname: 'Pedrão',
      description: 'Expert em barbas e bigodes. Campeão de competições.',
      specialties: ['Barba Completa', 'Bigode', 'Design'],
      rating: 4.9,
      experienceYears: 8,
      workModel: BarberWorkModel.COMMISSION_ONLY,
      active: true,
    },
  });

  // Serviços
  console.log('✂️  Criando serviços...');
  const service1 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Tradicional',
      description: 'Corte clássico com acabamento perfeito',
      category: 'Corte',
      price: 45.00,
      duration: 30,
      active: true,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Barba Completa',
      description: 'Aparar, modelar e finalizar com toalha quente',
      category: 'Barba',
      price: 35.00,
      duration: 30,
      active: true,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte + Barba',
      description: 'Combo completo: corte e barba com acabamento premium',
      category: 'Combo',
      price: 70.00,
      duration: 60,
      active: true,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Degradê Premium',
      description: 'Corte degradê moderno com desenho',
      category: 'Corte',
      price: 55.00,
      duration: 45,
      active: true,
    },
  });

  // Produtos
  console.log('🧴 Criando produtos...');
  const product1 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Pomada Modeladora Strong',
      description: 'Fixação forte, acabamento natural',
      price: 35.00,
      stock: 50,
      category: 'Pomada',
      active: true,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Shampoo Anticaspa Premium',
      description: 'Para cabelos oleosos e com caspa',
      price: 42.00,
      stock: 30,
      category: 'Shampoo',
      active: true,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Óleo para Barba',
      description: 'Hidratação e brilho para barbas',
      price: 48.00,
      stock: 25,
      category: 'Barba',
      active: true,
    },
  });

  // Clientes
  console.log('👥 Criando clientes...');
  const client1 = await prisma.client.create({
    data: {
      shopId: shop1.id,
      name: 'Roberto Santos',
      phone: '(11) 99999-1111',
      email: 'roberto@email.com',
      birthDate: new Date('1985-03-15'),
      active: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      shopId: shop1.id,
      name: 'Lucas Oliveira',
      phone: '(11) 99999-2222',
      email: 'lucas@email.com',
      birthDate: new Date('1990-07-22'),
      active: true,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      shopId: shop1.id,
      name: 'Fernando Costa',
      phone: '(11) 99999-3333',
      email: 'fernando@email.com',
      birthDate: new Date('1988-11-10'),
      active: true,
    },
  });

  // Comissões
  console.log('💰 Configurando comissões...');
  
  // Barber 1: Comissão padrão de 40% em serviços
  await prisma.barberCommission.create({
    data: {
      barberId: barber1.id,
      shopId: shop1.id,
      type: CommissionType.PERCENTAGE,
      value: 40,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  // Barber 1: Comissão específica no combo (50%)
  await prisma.barberCommission.create({
    data: {
      barberId: barber1.id,
      shopId: shop1.id,
      serviceId: service3.id,
      type: CommissionType.PERCENTAGE,
      value: 50,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  // Barber 2: Comissão padrão de 45% em serviços e 10% em produtos
  await prisma.barberCommission.create({
    data: {
      barberId: barber2.id,
      shopId: shop1.id,
      type: CommissionType.PERCENTAGE,
      value: 45,
      applyOnServices: true,
      applyOnProducts: true,
      active: true,
    },
  });

  // Agendamentos
  console.log('📅 Criando agendamentos...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const apt1 = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id,
      barberId: barber1.id,
      date: new Date(today.setHours(14, 0, 0, 0)),
      totalPrice: 70.00,
      status: AppointmentStatus.COMPLETED,
    },
  });

  // Vincular serviço ao agendamento
  await prisma.appointmentService.create({
    data: {
      appointmentId: apt1.id,
      serviceId: service3.id,
    },
  });

  const apt2 = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id,
      barberId: barber2.id,
      date: new Date(today.setHours(15, 30, 0, 0)),
      totalPrice: 35.00,
      status: AppointmentStatus.COMPLETED,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: apt2.id,
      serviceId: service2.id,
    },
  });

  const apt3 = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      clientId: client3.id,
      barberId: barber1.id,
      date: new Date(tomorrow.setHours(10, 0, 0, 0)),
      totalPrice: 45.00,
      status: AppointmentStatus.SCHEDULED,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: apt3.id,
      serviceId: service1.id,
    },
  });

  // Comandas (ServiceOrders) com itens
  console.log('🧾 Criando comandas de exemplo...');
  
  const order1 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id,
      barberId: barber1.id,
      orderNumber: 2026001,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 105.00,
      discount: 5.00,
      total: 100.00,
      paymentMethod: PaymentMethod.PIX,
    },
  });

  // Itens da comanda 1
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        type: OrderItemType.SERVICE,
        serviceId: service3.id,
        name: 'Corte + Barba',
        quantity: 1,
        unitPrice: 70.00,
        total: 70.00,
        commissionValue: 35.00, // 50% do serviço
      },
      {
        orderId: order1.id,
        type: OrderItemType.PRODUCT,
        productId: product1.id,
        name: 'Pomada Modeladora Strong',
        quantity: 1,
        unitPrice: 35.00,
        total: 35.00,
        commissionValue: 0, // Barber1 não tem comissão em produtos
      },
    ],
  });

  const order2 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id,
      barberId: barber2.id,
      orderNumber: 2026002,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 83.00,
      discount: 3.00,
      total: 80.00,
      paymentMethod: PaymentMethod.CREDIT_CARD,
    },
  });

  // Itens da comanda 2
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        type: OrderItemType.SERVICE,
        serviceId: service2.id,
        name: 'Barba Completa',
        quantity: 1,
        unitPrice: 35.00,
        total: 35.00,
        commissionValue: 15.75, // 45% do serviço
      },
      {
        orderId: order2.id,
        type: OrderItemType.PRODUCT,
        productId: product3.id,
        name: 'Óleo para Barba',
        quantity: 1,
        unitPrice: 48.00,
        total: 48.00,
        commissionValue: 4.80, // 10% do produto (comissão padrão de produtos)
      },
    ],
  });

  // Avaliações
  console.log('⭐ Criando avaliações...');
  await prisma.review.create({
    data: {
      barberId: barber1.id,
      clientId: client1.id,
      rating: 5,
      comment: 'Excelente atendimento! Corte perfeito e ambiente agradável.',
    },
  });

  await prisma.review.create({
    data: {
      barberId: barber2.id,
      clientId: client2.id,
      rating: 5,
      comment: 'Melhor barba da região! Pedro é muito profissional.',
    },
  });

  // ===== BARBEARIA 2: BarberPro Zona Sul =====
  console.log('\n📍 Criando Barbearia 2: BarberPro Zona Sul...');
  const shop2 = await prisma.barbershop.create({
    data: {
      name: 'BarberPro Zona Sul',
      cnpj: '98765432000111',
      phone: '(11) 97654-3210',
      address: 'Av. Paulista, 500 - Bela Vista, São Paulo - SP',
      openingTime: '10:00',
      closingTime: '21:00',
      intervalMinutes: 30,
      loyaltyEnabled: true,
      subscriptionEnabled: true,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Maria Administradora',
      email: 'maria@barberpro.com',
      phone: '(11) 97654-3210',
      passwordHash,
      role: UserRole.ADMIN,
      shopId: shop2.id,
    },
  });

  const barber3 = await prisma.barber.create({
    data: {
      shopId: shop2.id,
      name: 'Ricardo Tesoura',
      nickname: 'Ricardão',
      description: 'Especialista em cortes infantis e adultos',
      specialties: ['Corte Infantil', 'Social', 'Freestyle'],
      rating: 4.7,
      experienceYears: 5,
      workModel: BarberWorkModel.CHAIR_RENT,
      chairRentalFee: 1200.00,
      active: true,
    },
  });

  await prisma.service.createMany({
    data: [
      {
        shopId: shop2.id,
        name: 'Corte Adulto',
        description: 'Corte masculino padrão',
        category: 'Corte',
        price: 50.00,
        duration: 30,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Corte Infantil',
        description: 'Corte para crianças até 12 anos',
        category: 'Corte Infantil',
        price: 35.00,
        duration: 25,
        active: true,
      },
    ],
  });

  // Super Admin
  console.log('\n👑 Criando Super Admin...');
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@barberpro.com',
      phone: '(11) 99999-0000',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo dos dados criados:');
  console.log('  - 2 Barbearias');
  console.log('  - 5 Usuários (1 Super Admin, 2 Admins, 2 Barbers)');
  console.log('  - 3 Barbeiros');
  console.log('  - 6 Serviços');
  console.log('  - 3 Produtos');
  console.log('  - 3 Clientes');
  console.log('  - 3 Agendamentos');
  console.log('  - 2 Comandas completas');
  console.log('  - 4 Itens de comanda');
  console.log('  - 4 Configurações de comissão');
  console.log('  - 2 Avaliações\n');
  
  console.log('🔐 Credenciais de teste:');
  console.log('  Admin Shop 1: admin@barberpro.com / senha123');
  console.log('  Admin Shop 2: maria@barberpro.com / senha123');
  console.log('  Barbeiro 1: joao@barberpro.com / senha123');
  console.log('  Barbeiro 2: pedro@barberpro.com / senha123');
  console.log('  Super Admin: superadmin@barberpro.com / senha123\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
