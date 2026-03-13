import { PrismaClient, UserRole, AppointmentStatus, BarberWorkModel, CommissionType, OrderStatus, OrderItemType, PaymentMethod, BlockedType, InvoiceStatus, InvoiceType, SubscriptionTier, SubscriptionStatus, TeamMemberRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_SALT = 12;

async function main() {
  console.log('🌱 Iniciando seed COMPLETO do banco de dados...\n');
  console.log('📦 Isso pode levar alguns segundos...\n');

  // Limpar dados existentes (cuidado em produção!)
  await prisma.$transaction([
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.serviceOrder.deleteMany(),
    prisma.barberCommission.deleteMany(),
    prisma.appointmentService.deleteMany(), // Deletar primeiro devido a FK
    prisma.appointment.deleteMany(),
    prisma.blockedTime.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.service.deleteMany(),
    prisma.plan.deleteMany(), // Adicionar planos
    prisma.barber.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
    prisma.userShopAccess.deleteMany(),
    prisma.barbershopModule.deleteMany(),
    prisma.barbershop.deleteMany(),
  ]);

  console.log('✅ Dados antigos removidos\n');

  // ===== BARBEARIA 1: BarberPro Centro =====
  console.log('📍 Criando Barbearia 1: BarberPro Centro...');
  const shop1 = await prisma.barbershop.create({
    data: {
      id: '46fd2604-1d7f-4943-96f6-7a69523738d8',
      name: 'BarberPro Centro',
      cnpj: '12345678000190',
      phone: '(11) 98765-4321',
      address: 'Rua Augusta, 1234 - Centro, São Paulo - SP',
      openingTime: '09:00',
      closingTime: '20:00',
      intervalMinutes: 30,
      loyaltyEnabled: true,
      // Configurar assinatura PREMIUM
      subscriptionTier: SubscriptionTier.PREMIUM,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionStartDate: new Date('2026-01-01'),
      subscriptionEndDate: new Date('2026-12-31'),
      maxTeamMembers: 999,
      modulesEnabled: {
        clientPlans: true,
        products: true,
        cashier: true,
        financial: true,
        reports: true,
      },
      subscriptionEnabled: true,
    },
  });

  // Inicializar módulos habilitados para Shop 1
  console.log('🔧 Inicializando módulos da barbearia 1...');
  await prisma.barbershopModule.createMany({
    data: [
      { shopId: shop1.id, moduleType: 'AGENDA', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'FINANCEIRO', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'CAIXA', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'SERVICOS', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'GESTAO_TIME', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'PRODUTOS', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'MARKETING', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'PLANOS', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'NOTIFICACOES', enabled: true, enabledBy: null },
      { shopId: shop1.id, moduleType: 'CLIENTES', enabled: true, enabledBy: null },
    ],
  });

  // Usuários da Barbearia 1
  console.log('👤 Criando usuários...');
  const passwordHash = await bcrypt.hash('senha123', BCRYPT_SALT);

  console.log('👑 Criando Super Admin...');
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@barberpro.com',
      phone: '(11) 00000-0000',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

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
      bio: 'Especialista em cortes modernos e barba alinhada. Com mais de 10 anos de experiência, atende clientes exigentes que buscam qualidade e estilo. Apaixonado por transformar visual e autoestima.',
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
      bio: 'Mestre em barbas e bigodes, campeão de competições nacionais. Especializado em barboterapia e design facial. Cada barba é uma obra de arte personalizada para seu estilo.',
      specialties: ['Barba Completa', 'Bigode', 'Design'],
      rating: 4.9,
      experienceYears: 8,
      workModel: BarberWorkModel.COMMISSION_ONLY,
      active: true,
    },
  });

  // Mais colaboradores com diferentes funções
  console.log('👨‍👩‍👧‍👦 Criando equipe adicional...');
  
  const barber3 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'Marina Costa',
      nickname: 'Mari',
      email: 'marina@barberpro.com',
      phone: '(11) 98765-3333',
      description: 'Cabeleireira especialista em cortes femininos e coloração',
      bio: 'Especialista em transformações capilares, cortes modernos e colorimetria. Formada pela Academia Internacional de Beleza.',
      specialties: ['Coloração', 'Mechas', 'Cortes Femininos'],
      rating: 4.9,
      experienceYears: 7,
      role: TeamMemberRole.HAIRDRESSER,
      workModel: BarberWorkModel.SALARY_COMMISSION,
      monthlySalary: 2200.00,
      commissionRate: 35,
      birthDate: new Date('1992-05-15'),
      hireDate: new Date('2024-06-01'),
      active: true,
    },
  });

  const barber4 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'Juliana Mendes',
      nickname: 'Ju',
      email: 'juliana@barberpro.com',
      phone: '(11) 98765-4444',
      description: 'Manicure profissional com especialização em nail art',
      bio: 'Manicure e pedicure com foco em saúde das unhas e designs exclusivos.',
      specialties: ['Manicure', 'Pedicure', 'Nail Art'],
      rating: 4.7,
      experienceYears: 5,
      role: TeamMemberRole.MANICURIST,
      workModel: BarberWorkModel.COMMISSION_ONLY,
      commissionRate: 60,
      birthDate: new Date('1995-08-22'),
      hireDate: new Date('2025-01-10'),
      active: true,
    },
  });

  const receptionist1 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'Carla Silva',
      nickname: 'Carlinha',
      email: 'carla@barberpro.com',
      phone: '(11) 98765-5555',
      description: 'Recepcionista responsável pelo atendimento e agendamentos',
      bio: 'Profissional de atendimento com foco em experiência do cliente.',
      specialties: ['Atendimento', 'Agendamentos', 'Relacionamento'],
      rating: 4.8,
      experienceYears: 3,
      role: TeamMemberRole.RECEPTIONIST,
      workModel: BarberWorkModel.SALARY,
      monthlySalary: 1800.00,
      birthDate: new Date('1998-03-10'),
      hireDate: new Date('2025-03-01'),
      active: true,
    },
  });

  const cashier1 = await prisma.barber.create({
    data: {
      shopId: shop1.id,
      name: 'Roberto Almeida',
      nickname: 'Beto',
      email: 'roberto.almeida@barberpro.com',
      phone: '(11) 98765-6666',
      description: 'Caixa responsável pelas transações e fechamento',
      bio: 'Especialista em controle financeiro e atendimento no caixa.',
      specialties: ['Caixa', 'Financeiro', 'Controle'],
      rating: 4.6,
      experienceYears: 4,
      role: TeamMemberRole.CASHIER,
      workModel: BarberWorkModel.SALARY,
      monthlySalary: 2000.00,
      birthDate: new Date('1990-11-28'),
      hireDate: new Date('2024-09-15'),
      active: true,
    },
  });

  // Criar usuários para os novos colaboradores
  await prisma.user.createMany({
    data: [
      {
        name: 'Marina Costa',
        email: 'marina@barberpro.com',
        phone: '(11) 98765-3333',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop1.id,
      },
      {
        name: 'Juliana Mendes',
        email: 'juliana@barberpro.com',
        phone: '(11) 98765-4444',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop1.id,
      },
      {
        name: 'Carla Silva',
        email: 'carla@barberpro.com',
        phone: '(11) 98765-5555',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop1.id,
      },
      {
        name: 'Roberto Almeida',
        email: 'roberto.almeida@barberpro.com',
        phone: '(11) 98765-6666',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop1.id,
      },
    ],
  });

  console.log(`✅ Equipe completa criada: 2 barbeiros + 1 cabeleireira + 1 manicure + 1 recepcionista + 1 caixa = 6 membros`);

  // 🔐 VINCULAR USERS A BARBEIROS (JWT Link)
  console.log('🔗 Vinculando Users aos Barbeiros...');
  
  // Vincular os 2 barbeiros criados anteriormente (João e Pedro)
  await prisma.barber.update({
    where: { id: barber1.id },
    data: { userId: userBarber1.id }
  });
  console.log(`✅ Barbeiro João vinculado ao User`);

  await prisma.barber.update({
    where: { id: barber2.id },
    data: { userId: userBarber2.id }
  });
  console.log(`✅ Barbeiro Pedro vinculado ao User`);

  // Vincular os outros colaboradores
  const userMarina = await prisma.user.findUnique({
    where: { email: 'marina@barberpro.com' }
  });
  if (!userMarina) throw new Error('User Marina não encontrado');
  await prisma.barber.update({
    where: { id: barber3.id },
    data: { userId: userMarina.id }
  });
  console.log(`✅ Cabeleireira Marina vinculada ao User`);

  const userJuliana = await prisma.user.findUnique({
    where: { email: 'juliana@barberpro.com' }
  });
  if (!userJuliana) throw new Error('User Juliana não encontrado');
  await prisma.barber.update({
    where: { id: barber4.id },
    data: { userId: userJuliana.id }
  });
  console.log(`✅ Manicure Juliana vinculada ao User`);

  const userCarla = await prisma.user.findUnique({
    where: { email: 'carla@barberpro.com' }
  });
  if (!userCarla) throw new Error('User Carla não encontrado');
  await prisma.barber.update({
    where: { id: receptionist1.id },
    data: { userId: userCarla.id }
  });
  console.log(`✅ Recepcionista Carla vinculada ao User`);

  const userRoberto = await prisma.user.findUnique({
    where: { email: 'roberto.almeida@barberpro.com' }
  });
  if (!userRoberto) throw new Error('User Roberto não encontrado');
  await prisma.barber.update({
    where: { id: cashier1.id },
    data: { userId: userRoberto.id }
  });
  console.log(`✅ Caixa Roberto vinculado ao User`);

  // Serviços
  console.log('✂️  Criando serviços...');
  
  // CORTES
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
      name: 'Corte Degradê',
      description: 'Degradê moderno com transição suave',
      category: 'Corte',
      price: 50.00,
      duration: 40,
      active: true,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Degradê Premium',
      description: 'Degradê avançado com desenho e finalização detalhada',
      category: 'Corte',
      price: 60.00,
      duration: 50,
      active: true,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Navalhado',
      description: 'Corte clássico finalizado com navalha',
      category: 'Corte',
      price: 55.00,
      duration: 45,
      active: true,
    },
  });

  const service5 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Social',
      description: 'Corte executivo elegante e discreto',
      category: 'Corte',
      price: 48.00,
      duration: 35,
      active: true,
    },
  });

  const service6 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Americano',
      description: 'Estilo americano moderno e versátil',
      category: 'Corte',
      price: 52.00,
      duration: 40,
      active: true,
    },
  });

  const service7 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte Infantil',
      description: 'Corte especial para crianças até 12 anos',
      category: 'Corte Infantil',
      price: 35.00,
      duration: 25,
      active: true,
    },
  });

  const service8 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte + Desenho',
      description: 'Corte com desenho personalizado na lateral',
      category: 'Corte',
      price: 65.00,
      duration: 55,
      active: true,
    },
  });

  // BARBAS
  const service9 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Barba Simples',
      description: 'Aparar e alinhar a barba',
      category: 'Barba',
      price: 25.00,
      duration: 20,
      active: true,
    },
  });

  const service10 = await prisma.service.create({
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

  const service11 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Barba Premium',
      description: 'Tratamento completo: hidratação, modelagem, óleo e toalha quente',
      category: 'Barba',
      price: 45.00,
      duration: 40,
      active: true,
    },
  });

  const service12 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Design de Barba',
      description: 'Modelagem artística com linhas definidas',
      category: 'Barba',
      price: 40.00,
      duration: 35,
      active: true,
    },
  });

  const service13 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Raspagem Completa',
      description: 'Barbear tradicional com navalha e toalha quente',
      category: 'Barba',
      price: 38.00,
      duration: 30,
      active: true,
    },
  });

  // COMBOS
  const service14 = await prisma.service.create({
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

  const service15 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Corte + Barba + Sobrancelha',
      description: 'Pacote completo de grooming masculino',
      category: 'Combo',
      price: 85.00,
      duration: 75,
      active: true,
    },
  });

  const service16 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Combo Premium',
      description: 'Corte degradê + barba premium + hidratação',
      category: 'Combo',
      price: 95.00,
      duration: 90,
      active: true,
    },
  });

  const service17 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Combo Express',
      description: 'Corte rápido + aparar barba (ideal para manutenção)',
      category: 'Combo',
      price: 60.00,
      duration: 45,
      active: true,
    },
  });

  // TRATAMENTOS
  const service18 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Hidratação Capilar',
      description: 'Tratamento hidratante para cabelos e couro cabeludo',
      category: 'Tratamento',
      price: 30.00,
      duration: 25,
      active: true,
    },
  });

  const service19 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Coloração/Platinado',
      description: 'Coloração completa ou descoloração profissional',
      category: 'Tratamento',
      price: 80.00,
      duration: 90,
      active: true,
    },
  });

  const service20 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Luzes/Mechas',
      description: 'Aplicação de luzes ou mechas estilizadas',
      category: 'Tratamento',
      price: 100.00,
      duration: 120,
      active: true,
    },
  });

  const service21 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Relaxamento',
      description: 'Relaxamento capilar para redução de volume',
      category: 'Tratamento',
      price: 70.00,
      duration: 60,
      active: true,
    },
  });

  // ESTÉTICA
  const service22 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Sobrancelha',
      description: 'Design e modelagem de sobrancelhas',
      category: 'Estética',
      price: 15.00,
      duration: 15,
      active: true,
    },
  });

  const service23 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Limpeza de Pele',
      description: 'Limpeza facial profunda com produtos profissionais',
      category: 'Estética',
      price: 50.00,
      duration: 45,
      active: true,
    },
  });

  const service24 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Depilação Facial',
      description: 'Depilação com cera de áreas faciais',
      category: 'Estética',
      price: 20.00,
      duration: 20,
      active: true,
    },
  });

  // ESPECIAIS
  const service25 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Pacote Noivo',
      description: 'Tratamento completo para o dia especial: corte, barba, hidratação e finalização',
      category: 'Especial',
      price: 150.00,
      duration: 120,
      active: true,
    },
  });

  const service26 = await prisma.service.create({
    data: {
      shopId: shop1.id,
      name: 'Day Off Masculino',
      description: 'Experiência completa: corte, barba, massagem relaxante e bebida',
      category: 'Especial',
      price: 180.00,
      duration: 150,
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
      formulation: 'Cera de abelha, óleo de argan, vitamina E, lanolina',
      howToUse: 'Aplique uma pequena quantidade nas mãos, aqueça e distribua uniformemente no cabelo seco ou levemente úmido',
      recommendedFor: 'Cabelos curtos e médios que precisam de fixação forte e duradoura',
      price: 35.00,
      costPrice: 18.00,
      stock: 50,
      unit: 'unidade',
      category: 'Pomada',
      active: true,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Shampoo Anticaspa Premium',
      description: 'Para cabelos oleosos e com caspa',
      formulation: 'Piritionato de zinco, ácido salicílico, óleo de melaleuca, mentol',
      howToUse: 'Aplique no cabelo molhado, massageie o couro cabeludo por 2 minutos e enxagüe. Repita se necessário',
      recommendedFor: 'Cabelos oleosos, com caspa ou descamação. Uso diário ou 3x por semana',
      price: 42.00,
      costPrice: 22.00,
      stock: 30,
      unit: 'unidade',
      category: 'Shampoo',
      active: true,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Óleo para Barba',
      description: 'Hidratação e brilho para barbas',
      formulation: 'Óleo de jojoba, óleo de argan, óleo de rícino, vitamina E, essência amadeirada',
      howToUse: 'Aplique 3-5 gotas na palma das mãos, esfregue e distribua na barba após lavar e secar',
      recommendedFor: 'Barbas secas, ásperas ou com coceira. Todos os tipos e tamanhos de barba',
      price: 48.00,
      costPrice: 25.00,
      stock: 25,
      unit: 'unidade',
      category: 'Barba',
      active: true,
    },
  });

  const product4 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Cera para Cabelo Matte',
      description: 'Efeito fosco, fixação média',
      formulation: 'Argila branca (kaolin), cera de carnauba, óleo de coco, fragrância amadeirada',
      howToUse: 'Aplique em cabelo seco, trabalhando mecha por mecha para texturizar e modelar',
      recommendedFor: 'Cabelos curtos a médios que buscam visual natural, texturizado e sem brilho',
      price: 38.50,
      costPrice: 20.00,
      stock: 40,
      unit: 'unidade',
      category: 'Cera',
      active: true,
    },
  });

  const product5 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Gel Fixador Ultra Hold',
      description: 'Fixação extra forte e brilho intenso',
      price: 28.90,
      costPrice: 15.00,
      stock: 60,
      unit: 'unidade',
      category: 'Gel',
      active: true,
    },
  });

  const product6 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Balm Pós-Barba',
      description: 'Hidratante com ação calmante',
      price: 45.00,
      costPrice: 24.00,
      stock: 35,
      unit: 'unidade',
      category: 'Pós-Barba',
      active: true,
    },
  });

  const product7 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Kit Pente + Escova',
      description: 'Set profissional para acabamento',
      price: 55.00,
      costPrice: 30.00,
      stock: 20,
      unit: 'kit',
      category: 'Acessórios',
      active: true,
    },
  });

  const product8 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Spray Texturizador',
      description: 'Volume e textura duradoura',
      price: 52.00,
      costPrice: 28.00,
      stock: 28,
      unit: 'unidade',
      category: 'Spray',
      active: true,
    },
  });

  const product9 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Condicionador Hidratante',
      description: 'Nutrição profunda para todos os tipos de cabelo',
      price: 39.90,
      costPrice: 21.00,
      stock: 45,
      unit: 'unidade',
      category: 'Condicionador',
      active: true,
    },
  });

  const product10 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Talco para Acabamento',
      description: 'Absorve oleosidade e perfuma',
      price: 22.50,
      costPrice: 12.00,
      stock: 70,
      unit: 'unidade',
      category: 'Talco',
      active: true,
    },
  });

  const product11 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Espuma de Barbear Premium',
      description: 'Cremosa, ideal para peles sensíveis',
      price: 32.00,
      costPrice: 17.00,
      stock: 42,
      unit: 'unidade',
      category: 'Barbear',
      active: true,
    },
  });

  const product12 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Loção Pré-Barba',
      description: 'Prepara a pele para barbear',
      price: 41.00,
      costPrice: 22.00,
      stock: 30,
      unit: 'unidade',
      category: 'Pré-Barba',
      active: true,
    },
  });

  const product13 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Bebida Energético Lata',
      description: 'Energético 250ml gelado',
      price: 8.00,
      costPrice: 4.50,
      stock: 100,
      unit: 'unidade',
      category: 'Bebidas',
      active: true,
    },
  });

  const product14 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Água Mineral 500ml',
      description: 'Água mineral sem gás',
      price: 3.50,
      costPrice: 1.80,
      stock: 150,
      unit: 'unidade',
      category: 'Bebidas',
      active: true,
    },
  });

  const product15 = await prisma.product.create({
    data: {
      shopId: shop1.id,
      name: 'Café Expresso',
      description: 'Café expresso italiano',
      price: 5.00,
      costPrice: 2.00,
      stock: 200,
      unit: 'unidade',
      category: 'Bebidas',
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

  // Usuários Clientes (para permitir login)
  console.log('🔐 Criando usuários clientes...');
  await prisma.user.create({
    data: {
      name: 'Roberto Santos',
      email: 'roberto@email.com',
      phone: '(11) 99999-1111',
      passwordHash,
      role: UserRole.CLIENT,
      shopId: shop1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Lucas Oliveira',
      email: 'lucas@email.com',
      phone: '(11) 99999-2222',
      passwordHash,
      role: UserRole.CLIENT,
      shopId: shop1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Fernando Costa',
      email: 'fernando@email.com',
      phone: '(11) 99999-3333',
      passwordHash,
      role: UserRole.CLIENT,
      shopId: shop1.id,
    },
  });

  // 🔐 VINCULAR USERS A CLIENTES (JWT Link)
  console.log('🔗 Vinculando Users aos Clientes...');
  
  const userClientRoberto = await prisma.user.findUnique({
    where: { email: 'roberto@email.com' }
  });
  if (!userClientRoberto) throw new Error('User Roberto não encontrado');
  await prisma.client.update({
    where: { id: client1.id },
    data: { userId: userClientRoberto.id }
  });
  console.log(`✅ Cliente Roberto vinculado ao User`);

  const userClientLucas = await prisma.user.findUnique({
    where: { email: 'lucas@email.com' }
  });
  if (!userClientLucas) throw new Error('User Lucas não encontrado');
  await prisma.client.update({
    where: { id: client2.id },
    data: { userId: userClientLucas.id }
  });
  console.log(`✅ Cliente Lucas vinculado ao User`);

  const userClientFernando = await prisma.user.findUnique({
    where: { email: 'fernando@email.com' }
  });
  if (!userClientFernando) throw new Error('User Fernando não encontrado');
  await prisma.client.update({
    where: { id: client3.id },
    data: { userId: userClientFernando.id }
  });
  console.log(`✅ Cliente Fernando vinculado ao User`);

  // ===== PLANOS DE FIDELIDADE - BARBEARIA 1 =====
  console.log('💎 Criando planos de fidelidade para clientes - Barbearia 1...');
  
  const plan1Shop1 = await prisma.plan.create({
    data: {
      shopId: shop1.id,
      name: 'Plano Bronze',
      description: 'Plano básico com benefícios essenciais para quem está começando',
      price: 79.90,
      benefits: [
        '2 cortes mensais inclusos',
        '10% de desconto em produtos',
        'Agendamento prioritário',
        'Sem taxa de cancelamento'
      ],
      discount: 10,
      benefitMonths: 1,
      benefitServices: 2,
      benefitProducts: 0,
      benefitMoneyback: 0,
      isPopular: false,
      active: true,
    },
  });

  const plan2Shop1 = await prisma.plan.create({
    data: {
      shopId: shop1.id,
      name: 'Plano Prata',
      description: 'Plano intermediário com mais benefícios e cashback',
      price: 129.90,
      benefits: [
        '4 serviços mensais inclusos',
        '15% de desconto em todos os serviços',
        '10% de cashback em produtos',
        'Brinde no aniversário',
        'Agendamento prioritário',
        'Sem taxa de cancelamento'
      ],
      discount: 15,
      benefitMonths: 1,
      benefitServices: 4,
      benefitProducts: 1,
      benefitMoneyback: 10,
      isPopular: true,
      active: true,
    },
  });

  const plan3Shop1 = await prisma.plan.create({
    data: {
      shopId: shop1.id,
      name: 'Plano Ouro Premium',
      description: 'Plano completo com benefícios ilimitados e máximo cashback',
      price: 199.90,
      benefits: [
        'Cortes ilimitados (até 8 por mês)',
        '20% de desconto em todos os serviços',
        '2 produtos mensais inclusos',
        '15% de cashback em todos os gastos',
        'Atendimento VIP e agendamento prioritário',
        'Brinde no aniversário',
        'Transfer gratuito (raio 5km)',
        'Sem taxa de cancelamento'
      ],
      discount: 20,
      benefitMonths: 1,
      benefitServices: 8,
      benefitProducts: 2,
      benefitMoneyback: 15,
      isPopular: false,
      active: true,
    },
  });

  console.log(`✅ 3 planos de fidelidade criados para ${shop1.name}`);

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
      createdBy: admin1.id,
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
      createdBy: admin1.id,
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
      createdBy: admin1.id,
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

  // Mais comandas com novos colaboradores e dados financeiros
  console.log('💰 Criando mais comandas financeiras...');

  // Comanda 3: Marina (cabeleireira) - Coloração
  const order3 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id,
      barberId: barber3.id, // Marina
      orderNumber: 2026003,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 180.00,
      discount: 0,
      total: 180.00,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      notes: 'Cliente muito satisfeita com o resultado',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order3.id,
        type: OrderItemType.SERVICE,
        serviceId: service19.id, // Coloração
        name: 'Coloração/Platinado',
        quantity: 1,
        unitPrice: 80.00,
        total: 80.00,
        commissionValue: 28.00, // 35% comissão
      },
      {
        orderId: order3.id,
        type: OrderItemType.SERVICE,
        serviceId: service18.id, // Hidratação
        name: 'Hidratação Capilar',
        quantity: 1,
        unitPrice: 30.00,
        total: 30.00,
        commissionValue: 10.50, // 35% comissão
      },
      {
        orderId: order3.id,
        type: OrderItemType.PRODUCT,
        productId: product2.id,
        name: 'Shampoo Profissional',
        quantity: 2,
        unitPrice: 35.00,
        total: 70.00,
        commissionValue: 0, // Sem comissão em produtos
      },
    ],
  });

  // Comanda 4: Juliana (manicure) - Serviços extras
  const order4 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id,
      barberId: barber4.id, // Juliana
      orderNumber: 2026004,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 50.00,
      discount: 5.00,
      total: 45.00,
      paymentMethod: PaymentMethod.PIX,
      notes: 'Manicure completa',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order4.id,
        type: OrderItemType.EXTRA,
        name: 'Manicure Completa',
        quantity: 1,
        unitPrice: 35.00,
        total: 35.00,
        commissionValue: 21.00, // 60% comissão
      },
      {
        orderId: order4.id,
        type: OrderItemType.EXTRA,
        name: 'Pedicure',
        quantity: 1,
        unitPrice: 15.00,
        total: 15.00,
        commissionValue: 9.00, // 60% comissão
      },
    ],
  });

  // Comanda 5: João - Combo Premium
  const order5 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client3.id,
      barberId: barber1.id,
      orderNumber: 2026005,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 125.00,
      discount: 10.00,
      total: 115.00,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      notes: 'Cliente VIP - plano Ouro',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order5.id,
        type: OrderItemType.SERVICE,
        serviceId: service16.id, // Combo Premium
        name: 'Combo Premium',
        quantity: 1,
        unitPrice: 95.00,
        total: 95.00,
        commissionValue: 47.50, // 50% comissão (serviço especial)
      },
      {
        orderId: order5.id,
        type: OrderItemType.PRODUCT,
        productId: product1.id,
        name: 'Pomada Modeladora',
        quantity: 1,
        unitPrice: 30.00,
        total: 30.00,
        commissionValue: 0,
      },
    ],
  });

  // Comanda aberta (em progresso) - Shop 1
  const order7 = await prisma.serviceOrder.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id,
      barberId: barber2.id,
      orderNumber: 2026007,
      status: OrderStatus.IN_PROGRESS,
      subtotal: 70.00,
      discount: 0,
      total: 70.00,
      notes: 'Cliente aguardando finalização',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order7.id,
      type: OrderItemType.SERVICE,
      serviceId: service14.id, // Corte + Barba
      name: 'Corte + Barba',
      quantity: 1,
      unitPrice: 70.00,
      total: 70.00,
      commissionValue: 31.50, // 45% comissão
    },
  });

  console.log('✅ 7 comandas financeiras criadas (6 completas + 1 em progresso)');

  // Configurar comissões para novos colaboradores - Shop 1
  console.log('💸 Configurando comissões da equipe shop 1...');

  // Comissões Marina (cabeleireira)
  await prisma.barberCommission.create({
    data: {
      barberId: barber3.id, // Marina
      shopId: shop1.id,
      type: CommissionType.PERCENTAGE,
      value: 35,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  // Comissões Juliana (manicure)
  await prisma.barberCommission.create({
    data: {
      barberId: barber4.id, // Juliana
      shopId: shop1.id,
      type: CommissionType.PERCENTAGE,
      value: 60,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  console.log('✅ Comissões configuradas para equipe shop 1');

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
      // Configurar assinatura PREMIUM
      subscriptionTier: SubscriptionTier.PREMIUM,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionStartDate: new Date('2026-01-01'),
      subscriptionEndDate: new Date('2026-12-31'),
      maxTeamMembers: 999,
      modulesEnabled: {
        clientPlans: true,
        products: true,
        cashier: true,
        financial: true,
        reports: true,
      },
    },
  });

  // Inicializar módulos habilitados para Shop 2
  console.log('🔧 Inicializando módulos da barbearia 2...');
  await prisma.barbershopModule.createMany({
    data: [
      { shopId: shop2.id, moduleType: 'AGENDA', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'FINANCEIRO', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'CAIXA', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'SERVICOS', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'GESTAO_TIME', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'PRODUTOS', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'MARKETING', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'PLANOS', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'NOTIFICACOES', enabled: true, enabledBy: null },
      { shopId: shop2.id, moduleType: 'CLIENTES', enabled: true, enabledBy: null },
    ],
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

  const barberShop2_1 = await prisma.barber.create({
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

  // Mais colaboradores para a barbearia 2
  console.log('👨‍👩‍👧‍👦 Criando equipe da barbearia 2...');

  const barber4Shop2 = await prisma.barber.create({
    data: {
      shopId: shop2.id,
      name: 'Fernanda Lima',
      nickname: 'Fê',
      email: 'fernanda@barberpro.com',
      phone: '(11) 97654-1111',
      description: 'Barbeira especialista em degradês e desenhos',
      bio: 'Barbeira profissional com técnicas avançadas em degradê e arte capilar.',
      specialties: ['Degradê', 'Desenhos', 'Barba Artística'],
      rating: 4.8,
      experienceYears: 6,
      role: TeamMemberRole.BARBER,
      workModel: BarberWorkModel.SALARY_COMMISSION,
      monthlySalary: 2300.00,
      commissionRate: 40,
      birthDate: new Date('1993-07-18'),
      hireDate: new Date('2024-08-01'),
      active: true,
    },
  });

  const hairdresserShop2 = await prisma.barber.create({
    data: {
      shopId: shop2.id,
      name: 'Patrícia Santos',
      nickname: 'Paty',
      email: 'patricia@barberpro.com',
      phone: '(11) 97654-2222',
      description: 'Cabeleireira expert em químicas e tratamentos',
      bio: 'Especialista em coloração, progressivas e tratamentos capilares de alta performance.',
      specialties: ['Progressiva', 'Platinado', 'Tratamentos'],
      rating: 4.9,
      experienceYears: 9,
      role: TeamMemberRole.HAIRDRESSER,
      workModel: BarberWorkModel.COMMISSION_ONLY,
      commissionRate: 50,
      birthDate: new Date('1988-12-05'),
      hireDate: new Date('2023-11-20'),
      active: true,
    },
  });

  const receptionistShop2 = await prisma.barber.create({
    data: {
      shopId: shop2.id,
      name: 'Amanda Oliveira',
      nickname: 'Manda',
      email: 'amanda@barberpro.com',
      phone: '(11) 97654-3333',
      description: 'Recepcionista e atendimento ao cliente',
      bio: 'Especialista em atendimento humanizado e gestão de agendamentos.',
      specialties: ['Atendimento', 'Agendamentos', 'Relacionamento'],
      rating: 4.7,
      experienceYears: 2,
      role: TeamMemberRole.RECEPTIONIST,
      workModel: BarberWorkModel.SALARY,
      monthlySalary: 1900.00,
      birthDate: new Date('1999-04-25'),
      hireDate: new Date('2025-06-01'),
      active: true,
    },
  });

  const cleanerShop2 = await prisma.barber.create({
    data: {
      shopId: shop2.id,
      name: 'José Carlos',
      nickname: 'Zé',
      email: 'jose.carlos@barberpro.com',
      phone: '(11) 97654-4444',
      description: 'Responsável pela limpeza e organização',
      bio: 'Profissional de limpeza com foco em higiene e organização impecável.',
      specialties: ['Limpeza', 'Organização', 'Higienização'],
      rating: 4.5,
      experienceYears: 8,
      role: TeamMemberRole.CLEANER,
      workModel: BarberWorkModel.SALARY,
      monthlySalary: 1600.00,
      birthDate: new Date('1985-09-30'),
      hireDate: new Date('2024-01-15'),
      active: true,
    },
  });

  // Criar usuários para os colaboradores da shop2
  await prisma.user.createMany({
    data: [
      {
        name: 'Fernanda Lima',
        email: 'fernanda@barberpro.com',
        phone: '(11) 97654-1111',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop2.id,
      },
      {
        name: 'Patrícia Santos',
        email: 'patricia@barberpro.com',
        phone: '(11) 97654-2222',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop2.id,
      },
      {
        name: 'Amanda Oliveira',
        email: 'amanda@barberpro.com',
        phone: '(11) 97654-3333',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop2.id,
      },
      {
        name: 'José Carlos',
        email: 'jose.carlos@barberpro.com',
        phone: '(11) 97654-4444',
        passwordHash,
        role: UserRole.BARBER,
        shopId: shop2.id,
      },
    ],
  });

  console.log(`✅ Equipe barbearia 2 criada: 2 barbeiros + 1 cabeleireira + 1 recepcionista + 1 faxineiro = 5 membros`);

  // Mais agendamentos com novos colaboradores
  console.log('📅 Criando mais agendamentos com equipe completa...');
  
  // Definir variáveis de data
  const now2 = new Date();
  const nextWeek2 = new Date(now2);
  nextWeek2.setDate(nextWeek2.getDate() + 7);

  // Agendamentos com Marina (cabeleireira) - Barbearia 1
  const marinaDate1 = new Date(nextWeek2);
  marinaDate1.setHours(14, 0, 0, 0);
  
  const aptMarina1 = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      barberId: barber3.id, // Marina
      clientId: client1.id,
      date: marinaDate1,
      totalPrice: service20.price,
      status: AppointmentStatus.SCHEDULED,
      createdBy: admin1.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptMarina1.id,
      serviceId: service20.id,  // Luzes/Mechas
    },
  });

  const marinaDate2 = new Date(nextWeek2);
  marinaDate2.setDate(marinaDate2.getDate() + 2);
  marinaDate2.setHours(10, 30, 0, 0);
  
  const aptMarina2 = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      barberId: barber3.id, // Marina
      clientId: client2.id,
      date: marinaDate2,
      totalPrice: service18.price,
      status: AppointmentStatus.SCHEDULED,
      createdBy: admin1.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptMarina2.id,
      serviceId: service18.id, // Hidratação
    },
  });

  // Agendamentos com Fernanda (barbeira) - Barbearia 2
  const fernandaDate1 = new Date(nextWeek2);
  fernandaDate1.setHours(15, 0, 0, 0);
  
  const aptFernanda1 = await prisma.appointment.create({
    data: {
      shopId: shop2.id,
      barberId: barber4Shop2.id, // Fernanda
      clientId: client3.id,
      date: fernandaDate1,
      totalPrice: service2.price,
      status: AppointmentStatus.SCHEDULED,
      createdBy: admin2.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptFernanda1.id,
      serviceId: service2.id, // Degradê
    },
  });

  // Agendamentos com Patrícia (cabeleireira progressiva) - Barbearia 2
  const patriciaDate1 = new Date(nextWeek2);
  patriciaDate1.setDate(patriciaDate1.getDate() + 1);
  patriciaDate1.setHours(9, 0, 0, 0);
  
  const aptPatricia1 = await prisma.appointment.create({
    data: {
      shopId: shop2.id,
      barberId: hairdresserShop2.id, // Patrícia
      clientId: client2.id,
      date: patriciaDate1,
      totalPrice: service21.price,
      status: AppointmentStatus.SCHEDULED,
      createdBy: admin2.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptPatricia1.id,
      serviceId: service21.id, // Relaxamento
    },
  });

  // Agendamentos passados (histórico)
  const pastDate1 = new Date(now2);
  pastDate1.setDate(pastDate1.getDate() - 7);
  pastDate1.setHours(10, 0, 0, 0);
  
  const aptMarinaPast = await prisma.appointment.create({
    data: {
      shopId: shop1.id,
      barberId: barber3.id, // Marina
      clientId: client2.id,
      date: pastDate1,
      totalPrice: service19.price,
      status: AppointmentStatus.COMPLETED,
      createdBy: admin1.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptMarinaPast.id,
      serviceId: service19.id, // Coloração
    },
  });

  const pastDate2 = new Date(now2);
  pastDate2.setDate(pastDate2.getDate() - 5);
  pastDate2.setHours(16, 0, 0, 0);
  
  const aptFernandaPast = await prisma.appointment.create({
    data: {
      shopId: shop2.id,
      barberId: barber4Shop2.id, // Fernanda
      clientId: client1.id,
      date: pastDate2,
      totalPrice: service1.price + service7.price,
      status: AppointmentStatus.COMPLETED,
      createdBy: admin2.id,
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptFernandaPast.id,
      serviceId: service1.id, // Corte
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: aptFernandaPast.id,
      serviceId: service7.id, // Barba
    },
  });

  console.log('✅ Agendamentos adicionais criados com sucesso');

  await prisma.service.createMany({
    data: [
      // CORTES
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
        name: 'Corte Degradê',
        description: 'Degradê moderno com transição',
        category: 'Corte',
        price: 55.00,
        duration: 40,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Corte Social Executivo',
        description: 'Corte elegante para ambientes corporativos',
        category: 'Corte',
        price: 52.00,
        duration: 35,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Corte Navalhado Premium',
        description: 'Corte com navalha e acabamento refinado',
        category: 'Corte',
        price: 60.00,
        duration: 45,
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
      {
        shopId: shop2.id,
        name: 'Corte + Desenho Artístico',
        description: 'Corte com desenhos personalizados',
        category: 'Corte',
        price: 70.00,
        duration: 60,
        active: true,
      },
      // BARBAS
      {
        shopId: shop2.id,
        name: 'Barba Express',
        description: 'Aparar rápido e alinhamento',
        category: 'Barba',
        price: 28.00,
        duration: 20,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Barba Premium',
        description: 'Tratamento completo com produtos premium',
        category: 'Barba',
        price: 45.00,
        duration: 40,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Design de Barba Artístico',
        description: 'Modelagem com linhas e formas definidas',
        category: 'Barba',
        price: 42.00,
        duration: 35,
        active: true,
      },
      // COMBOS
      {
        shopId: shop2.id,
        name: 'Combo Completo',
        description: 'Corte + barba + sobrancelha',
        category: 'Combo',
        price: 88.00,
        duration: 70,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Combo Express',
        description: 'Corte + barba (serviço rápido)',
        category: 'Combo',
        price: 68.00,
        duration: 50,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Combo Premium VIP',
        description: 'Experiência completa com massagem e bebida',
        category: 'Combo',
        price: 120.00,
        duration: 90,
        active: true,
      },
      // TRATAMENTOS
      {
        shopId: shop2.id,
        name: 'Hidratação Capilar Profissional',
        description: 'Hidratação profunda com produtos de alta qualidade',
        category: 'Tratamento',
        price: 35.00,
        duration: 30,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Platinado/Descoloração',
        description: 'Descoloração completa e tonalização',
        category: 'Tratamento',
        price: 90.00,
        duration: 100,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Progressiva/Escova',
        description: 'Alisamento progressivo ou escova definitiva',
        category: 'Tratamento',
        price: 150.00,
        duration: 120,
        active: true,
      },
      // ESTÉTICA
      {
        shopId: shop2.id,
        name: 'Sobrancelha Masculina',
        description: 'Design e limpeza de sobrancelhas',
        category: 'Estética',
        price: 18.00,
        duration: 15,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Limpeza de Pele Masculina',
        description: 'Limpeza facial profunda e esfoliação',
        category: 'Estética',
        price: 55.00,
        duration: 50,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Massagem Relaxante',
        description: 'Massagem nos ombros e pescoço (15min)',
        category: 'Estética',
        price: 25.00,
        duration: 15,
        active: true,
      },
      // ESPECIAIS
      {
        shopId: shop2.id,
        name: 'Pacote Executivo',
        description: 'Corte social + barba + limpeza de pele',
        category: 'Especial',
        price: 130.00,
        duration: 100,
        active: true,
      },
      {
        shopId: shop2.id,
        name: 'Experiência Premium',
        description: 'Todos os serviços + produtos de cortesia',
        category: 'Especial',
        price: 200.00,
        duration: 150,
        active: true,
      },
    ],
  });

  console.log('✅ Serviços da Barbearia 2 criados');

  // ===== COMANDAS E COMISSÕES - BARBEARIA 2 =====
  console.log('💰 Criando comandas financeiras - Barbearia 2...');

  // Buscar serviços da shop2 para referenciar
  const servicesShop2 = await prisma.service.findMany({
    where: { shopId: shop2.id },
    orderBy: { price: 'desc' },
  });

  const degradeShop2 = servicesShop2.find(s => s.name.includes('Degradê'));
  const barbaShop2 = servicesShop2.find(s => s.name.includes('Barba Premium'));

  // Comandas Shop 2 - Fernanda
  const order6 = await prisma.serviceOrder.create({
    data: {
      shopId: shop2.id,
      clientId: client1.id,
      barberId: barber4Shop2.id, // Fernanda
      orderNumber: 2026006,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      subtotal: 90.00,
      discount: 0,
      total: 90.00,
      paymentMethod: PaymentMethod.PIX,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order6.id,
        type: OrderItemType.SERVICE,
        serviceId: degradeShop2?.id,
        name: degradeShop2?.name || 'Degradê',
        quantity: 1,
        unitPrice: degradeShop2?.price || 55.00,
        total: degradeShop2?.price || 55.00,
        commissionValue: (degradeShop2?.price || 55.00) * 0.40, // 40% comissão
      },
      {
        orderId: order6.id,
        type: OrderItemType.SERVICE,
        serviceId: barbaShop2?.id,
        name: barbaShop2?.name || 'Barba Premium',
        quantity: 1,
        unitPrice: barbaShop2?.price || 45.00,
        total: barbaShop2?.price || 45.00,
        commissionValue: (barbaShop2?.price || 45.00) * 0.40, // 40% comissão
      },
    ],
  });

  console.log('✅ Comanda Shop 2 criada');

  // Configurar comissões para colaboradores - Shop 2
  console.log('💸 Configurando comissões da equipe shop 2...');

  // Comissões Fernanda (barbeira shop2)
  await prisma.barberCommission.create({
    data: {
      barberId: barber4Shop2.id, // Fernanda
      shopId: shop2.id,
      type: CommissionType.PERCENTAGE,
      value: 40,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  // Comissões Patrícia (cabeleireira shop2)
  await prisma.barberCommission.create({
    data: {
      barberId: hairdresserShop2.id, // Patrícia
      shopId: shop2.id,
      type: CommissionType.PERCENTAGE,
      value: 50,
      applyOnServices: true,
      applyOnProducts: false,
      active: true,
    },
  });

  console.log('✅ Comissões configuradas para equipe shop 2');

  // ===== PLANOS DE FIDELIDADE - BARBEARIA 2 =====
  console.log('💎 Criando planos de fidelidade para clientes - Barbearia 2...');
  
  const plan1Shop2 = await prisma.plan.create({
    data: {
      shopId: shop2.id,
      name: 'Plano Essencial',
      description: 'Perfeito para manutenção regular com benefícios básicos',
      price: 89.90,
      benefits: [
        '2 cortes ou barbas mensais',
        '10% de desconto em produtos',
        'Agendamento online prioritário',
        'Produtos de cortesia'
      ],
      discount: 10,
      benefitMonths: 1,
      benefitServices: 2,
      benefitProducts: 0,
      benefitMoneyback: 0,
      isPopular: false,
      active: true,
    },
  });

  const plan2Shop2 = await prisma.plan.create({
    data: {
      shopId: shop2.id,
      name: 'Plano Executivo',
      description: 'Ideal para profissionais que prezam pela aparência',
      price: 149.90,
      benefits: [
        '5 serviços mensais inclusos',
        '18% de desconto em todos os serviços',
        '12% de cashback em compras',
        'Limpeza de pele inclusa (1x/mês)',
        'Atendimento VIP',
        'Brinde aniversário + Dia dos Pais'
      ],
      discount: 18,
      benefitMonths: 1,
      benefitServices: 5,
      benefitProducts: 1,
      benefitMoneyback: 12,
      isPopular: true,
      active: true,
    },
  });

  const plan3Shop2 = await prisma.plan.create({
    data: {
      shopId: shop2.id,
      name: 'Plano Black Premium',
      description: 'O plano mais completo com benefícios exclusivos e ilimitados',
      price: 249.90,
      benefits: [
        'Serviços ilimitados (até 10 por mês)',
        '25% de desconto em todos os serviços',
        '3 produtos premium inclusos',
        '20% de cashback em tudo',
        'Atendimento VIP exclusivo',
        'Massagem relaxante inclusa',
        'Transfer executivo (raio 10km)',
        'Acesso a eventos exclusivos',
        'Corte em domicílio (1x/mês)',
        'Sem taxa de cancelamento ou transferência'
      ],
      discount: 25,
      benefitMonths: 1,
      benefitServices: 10,
      benefitProducts: 3,
      benefitMoneyback: 20,
      isPopular: false,
      active: true,
    },
  });

  console.log(`✅ 3 planos de fidelidade criados para ${shop2.name}`);

  // ===== DADOS ADICIONAIS PARA TESTES COMPLETOS =====
  console.log('\n🔧 Populando dados adicionais...');

  // Mais clientes para ambas as lojas
  console.log('👥 Criando mais clientes...');
  await prisma.client.createMany({
    data: [
      { shopId: shop1.id, name: 'Roberto Alves', phone: '(11) 91111-1111', email: 'roberto@email.com' },
      { shopId: shop1.id, name: 'Fernando Costa', phone: '(11) 91111-2222', email: 'fernando@email.com' },
      { shopId: shop1.id, name: 'Lucas Mendes', phone: '(11) 91111-3333', email: 'lucas@email.com' },
      { shopId: shop1.id, name: 'Rafael Santos', phone: '(11) 91111-4444', email: 'rafael@email.com' },
      { shopId: shop1.id, name: 'Gustavo Lima', phone: '(11) 91111-5555', email: 'gustavo@email.com' },
      { shopId: shop1.id, name: 'André Oliveira', phone: '(11) 91111-6666', email: 'andre@email.com' },
      { shopId: shop1.id, name: 'Thiago Rocha', phone: '(11) 91111-7777', email: 'thiago@email.com' },
      { shopId: shop1.id, name: 'Diego Martins', phone: '(11) 91111-8888', email: 'diego@email.com' },
      { shopId: shop2.id, name: 'Bruno Silva', phone: '(11) 92222-1111', email: 'bruno@email.com' },
      { shopId: shop2.id, name: 'Felipe Souza', phone: '(11) 92222-2222', email: 'felipe@email.com' },
      { shopId: shop2.id, name: 'Marcelo Dias', phone: '(11) 92222-3333', email: 'marcelo@email.com' },
      { shopId: shop2.id, name: 'Ricardo Pinto', phone: '(11) 92222-4444', email: 'ricardo@email.com' },
    ],
  });

  // Criar usuários para alguns clientes (permitir login)
  console.log('🔐 Criando mais usuários clientes...');
  await prisma.user.createMany({
    data: [
      // Clientes Shop 1
      { name: 'Rafael Santos', email: 'rafael@email.com', phone: '(11) 91111-4444', passwordHash, role: UserRole.CLIENT, shopId: shop1.id },
      { name: 'Gustavo Lima', email: 'gustavo@email.com', phone: '(11) 91111-5555', passwordHash, role: UserRole.CLIENT, shopId: shop1.id },
      { name: 'André Oliveira', email: 'andre@email.com', phone: '(11) 91111-6666', passwordHash, role: UserRole.CLIENT, shopId: shop1.id },
      // Clientes Shop 2
      { name: 'Bruno Silva', email: 'bruno@email.com', phone: '(11) 92222-1111', passwordHash, role: UserRole.CLIENT, shopId: shop2.id },
      { name: 'Felipe Souza', email: 'felipe@email.com', phone: '(11) 92222-2222', passwordHash, role: UserRole.CLIENT, shopId: shop2.id },
      { name: 'Marcelo Dias', email: 'marcelo@email.com', phone: '(11) 92222-3333', passwordHash, role: UserRole.CLIENT, shopId: shop2.id },
    ],
  });

  // Buscar todos os clientes para criar agendamentos
  const allClients = await prisma.client.findMany();
  const shop1Clients = allClients.filter(c => c.shopId === shop1.id);
  const shop2Clients = allClients.filter(c => c.shopId === shop2.id);
  
  // Buscar serviços
  const shop1Services = await prisma.service.findMany({ where: { shopId: shop1.id } });
  const shop2Services = await prisma.service.findMany({ where: { shopId: shop2.id } });

  // Criar mais agendamentos (passados, hoje, futuros)
  console.log('📅 Criando agendamentos variados...');
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Agendamentos passados (concluídos)
  for (let i = 0; i < 10; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - (i + 2));
    pastDate.setHours(10 + (i % 8), 0, 0, 0);
    
    const client = shop1Clients[i % shop1Clients.length];
    const service = shop1Services[i % shop1Services.length];
    
    await prisma.appointment.create({
      data: {
        shopId: shop1.id,
        barberId: barber1.id,
        clientId: client.id,
        date: pastDate,
        status: AppointmentStatus.COMPLETED,
        totalPrice: service.price,
        createdBy: admin1.id,
        services: {
          create: [{
            serviceId: service.id,
          }],
        },
      },
    });
  }

  // Agendamentos de hoje
  for (let i = 0; i < 5; i++) {
    const todayDate = new Date(now);
    todayDate.setHours(14 + i, 0, 0, 0);
    
    const client = shop1Clients[(i + 5) % shop1Clients.length];
    const service = shop1Services[(i + 1) % shop1Services.length];
    
    await prisma.appointment.create({
      data: {
        shopId: shop1.id,
        barberId: barber2.id,
        clientId: client.id,
        date: todayDate,
        status: i < 2 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        totalPrice: service.price,
        createdBy: admin1.id,
        services: {
          create: [{
            serviceId: service.id,
          }],
        },
      },
    });
  }

  // Agendamentos futuros
  for (let i = 0; i < 15; i++) {
    const appointDate = new Date(futureDate);
    appointDate.setDate(appointDate.getDate() + Math.floor(i / 5));
    appointDate.setHours(9 + (i % 10), 30, 0, 0);
    
    const isShop1 = i % 2 === 0;
    const clients = isShop1 ? shop1Clients : shop2Clients;
    const services = isShop1 ? shop1Services : shop2Services;
    const barberId = isShop1 ? barber1.id : barber3.id;
    const shopId = isShop1 ? shop1.id : shop2.id;
    const adminId = isShop1 ? admin1.id : admin2.id;
    
    const client = clients[i % clients.length];
    const service = services[i % services.length];
    
    await prisma.appointment.create({
      data: {
        shopId,
        barberId,
        clientId: client.id,
        date: appointDate,
        status: AppointmentStatus.SCHEDULED,
        totalPrice: service.price,
        createdBy: adminId,
        services: {
          create: [{
            serviceId: service.id,
          }],
        },
      },
    });
  }

  // Alguns agendamentos cancelados
  const canceledDate = new Date(now);
  canceledDate.setDate(canceledDate.getDate() + 3);
  for (let i = 0; i < 3; i++) {
    const client = shop2Clients[i % shop2Clients.length];
    const service = shop2Services[i % shop2Services.length];
    
    await prisma.appointment.create({
      data: {
        shopId: shop2.id,
        barberId: barber3.id,
        clientId: client.id,
        date: new Date(canceledDate.getTime() + i * 3600000),
        status: AppointmentStatus.CANCELLED,
        totalPrice: service.price,
        cancelReason: 'Cliente cancelou com antecedência',
        createdBy: admin2.id,
        services: {
          create: [{
            serviceId: service.id,
          }],
        },
      },
    });
  }

  // Horários bloqueados
  console.log('🚫 Criando horários bloqueados...');
  const blockDate1 = new Date(futureDate);
  blockDate1.setHours(12, 0, 0, 0);
  const blockDate2 = new Date(nextWeek);
  blockDate2.setHours(9, 0, 0, 0);

  await prisma.blockedTime.createMany({
    data: [
      {
        shopId: shop1.id,
        barberId: barber1.id,
        date: blockDate1,
        type: BlockedType.TIME,
        startTime: '12:00',
        endTime: '13:00',
        reason: 'Almoço',
      },
      {
        shopId: shop1.id,
        barberId: barber2.id,
        date: blockDate2,
        type: BlockedType.TIME,
        startTime: '09:00',
        endTime: '11:00',
        reason: 'Treinamento',
      },
      {
        shopId: shop2.id,
        barberId: barber3.id,
        date: blockDate1,
        type: BlockedType.TIME,
        startTime: '12:00',
        endTime: '13:00',
        reason: 'Reunião',
      },
    ],
  });

  // Mais avaliações
  console.log('⭐ Criando mais avaliações...');
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: AppointmentStatus.COMPLETED },
    take: 20,
  });

  const ratings = [5, 5, 5, 5, 4, 4, 4, 5, 5, 4, 3, 5, 5, 4, 5];
  const comments = [
    'Excelente atendimento! Muito profissional.',
    'Corte perfeito, voltarei com certeza!',
    'Ambiente agradável e barbeiro competente.',
    'Melhor barbearia da região!',
    'Ótimo serviço, recomendo.',
    'Muito bom, mas poderia ser mais rápido.',
    'Atendimento nota 10!',
    'Adorei o resultado, superou expectativas!',
    'Profissional dedicado e caprichoso.',
    'Sempre corto aqui, nunca decepciona.',
    'Bom corte, mas ambiente um pouco barulhento.',
    'Perfeito! Exatamente como pedi.',
    'Equipe muito atenciosa.',
    'Ótima experiência, voltarei!',
    'Serviço de qualidade.',
  ];

  for (let i = 0; i < Math.min(15, completedAppointments.length); i++) {
    const appointment = completedAppointments[i];
    await prisma.review.create({
      data: {
        barberId: appointment.barberId,
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        rating: ratings[i],
        comment: comments[i],
      },
    });
  }

  // Mais comandas/ordens de serviço
  console.log('🧾 Criando mais comandas...');
  const products = await prisma.product.findMany({ where: { shopId: shop1.id } });
  
  // Obter próximo número de ordem
  let orderNumber = 1;

  // Comandas abertas
  for (let i = 0; i < 3; i++) {
    const client = shop1Clients[i];
    const service = shop1Services[0];
    
    const order = await prisma.serviceOrder.create({
      data: {
        shopId: shop1.id,
        barberId: barber1.id,
        clientId: client.id,
        orderNumber: orderNumber++,
        status: OrderStatus.OPEN,
        subtotal: service.price,
        total: service.price,
      },
    });

    // Adicionar item de serviço
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        type: OrderItemType.SERVICE,
        serviceId: service.id,
        name: service.name,
        unitPrice: service.price,
        quantity: 1,
        total: service.price,
      },
    });
  }

  // Comandas finalizadas com produtos
  for (let i = 0; i < 5; i++) {
    const client = shop1Clients[i + 3];
    const service = shop1Services[i % shop1Services.length];
    const product = products[i % products.length];
    
    const totalAmount = service.price + product.price;
    
    const order = await prisma.serviceOrder.create({
      data: {
        shopId: shop1.id,
        barberId: barber2.id,
        clientId: client.id,
        orderNumber: orderNumber++,
        status: OrderStatus.COMPLETED,
        paymentMethod: i % 2 === 0 ? PaymentMethod.CASH : PaymentMethod.CREDIT_CARD,
        subtotal: totalAmount,
        total: totalAmount,
        completedAt: now,
        paidAt: now,
      },
    });

    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          type: OrderItemType.SERVICE,
          serviceId: service.id,
          name: service.name,
          unitPrice: service.price,
          quantity: 1,
          total: service.price,
        },
        {
          orderId: order.id,
          type: OrderItemType.PRODUCT,
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          total: product.price,
        },
      ],
    });
  }


  // FAQs para shop 1
  console.log('❓ Criando FAQs...');
  await prisma.barbershopFaq.createMany({
    data: [
      {
        shopId: shop1.id,
        question: 'Posso usar em qualquer unidade?',
        answer: 'Sim! Sua assinatura é válida em todas as unidades da nossa rede.',
        displayOrder: 1,
        active: true,
      },
      {
        shopId: shop1.id,
        question: 'Como funciona a renovação?',
        answer: 'A renovação é automática mensalmente no seu cartão de crédito cadastrado.',
        displayOrder: 2,
        active: true,
      },
      {
        shopId: shop1.id,
        question: 'Os créditos acumulam?',
        answer: 'Não. Os serviços incluídos no plano são válidos dentro do ciclo de 30 dias.',
        displayOrder: 3,
        active: true,
      },
      {
        shopId: shop1.id,
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Não temos fidelidade. Você pode cancelar quando quiser, sem multas.',
        displayOrder: 4,
        active: true,
      },
    ],
  });

  // ===== FATURAS E SISTEMA FINANCEIRO =====
  console.log('\n💰 Criando faturas e dados financeiros...');

  // Faturas PAGAS (últimos 30 dias) - Para analytics
  const todayFinancial = new Date();
  const thirtyDaysAgo = new Date(todayFinancial);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fatura 1: Serviço pago (João - há 25 dias)
  const invoice1Date = new Date(todayFinancial);
  invoice1Date.setDate(invoice1Date.getDate() - 25);
  const invoice1 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id,
      clientName: client1.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PAID,
      amount: 80.0,
      description: 'Corte Clássico + Barba Completa',
      paymentMethod: PaymentMethod.PIX,
      paidAt: invoice1Date,
      barberId: barber1.id,
      createdAt: invoice1Date,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        type: InvoiceType.SERVICE,
        serviceId: service1.id,
        name: 'Corte Clássico',
        price: 50.0,
        quantity: 1,
      },
      {
        invoiceId: invoice1.id,
        type: InvoiceType.SERVICE,
        serviceId: service2.id,
        name: 'Barba Completa',
        price: 30.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 2: Produto pago (há 20 dias)
  const invoice2Date = new Date(todayFinancial);
  invoice2Date.setDate(invoice2Date.getDate() - 20);
  const invoice2 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id,
      clientName: client2.name,
      type: InvoiceType.PRODUCT,
      status: InvoiceStatus.PAID,
      amount: 90.0,
      description: 'Compra de produtos',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paidAt: invoice2Date,
      createdAt: invoice2Date,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice2.id,
        type: InvoiceType.PRODUCT,
        productId: product1.id,
        name: 'Pomada Modeladora Strong',
        price: 45.0,
        quantity: 2,
      },
    ],
  });

  // Fatura 3: Serviço pago (Pedro - há 15 dias)
  const invoice3Date = new Date(todayFinancial);
  invoice3Date.setDate(invoice3Date.getDate() - 15);
  const invoice3 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client3.id,
      clientName: client3.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PAID,
      amount: 70.0,
      description: 'Corte + Sobrancelha',
      paymentMethod: PaymentMethod.DEBIT_CARD,
      paidAt: invoice3Date,
      barberId: barber2.id,
      createdAt: invoice3Date,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice3.id,
        type: InvoiceType.SERVICE,
        serviceId: service1.id,
        name: 'Corte Clássico',
        price: 50.0,
        quantity: 1,
      },
      {
        invoiceId: invoice3.id,
        type: InvoiceType.SERVICE,
        serviceId: service4.id,
        name: 'Sobrancelha',
        price: 20.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 4: Serviço pago em DINHEIRO (há 10 dias)
  const invoice4Date = new Date(todayFinancial);
  invoice4Date.setDate(invoice4Date.getDate() - 10);
  const invoice4 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id, // Reutilizando client1
      clientName: client1.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PAID,
      amount: 120.0,
      description: 'Corte Premium + Barba + Hidratação',
      paymentMethod: PaymentMethod.CASH,
      paidAt: invoice4Date,
      barberId: barber1.id,
      createdAt: invoice4Date,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice4.id,
        type: InvoiceType.SERVICE,
        serviceId: service3.id,
        name: 'Corte Premium',
        price: 70.0,
        quantity: 1,
      },
      {
        invoiceId: invoice4.id,
        type: InvoiceType.SERVICE,
        serviceId: service2.id,
        name: 'Barba Completa',
        price: 30.0,
        quantity: 1,
      },
      {
        invoiceId: invoice4.id,
        type: InvoiceType.SERVICE,
        serviceId: service7.id,
        name: 'Hidratação',
        price: 20.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 5: Produto pago (há 7 dias)
  const invoice5Date = new Date(todayFinancial);
  invoice5Date.setDate(invoice5Date.getDate() - 7);
  const invoice5 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id, // Reutilizando client2
      clientName: client2.name,
      type: InvoiceType.PRODUCT,
      status: InvoiceStatus.PAID,
      amount: 120.0,
      description: 'Kit completo de produtos',
      paymentMethod: PaymentMethod.PIX,
      paidAt: invoice5Date,
      createdAt: invoice5Date,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice5.id,
        type: InvoiceType.PRODUCT,
        productId: product2.id,
        name: 'Shampoo Anticaspa Professional',
        price: 35.0,
        quantity: 2,
      },
      {
        invoiceId: invoice5.id,
        type: InvoiceType.PRODUCT,
        productId: product3.id,
        name: 'Óleo para Barba Premium',
        price: 50.0,
        quantity: 1,
      },
    ],
  });

  // Faturas HOJE (para caixa operacional)
  console.log('💵 Criando movimentações de hoje...');

  // Fatura 6: Serviço PAGO hoje (João - manhã)
  const todayMorning = new Date(todayFinancial);
  todayMorning.setHours(10, 30, 0, 0);
  const invoice6 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client3.id, // Reutilizando client3
      clientName: client3.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PAID,
      amount: 50.0,
      description: 'Corte Clássico',
      paymentMethod: PaymentMethod.PIX,
      paidAt: todayMorning,
      barberId: barber1.id,
      createdAt: todayMorning,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice6.id,
      type: InvoiceType.SERVICE,
      serviceId: service1.id,
      name: 'Corte Clássico',
      price: 50.0,
      quantity: 1,
    },
  });

  // Fatura 7: Serviço PAGO hoje (Pedro - tarde)
  const todayAfternoon = new Date(todayFinancial);
  todayAfternoon.setHours(14, 0, 0, 0);
  const invoice7 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id, // Reutilizando client1
      clientName: client1.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PAID,
      amount: 100.0,
      description: 'Corte Premium + Barba',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paidAt: todayAfternoon,
      barberId: barber2.id,
      createdAt: todayAfternoon,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice7.id,
        type: InvoiceType.SERVICE,
        serviceId: service3.id,
        name: 'Corte Premium',
        price: 70.0,
        quantity: 1,
      },
      {
        invoiceId: invoice7.id,
        type: InvoiceType.SERVICE,
        serviceId: service2.id,
        name: 'Barba Completa',
        price: 30.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 8: Produto PAGO hoje
  const todayEvening = new Date(todayFinancial);
  todayEvening.setHours(16, 30, 0, 0);
  const invoice8 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id, // Reutilizando client2
      clientName: client2.name,
      type: InvoiceType.PRODUCT,
      status: InvoiceStatus.PAID,
      amount: 45.0,
      description: 'Pomada Modeladora',
      paymentMethod: PaymentMethod.DEBIT_CARD,
      paidAt: todayEvening,
      createdAt: todayEvening,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice8.id,
      type: InvoiceType.PRODUCT,
      productId: product1.id,
      name: 'Pomada Modeladora Strong',
      price: 45.0,
      quantity: 1,
    },
  });

  // Fatura 9: Serviço PENDENTE hoje (aguardando pagamento)
  const todayLate = new Date(todayFinancial);
  todayLate.setHours(18, 0, 0, 0);
  const invoice9 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client3.id, // Reutilizando client3
      clientName: client3.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.PENDING,
      amount: 80.0,
      description: 'Corte + Barba (Aguardando pagamento)',
      barberId: barber1.id,
      createdAt: todayLate,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice9.id,
        type: InvoiceType.SERVICE,
        serviceId: service1.id,
        name: 'Corte Clássico',
        price: 50.0,
        quantity: 1,
      },
      {
        invoiceId: invoice9.id,
        type: InvoiceType.SERVICE,
        serviceId: service2.id,
        name: 'Barba Completa',
        price: 30.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 10: Produto PENDENTE hoje
  const todayNight = new Date(todayFinancial);
  todayNight.setHours(19, 15, 0, 0);
  const invoice10 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client1.id, // Reutilizando client1
      clientName: client1.name,
      type: InvoiceType.PRODUCT,
      status: InvoiceStatus.PENDING,
      amount: 85.0,
      description: 'Shampoo + Óleo (Aguardando pagamento)',
      createdAt: todayNight,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice10.id,
        type: InvoiceType.PRODUCT,
        productId: product2.id,
        name: 'Shampoo Anticaspa Professional',
        price: 35.0,
        quantity: 1,
      },
      {
        invoiceId: invoice10.id,
        type: InvoiceType.PRODUCT,
        productId: product3.id,
        name: 'Óleo para Barba Premium',
        price: 50.0,
        quantity: 1,
      },
    ],
  });

  // Fatura 11: Serviço CANCELADO (exemplo)
  const invoice11Date = new Date(todayFinancial);
  invoice11Date.setDate(invoice11Date.getDate() - 5);
  const invoice11 = await prisma.invoice.create({
    data: {
      shopId: shop1.id,
      clientId: client2.id, // Reutilizando client2
      clientName: client2.name,
      type: InvoiceType.SERVICE,
      status: InvoiceStatus.CANCELLED,
      amount: 50.0,
      description: 'Corte Clássico (Cancelado)',
      barberId: barber1.id,
      createdAt: invoice11Date,
      cancelledAt: invoice11Date,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice11.id,
      type: InvoiceType.SERVICE,
      serviceId: service1.id,
      name: 'Corte Clássico',
      price: 50.0,
      quantity: 1,
    },
  });

  // Mais faturas dos últimos 30 dias para enriquecer analytics
  console.log('📊 Criando mais dados para analytics...');

  // Faturas semana passada (5 faturas PAGAS)
  for (let i = 0; i < 5; i++) {
    const invoiceDate = new Date(todayFinancial);
    invoiceDate.setDate(invoiceDate.getDate() - (7 + i));
    
    const randomClient = [client1, client2, client3][i % 3]; // Alternando entre os 3 clientes
    const randomBarber = i % 2 === 0 ? barber1 : barber2;
    const randomMethod = [PaymentMethod.PIX, PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD][i % 4];
    
    const invoice = await prisma.invoice.create({
      data: {
        shopId: shop1.id,
        clientId: randomClient.id,
        clientName: randomClient.name,
        type: InvoiceType.SERVICE,
        status: InvoiceStatus.PAID,
        amount: 60.0 + (i * 10),
        description: `Atendimento ${i + 1}`,
        paymentMethod: randomMethod,
        paidAt: invoiceDate,
        barberId: randomBarber.id,
        createdAt: invoiceDate,
      },
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        type: InvoiceType.SERVICE,
        serviceId: service1.id,
        name: 'Corte Clássico',
        price: 60.0 + (i * 10),
        quantity: 1,
      },
    });
  }

  const totalInvoices = await prisma.invoice.count();
  const totalInvoiceItems = await prisma.invoiceItem.count();

  console.log(`✅ ${totalInvoices} Faturas criadas`);
  console.log(`✅ ${totalInvoiceItems} Itens de fatura criados`);

  // Contar totais

  console.log('🔗 Concedendo acesso do Admin às lojas (Franquia)...');
  await prisma.userShopAccess.createMany({
    data: [
      { userId: admin1.id, shopId: shop1.id, role: UserRole.ADMIN },
      { userId: admin1.id, shopId: shop2.id, role: UserRole.ADMIN },
      { userId: admin2.id, shopId: shop2.id, role: UserRole.ADMIN },
    ],
  });

  const totalUsers = await prisma.user.count();
  const totalBarbershops = await prisma.barbershop.count();
  const totalBarbers = await prisma.barber.count();
  const totalServices = await prisma.service.count();
  const totalProducts = await prisma.product.count();
  const totalClients = await prisma.client.count();
  const totalAppointments = await prisma.appointment.count();
  const totalOrders = await prisma.serviceOrder.count();
  const totalReviews = await prisma.review.count();
  const totalBlockedTimes = await prisma.blockedTime.count();
  const totalPlans = await prisma.plan.count();
  const totalCommissions = await prisma.barberCommission.count();

  console.log('\n✅ Seed COMPLETO concluído com sucesso!\n');
  console.log('📊 Resumo completo dos dados criados:');
  console.log(`  - ${totalBarbershops} Barbearias (ambas com plano PREMIUM)`);
  console.log(`  - ${totalUsers} Usuários (1 Super Admin + 2 Admins + membros da equipe + clientes)`);
  console.log(`  - ${totalBarbers} Membros da Equipe (barbeiros, cabeleireiras, manicure, recepcionistas, caixa, faxineiro)`);
  console.log(`  - ${totalPlans} Planos de Fidelidade para Clientes (3 por barbearia)`);
  console.log(`  - ${totalServices} Serviços`);
  console.log(`  - ${totalProducts} Produtos`);
  console.log(`  - ${totalClients} Clientes`);
  console.log(`  - ${totalAppointments} Agendamentos (passados, hoje, futuros, cancelados)`);
  console.log(`  - ${totalOrders} Comandas/Ordens de Serviço`);
  console.log(`  - ${totalReviews} Avaliações`);
  console.log(`  - ${totalBlockedTimes} Horários Bloqueados`);
  console.log(`  - ${totalCommissions} Configurações de Comissão\n`);
  
  console.log('💎 Planos de Assinatura:');
  console.log('  - Barbearia 1: PREMIUM (999 membros permitidos)');
  console.log('  - Barbearia 2: PREMIUM (999 membros permitidos)\n');
  
  console.log('🔐 Credenciais de teste:');
  console.log('  Super Admin: superadmin@barberpro.com / senha123');
  console.log('  Admin Shop 1: admin@barberpro.com / senha123');
  console.log('  Admin Shop 2: maria@barberpro.com / senha123');
  console.log('  Barbeiro João: joao@barberpro.com / senha123');
  console.log('  Barbeiro Pedro: pedro@barberpro.com / senha123');
  console.log('  Cabeleireira Marina: marina@barberpro.com / senha123');
  console.log('  Manicure Juliana: juliana@barberpro.com / senha123');
  console.log('  Recepcionista Carla: carla@barberpro.com / senha123');
  console.log('  Caixa Roberto: roberto.almeida@barberpro.com / senha123');
  console.log('  Cliente Roberto: roberto@email.com / senha123\n');
  
  console.log('🎉 Banco de dados completamente populado para testes!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
