import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly serviceOrdersService: ServiceOrdersService,
  ) { }

  async create(requester: any, dto: CreateAppointmentDto) {
    let effectiveShopId = requester.shopId;

    // CLIENT não tem shopId no JWT — inferir a partir do barbeiro informado
    if (requester.role === 'CLIENT' || requester.role === UserRole.CLIENT) {
      if (!dto.barberId) {
        throw new BadRequestException('barberId é obrigatório para realizar um agendamento');
      }
      // Buscar o shopId real a partir do barbeiro
      const barberForShop = await this.prisma.barber.findUnique({
        where: { id: dto.barberId },
        select: { shopId: true },
      });
      if (!barberForShop) {
        throw new NotFoundException('Barbeiro não encontrado');
      }
      effectiveShopId = barberForShop.shopId;
    }

    if (!effectiveShopId) {
      this.logger.error(`[CREATE APPOINTMENT] Sem barbearia vinculada. Requester Role: ${requester.role}, BarberID: ${dto.barberId}, Requester Shop: ${requester.shopId}`);
      throw new ForbiddenException('Sem barbearia vinculada');
    }

    let effectiveClientId = dto.clientId;
    let effectiveBarberId = dto.barberId;

    if (requester.role === 'CLIENT' || requester.role === UserRole.CLIENT) {
      // Substituir requester.shopId pelo shopId inferido para que resolveRequesterClient funcione
      const requesterWithShop = { ...requester, shopId: effectiveShopId };
      const requesterClient = await this.resolveRequesterClient(requesterWithShop);
      if (!requesterClient) {
        throw new ForbiddenException('Não foi possível vincular o perfil de cliente à barbearia');
      }
      if (dto.clientId && dto.clientId !== requesterClient.id) {
        throw new ForbiddenException('CLIENT só pode agendar para si próprio');
      }
      effectiveClientId = requesterClient.id;
      effectiveBarberId = dto.barberId;
    }

    if (requester.role === UserRole.BARBER) {
      const requesterBarber = await this.resolveRequesterBarber(requester);
      if (!requesterBarber) {
        throw new ForbiddenException('Barbeiro autenticado não está vinculado a este tenant');
      }
      if (dto.barberId && dto.barberId !== requesterBarber.id) {
        throw new ForbiddenException('BARBER só pode agendar para si próprio');
      }
      effectiveBarberId = requesterBarber.id;

      // BARBER precisa informar clientId no payload
      if (!dto.clientId) {
        throw new BadRequestException('clientId é obrigatório para BARBER');
      }
      effectiveClientId = dto.clientId;
    }

    // ADMIN/SUPER_ADMIN precisam informar ambos no payload
    if (requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN) {
      if (!dto.clientId || !dto.barberId) {
        throw new BadRequestException('clientId e barberId são obrigatórios para ADMIN');
      }
      effectiveClientId = dto.clientId;
      effectiveBarberId = dto.barberId;
    }

    const scheduledFor = new Date(dto.date);
    const now = new Date();

    // ========== VALIDAÇÃO: Data não pode estar no passado ==========
    // Para CLIENTE: validação estrita (não pode agendar para horário passado)
    // Para BARBER/ADMIN: pode criar agendamento retroativo no mesmo dia (ex: cliente walk-in)
    const isClientRole = requester.role === UserRole.CLIENT;
    const isPastDate = scheduledFor < now;
    const isSameDay =
      scheduledFor.getFullYear() === now.getFullYear() &&
      scheduledFor.getMonth() === now.getMonth() &&
      scheduledFor.getDate() === now.getDate();

    if (isClientRole && isPastDate) {
      throw new BadRequestException('Não é possível agendar para data/hora passada');
    }

    // Para qualquer papel: não pode agendar para datas anteriores ao dia atual
    if (!isSameDay && scheduledFor < now) {
      throw new BadRequestException('Não é possível agendar para dias anteriores ao de hoje');
    }

    // Valida que cliente e barbeiro pertencem ao shop
    const [client, barber, services, shop] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: effectiveClientId } }),
      this.prisma.barber.findUnique({ where: { id: effectiveBarberId } }),
      this.prisma.service.findMany({
        where: {
          id: { in: dto.serviceIds },
          shopId: effectiveShopId,
          active: true,
          deletedAt: null,
        },
      }),
      this.prisma.barbershop.findUnique({ where: { id: effectiveShopId } }),
    ]);

    if (!client || client.shopId !== effectiveShopId) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // ========== VALIDAÇÃO 3: Barbeiro deve estar ativo ==========
    if (!barber || barber.shopId !== effectiveShopId || !barber.active) {
      throw new BadRequestException('Barbeiro indisponível');
    }

    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException(
        'Um ou mais serviços não encontrados/ativos para esta barbearia',
      );
    }

    // Calcula horários
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const endAt = new Date(scheduledFor.getTime() + totalDuration * 60000);

    // ========== VALIDAÇÃO 4: Horário de funcionamento ==========
    // 🛡️ CORREÇÃO SÊNIOR: Converter para fuso de Brasília antes de validar horário de expediente
    // Se o servidor for UTC, getHours() retornará o valor errado para comparação com strings locais.
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    });

    const startTime = formatter.format(scheduledFor);
    const endTime = formatter.format(endAt);

    if (startTime < shop.openingTime || endTime > shop.closingTime) {
      throw new BadRequestException(
        `Horário fora do expediente. Funcionamento: ${shop.openingTime} - ${shop.closingTime} (Seu horário: ${startTime})`,
      );
    }

    // ========== VALIDAÇÃO 5: Verificar conflitos de horário ==========
    await this.checkAppointmentConflicts(barber.id, effectiveShopId, scheduledFor, endAt);

    // ========== VALIDAÇÃO 6: Verificar horários bloqueados ==========
    await this.checkBlockedTimeConflicts(barber.id, effectiveShopId, scheduledFor);

    // Calcula preço total
    let totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // Adiciona produtos se houver
    const productData = [];
    if (dto.products && dto.products.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: dto.products.map((p) => p.id) },
          shopId: effectiveShopId,
          active: true,
          deletedAt: null,
        },
      });

      for (const productDto of dto.products) {
        const product = products.find((p) => p.id === productDto.id);
        if (!product || product.shopId !== effectiveShopId) {
          throw new NotFoundException(`Produto ${productDto.id} não encontrado`);
        }

        if (product.stock < productDto.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`,
          );
        }

        totalPrice += product.price * productDto.quantity;
        productData.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: productDto.quantity,
        });
      }
    }

    // ========== CRIAR AGENDAMENTO COM AUDITORIA ==========
    const appointment = await this.prisma.appointment.create({
      data: {
        shopId: effectiveShopId,
        clientId: effectiveClientId,
        barberId: effectiveBarberId,
        date: scheduledFor,
        status: AppointmentStatus.SCHEDULED,
        totalPrice,
        totalDuration,
        notes: dto.notes,
        reminderEnabled: dto.reminderEnabled ?? true, // 🛡️ LGPD: respeitar preferência do cliente
        createdBy: requester.id, // 🔥 AUDITORIA
        updatedBy: requester.id, // 🔥 AUDITORIA
        services: {
          create: dto.serviceIds.map((serviceId) => ({ serviceId })),
        },
        ...(productData.length > 0 && {
          products: { create: productData },
        }),
      },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    // Atualiza estoque de produtos
    if (productData.length > 0) {
      for (const productDto of dto.products!) {
        await this.prisma.product.update({
          where: { id: productDto.id },
          data: { stock: { decrement: productDto.quantity } },
        });
      }
    }

    // 📝 LOG ESTRUTURADO
    this.logger.log({
      action: 'APPOINTMENT_CREATED',
      userId: requester.id,
      appointmentId: appointment.id,
      clientId: effectiveClientId,
      barberId: effectiveBarberId,
      date: scheduledFor.toISOString(),
      totalPrice,
      totalDuration,
    });

    await this.logAction(
      'CREATE',
      appointment.id,
      requester.id,
      effectiveShopId,
      'Agendamento criado',
    );

    // 🔔 ENVIAR NOTIFICAÇÃO PARA O BARBEIRO
    try {
      await this.notificationsService.notifyNewAppointment(appointment, barber, client, services);
    } catch (error) {
      this.logger.warn('Erro ao enviar notificação, mas agendamento foi criado', error);
    }

    return appointment;
  }

  private async resolveRequesterClient(requester: any) {
    let client = await this.prisma.client.findFirst({
      where: {
        shopId: requester.shopId,
        active: true,
        userId: requester.id,
      },
      select: { id: true },
    });

    if (!client) {
      const user = await this.prisma.user.findUnique({
        where: { id: requester.id },
      });
      if (user && user.role === 'CLIENT') {
        client = await this.prisma.client.create({
          data: {
            shopId: requester.shopId,
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '00000000000',
            active: true,
          },
          select: { id: true },
        });
      }
    }

    return client;
  }

  private async resolveRequesterBarber(requester: any) {
    return this.prisma.barber.findFirst({
      where: {
        shopId: requester.shopId,
        active: true,
        userId: requester.id,
      },
      select: { id: true },
    });
  }

  async findAll(
    requester: any,
    filters?: { 
      date?: string; 
      startDate?: string; 
      endDate?: string; 
      barberId?: string; 
      status?: AppointmentStatus 
    },
  ) {
    if (!requester.shopId) throw new ForbiddenException('Sem barbearia vinculada');

    const where: any = {
      shopId: requester.shopId,
      deletedAt: null, // 🔥 Não retornar deletados (soft delete)
    };

    if (filters?.date) {
      // 🇧🇷 Ajuste para fuso de Brasília (UTC-3)
      // Se filtrarmos apenas pelo dia UTC, agendamentos após as 21:00 local 
      // desaparecem da lista do dia atual pois viram o dia seguinte em UTC.
      
      const startOfDay = new Date(filters.date); // YYYY-MM-DD vira 00:00 UTC no server
      startOfDay.setHours(startOfDay.getHours() + 3); // Ajusta para 03:00 UTC (00:00 Brasília)
      
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(endOfDay.getHours() + 24); // Próximo dia (00:00 Brasília / 03:00 UTC)
      
      where.date = { gte: startOfDay, lt: endOfDay };
    } else if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    if (filters?.barberId) {
      where.barberId = filters.barberId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // CLIENT só vê próprios agendamentos
    if (requester.role === UserRole.CLIENT) {
      const client = await this.resolveRequesterClient(requester);
      if (client) {
        where.clientId = client.id;
      } else {
        return []; // Se não conseguiu resolver/criar o cliente, retorna vazio em vez de 403
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
        serviceOrder: {
          include: {
            items: {
              include: {
                service: true,
                product: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(requester: any, id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
        serviceOrder: {
          include: {
            items: {
              include: {
                service: true,
                product: true,
              },
            },
          },
        },
      },
    });

    if (!appointment || appointment.shopId !== requester.shopId || appointment.deletedAt) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  // ========== NOVO MÉTODO: REAGENDAR ==========
  async reschedule(requester: any, id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        client: true,
        barber: true,
      },
    });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Apenas agendamentos com status SCHEDULED podem ser reagendados',
      );
    }

    const now = new Date();

    // Trava de 1 Hora (Go-Live)
    if (requester.role === UserRole.CLIENT) {
      const diffInMinutes = (appointment.date.getTime() - now.getTime()) / 60000;
      if (diffInMinutes < 60) {
        throw new ForbiddenException(
          'Clientes não podem alterar ou cancelar agendamentos faltando menos de 1 hora para o início. Entre em contato com a barbearia.',
        );
      }
    }

    const newDate = new Date(dto.date);
    const oldDate = appointment.date;

    // Re-aplicar todas as validações de data/hora
    if (newDate <= now) {
      throw new BadRequestException('Não é possível reagendar para data/hora passada');
    }

    const isSameDay =
      newDate.getFullYear() === now.getFullYear() &&
      newDate.getMonth() === now.getMonth() &&
      newDate.getDate() === now.getDate();

    if (isSameDay && newDate <= now) {
      const minTime = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new BadRequestException(
        `Não é possível reagendar para horário anterior. Horário mínimo para hoje: ${minTime}`,
      );
    }

    // Calcular duração total
    const totalDuration = appointment.services.reduce((sum, s) => sum + s.service.duration, 0);
    const newEndAt = new Date(newDate.getTime() + totalDuration * 60000);

    // Validar horário de funcionamento
    const shop = await this.prisma.barbershop.findUnique({ where: { id: appointment.shopId } });
    const startTime = `${newDate.getHours().toString().padStart(2, '0')}:${newDate.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${newEndAt.getHours().toString().padStart(2, '0')}:${newEndAt.getMinutes().toString().padStart(2, '0')}`;

    if (startTime < shop.openingTime || endTime > shop.closingTime) {
      throw new BadRequestException(
        `Horário fora do expediente. Funcionamento: ${shop.openingTime} - ${shop.closingTime}`,
      );
    }

    // Verificar conflitos (excluindo o próprio agendamento)
    await this.checkAppointmentConflicts(
      appointment.barberId,
      appointment.shopId,
      newDate,
      newEndAt,
      id, // Excluir este agendamento da verificação
    );

    // Verificar horários bloqueados
    await this.checkBlockedTimeConflicts(appointment.barberId, appointment.shopId, newDate);

    // Atualizar
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        updatedAt: new Date(),
        updatedBy: requester.id, // 🔥 AUDITORIA
      },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    // 📝 LOG
    this.logger.log({
      action: 'APPOINTMENT_RESCHEDULED',
      userId: requester.id,
      appointmentId: id,
      oldDate: oldDate.toISOString(),
      newDate: newDate.toISOString(),
    });

    await this.logAction(
      'RESCHEDULE',
      id,
      requester.id,
      requester.shopId,
      `Reagendado de ${oldDate.toLocaleString('pt-BR')} para ${newDate.toLocaleString('pt-BR')}`,
    );

    // 🔔 NOTIFICAR BARBEIRO
    try {
      await this.notificationsService.notifyRescheduled(
        updated,
        appointment.barber,
        appointment.client,
        oldDate,
        newDate,
      );
    } catch (error) {
      this.logger.warn('Erro ao enviar notificação de reagendamento', error);
    }

    return updated;
  }

  async countMonthlyCancellations(barberId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.prisma.appointment.count({
      where: {
        barberId,
        status: AppointmentStatus.CANCELLED_BY_BARBER,
        cancelledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
  }

  async countWeeklyCancellations(barberId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Início da semana (Domingo)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.prisma.appointment.count({
      where: {
        barberId,
        status: AppointmentStatus.CANCELLED_BY_BARBER,
        cancelledAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });
  }

  async cancel(requester: any, id: string, dto: CancelAppointmentDto) {
    // Validação já está no DTO: @IsNotEmpty, @MinLength(5)
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        barber: true,
      },
    });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Apenas agendamentos com status SCHEDULED podem ser cancelados',
      );
    }

    // Trava de 1 Hora (Go-Live)
    if (requester.role === UserRole.CLIENT) {
      const now = new Date();
      const diffInMinutes = (appointment.date.getTime() - now.getTime()) / 60000;
      if (diffInMinutes < 60) {
        throw new ForbiddenException(
          'Clientes não podem alterar ou cancelar agendamentos faltando menos de 1 hora para o início. Entre em contato com a barbearia.',
        );
      }
    }

    // Determinar quem está cancelando
    const isBarberOrAdmin = [UserRole.BARBER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
      requester.role,
    );

    const status = isBarberOrAdmin
      ? AppointmentStatus.CANCELLED_BY_BARBER
      : AppointmentStatus.CANCELLED;

    // ========== ATUALIZAR COM AUDITORIA DE CANCELAMENTO ==========
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        cancelledAt: new Date(), // 🔥 AUDITORIA
        cancelledBy: requester.id, // 🔥 AUDITORIA
        cancelReason: dto.cancelReason.trim(), // 🔥 AUDITORIA
        updatedAt: new Date(),
        updatedBy: requester.id,
      },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    // Restaurar estoque de produtos se houver
    const productsInAppointment = await this.prisma.appointmentProduct.findMany({
      where: { appointmentId: id },
    });

    for (const product of productsInAppointment) {
      await this.prisma.product.update({
        where: { id: product.productId },
        data: { stock: { increment: product.quantity } },
      });
    }

    // 📝 LOG
    this.logger.warn({
      action: 'APPOINTMENT_CANCELLED',
      userId: requester.id,
      userRole: requester.role,
      appointmentId: id,
      cancelledBy: isBarberOrAdmin ? 'BARBER/ADMIN' : 'CLIENT',
      reason: dto.cancelReason,
    });

    await this.logAction('CANCEL', id, requester.id, requester.shopId, dto.cancelReason);

    // 🔔 NOTIFICAR A OUTRA PARTE
    try {
      if (isBarberOrAdmin) {
        // Barbeiro/Admin cancelou → notificar cliente
        await this.notificationsService.notifyCancellationByBarber(
          updated,
          appointment.barber,
          appointment.client,
          dto.cancelReason,
        );

        // 🔥 ANTI-FRAUDE: Notificar Admin se for cancelamento por Barbeiro
        if (requester.role === UserRole.BARBER) {
          const monthlyCount = await this.countMonthlyCancellations(requester.barberId);
          const isSuspicious = monthlyCount >= 10;

          await this.notificationsService.notifyAdminOfCancellation(
            updated,
            appointment.barber,
            dto.cancelReason,
            isSuspicious,
            monthlyCount
          );

          if (isSuspicious) {
            await this.logAction(
              'SUSPICIOUS_CANCELLATION_LIMIT',
              id,
              requester.id,
              requester.shopId,
              `Barbeiro atingiu ${monthlyCount} cancelamentos no mês. Possível fraude.`
            );
          }
        }
      } else {
        // Cliente cancelou → notificar barbeiro
        await this.notificationsService.notifyCancellationByClient(
          updated,
          appointment.barber,
          appointment.client,
          dto.cancelReason,
        );
      }
    } catch (error) {
      this.logger.warn('Erro ao enviar notificação de cancelamento', error);
    }

    return updated;
  }

  async complete(requester: any, id: string, dto?: CompleteAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });

    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Apenas agendamentos com status SCHEDULED podem ser completados',
      );
    }

    // 🚀 Integrar com Ordem de Serviço
    // 1. Criar a OS baseada no agendamento
    const serviceOrder = await this.serviceOrdersService.create(requester, {
      clientId: appointment.clientId,
      barberId: appointment.barberId,
      appointmentId: appointment.id,
      items: [
        ...appointment.services.map(s => ({
          type: 'SERVICE' as any,
          serviceId: s.serviceId,
          name: s.service.name,
          quantity: 1,
          unitPrice: s.service.price,
        })),
        ...(dto?.products || []).map(p => ({
          type: 'PRODUCT' as any,
          productId: p.id,
          name: 'Produto Extra', // O ServiceOrdersService buscará o nome real se necessário ou podemos buscar aqui
          quantity: p.quantity,
          unitPrice: 0, // Será calculado pelo ServiceOrdersService.addItem se passarmos 0? 
          // Melhor: ServiceOrdersService.addItem já busca o preço se não formos cuidadosos.
          // Vamos ajustar o loop de itens.
        })),
      ],
    });

    // Se houver produtos extras no DTO que não estavam na criação inicial (ou simplificar adicionando depois)
    // Na verdade, o `create` acima já aceita itens. O ServiceOrdersService.create chama addItem internamente.

    // 2. Finalizar a comanda (isso atualizará o status do agendamento para COMPLETED internamente no ServiceOrdersService)
    // Mas o ServiceOrdersService.complete requer um método de pagamento. Vamos usar CASH por padrão ou do DTO.
    await this.serviceOrdersService.complete(requester, serviceOrder.id, {
      paymentMethod: 'CASH', // Valor padrão para MVP, pode ser estendido
      discount: 0,
    });

    // 📝 LOG
    this.logger.log({
      action: 'APPOINTMENT_COMPLETED_VIA_OS',
      userId: requester.id,
      appointmentId: id,
      serviceOrderId: serviceOrder.id,
    });

    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        products: { include: { product: true } },
        client: true,
        barber: true,
      },
    });
  }

  // ========== MÉTODO AUXILIAR: Verificar conflitos de horário ==========
  private async checkAppointmentConflicts(
    barberId: string,
    shopId: string,
    newStartAt: Date,
    newEndAt: Date,
    excludeAppointmentId?: string,
  ) {
    // Buscar todos os agendamentos SCHEDULED do barbeiro no dia
    const startOfDay = new Date(newStartAt);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(newStartAt);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        shopId,
        status: AppointmentStatus.SCHEDULED,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
      include: {
        services: { include: { service: true } },
      },
    });

    // Verificar overlap entre horários
    for (const apt of appointments) {
      const aptStart = new Date(apt.date);
      const aptDuration = apt.services.reduce((sum, s) => sum + s.service.duration, 0);
      const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);

      // Verifica se há sobreposição entre [newStartAt, newEndAt] e [aptStart, aptEnd]
      const hasOverlap =
        (newStartAt >= aptStart && newStartAt < aptEnd) || // Início do novo está dentro do existente
        (newEndAt > aptStart && newEndAt <= aptEnd) || // Fim do novo está dentro do existente
        (newStartAt <= aptStart && newEndAt >= aptEnd); // Novo envolve o existente completamente

      if (hasOverlap) {
        const aptStartFormatted = aptStart.toLocaleString('pt-BR');
        throw new ConflictException(
          `Horário indisponível. O barbeiro já possui agendamento às ${aptStartFormatted}.`,
        );
      }
    }
  }

  // ========== MÉTODO AUXILIAR: Verificar horários bloqueados ==========
  private async checkBlockedTimeConflicts(barberId: string, shopId: string, newStartAt: Date) {
    const blockedTime = await this.prisma.blockedTime.findFirst({
      where: {
        barberId,
        shopId,
        OR: [
          // DAY - bloqueia o dia inteiro
          {
            type: 'DAY',
            date: {
              gte: new Date(new Date(newStartAt).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(newStartAt).setHours(23, 59, 59, 999)),
            },
          },
          // TIME - bloqueia horário específico
          {
            type: 'TIME',
            date: newStartAt,
          },
          // RANGE - bloqueia período
          {
            type: 'RANGE',
            date: { lte: newStartAt },
            endDate: { gte: newStartAt },
          },
        ],
      },
    });

    if (blockedTime) {
      throw new ConflictException(
        `Horário bloqueado: ${blockedTime.reason || 'Barbeiro indisponível'}`,
      );
    }
  }

  // ========== PREFERENCES: Atualizar reminderEnabled clientside ==========
  async updatePreferences(requester: any, id: string, data: { reminderEnabled?: boolean }) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.shopId !== requester.shopId) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    // CLIENT só pode alterar os próprios agendamentos
    if (requester.role === 'CLIENT') {
      const client = await this.prisma.client.findFirst({ where: { userId: requester.id, shopId: requester.shopId } });
      if (!client || client.id !== appointment.clientId) {
        throw new ForbiddenException('Você só pode alterar seus próprios agendamentos');
      }
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { reminderEnabled: data.reminderEnabled, updatedBy: requester.id },
    });
  }
  private async logAction(
    action: string,
    entityId: string,
    userId: string,
    shopId: string,
    details: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entity: 'APPOINTMENT',
          entityId,
          userId,
          shopId,
          details,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao criar log de auditoria', error);
    }
  }

  // ========== SINCRONIZAÇÃO ICAL ==========
  async getBarberIcal(barberId: string, token: string): Promise<string> {
    const barber = await this.prisma.barber.findFirst({
      where: { id: barberId, iCalToken: token }
    });

    if (!barber) {
      throw new NotFoundException('Calendário não encontrado ou token inválido');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // últimos 30 dias até o futuro

    // Como essa requisição é Public() e não passa pelo TenantInterceptor (sem token JWT), 
    // o ALS shopId estará nulo, e o RLS será desativado. Nós explicitamente passamos o shopId
    // que pertence ao Barbeiro validado cima, garantindo a segurança de forma implícita manual.
    const appointments = await this.prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        shopId: barber.shopId,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED] },
        date: { gte: startDate }
      },
      include: {
        services: { include: { service: true } },
        client: true
      }
    });

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += `PRODID:-//KlypBarber//Agenda ${barber.name.replace(/\s/g, '')}//PT-BR\r\n`;
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += `X-WR-CALNAME:KlypBarber - ${barber.name}\r\n`;
    ical += 'X-WR-TIMEZONE:America/Sao_Paulo\r\n';

    for (const apt of appointments) {
      const dtStart = new Date(apt.date);
      const totalDuration = apt.services.reduce((sum, s) => sum + s.service.duration, 0);
      const dtEnd = new Date(dtStart.getTime() + totalDuration * 60000);

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const now = new Date();
      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${apt.id}@klypbarber.com\\r\\n`;
      ical += `DTSTAMP:${formatDate(now)}\r\n`;
      ical += `DTSTART:${formatDate(dtStart)}\r\n`;
      ical += `DTEND:${formatDate(dtEnd)}\r\n`;

      const serviceNames = apt.services.map(s => s.service.name).join(', ');
      ical += `SUMMARY:${apt.client.name} - ${serviceNames}\r\n`;

      let description = `Cliente: ${apt.client.name}\\nTelefone: ${apt.client.phone}\\nServiços: ${serviceNames}`;
      if (apt.notes) description += `\\nNotas: ${apt.notes}`;

      ical += `DESCRIPTION:${description}\r\n`;
      ical += `STATUS:${apt.status === 'COMPLETED' ? 'CONFIRMED' : 'TENTATIVE'}\r\n`;
      ical += 'END:VEVENT\r\n';
    }

    ical += 'END:VCALENDAR\r\n';

    return ical;
  }

  async sendManualReminder(id: string) {
    return this.notificationsService.sendManualReminder(id);
  }
}
