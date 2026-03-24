import { PrismaClient, AppointmentStatus, OrderStatus, OrderItemType, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shopId = '46fd2604-1d7f-4943-96f6-7a69523738d8'; // KlypBarber Centro
  
  console.log('🚀 Iniciando geração de dados históricos (Mock Data)...');
  
  // 1. Buscar a barbearia e seus recursos
  const shop = await prisma.barbershop.findUnique({
    where: { id: shopId },
    include: {
      barbers: true,
      services: true,
      clients: true,
    }
  });

  if (!shop) {
    console.error('❌ Barbearia não encontrada. Execute o seed.ts primeiro.');
    return;
  }

  // Buscar o admin para ser o criador dos agendamentos
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@klypbarber.com' }
  });

  if (!admin) {
    console.error('❌ Usuário admin não encontrado.');
    return;
  }

  const barbers = shop.barbers;
  const services = shop.services;
  const clients = shop.clients;

  if (barbers.length === 0 || services.length === 0 || clients.length === 0) {
    console.error('❌ Dados insuficientes (barbeiros, serviços ou clientes).');
    return;
  }

  // 2. Definir período: últimos 45 dias
  const now = new Date();
  let orderNumber = 6000; // Começar de um número alto para evitar conflito

  console.log('📅 Gerando atendimentos para os últimos 45 dias...');

  for (let i = 45; i >= 0; i--) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() - i);
    
    // Pular domingos
    if (currentDate.getDay() === 0) continue;

    // Número fixo de atendimentos para garantir volume
    const appointmentsPerDay = 6 + Math.floor(Math.random() * 5); 
    
    console.log(`  - dia ${currentDate.toLocaleDateString()}: ${appointmentsPerDay} atendimentos`);

    for (let j = 0; j < appointmentsPerDay; j++) {
      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      
      // Definir hora aleatória entre 09:00 e 19:00
      const appointmentDate = new Date(currentDate);
      appointmentDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 2) * 30, 0, 0);

      // Criar Agendamento
      const appointment = await prisma.appointment.create({
        data: {
          shopId: shop.id,
          barberId: barber.id,
          clientId: client.id,
          date: appointmentDate,
          status: AppointmentStatus.COMPLETED,
          totalPrice: service.price,
          createdBy: admin.id,
        }
      });

      // Vincular serviço ao agendamento
      await prisma.appointmentService.create({
        data: {
          appointmentId: appointment.id,
          serviceId: service.id,
        }
      });

      // Calcular comissão (simplificado: usar 50%)
      const commissionRate = barber.commissionRate || 50;
      const commissionValue = (service.price * commissionRate) / 100;

      // Criar Ordem de Serviço (Comanda) finalizada
      const order = await prisma.serviceOrder.create({
        data: {
          shopId: shop.id,
          appointmentId: appointment.id,
          barberId: barber.id,
          clientId: client.id,
          orderNumber: orderNumber++,
          status: OrderStatus.COMPLETED,
          subtotal: service.price,
          total: service.price,
          paymentMethod: Math.random() > 0.3 ? PaymentMethod.CREDIT_CARD : PaymentMethod.CASH,
          completedAt: appointmentDate,
          paidAt: appointmentDate,
        }
      });

      // Adicionar item na ordem
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          type: OrderItemType.SERVICE,
          serviceId: service.id,
          name: service.name,
          unitPrice: service.price,
          quantity: 1,
          total: service.price,
          commissionRate: commissionRate,
          commissionValue: commissionValue,
        }
      });
    }
  }

  console.log('\n✅ Mock Data gerado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
