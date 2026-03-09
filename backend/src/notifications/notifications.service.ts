import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationChannel, NotificationPriority } from './dto/notification.enums';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_PORT === '465', // usa true apenas para 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async create(dto: CreateNotificationDto) {
    try {
      // 🛡️ LGPD Check: Validating global user preference
      const recipientUser = await this.prisma.user.findUnique({
        where: { id: dto.recipientId },
        select: { globalPushEnabled: true }
      });
      // Fallback para Clientes que não tem User associado mas têm ID
      const recipientClient = !recipientUser ? await this.prisma.client.findUnique({
        where: { id: dto.recipientId },
        select: { userId: true }
      }) : null;
      const finalUser = recipientUser || (recipientClient?.userId ? await this.prisma.user.findUnique({
        where: { id: recipientClient.userId },
        select: { globalPushEnabled: true }
      }) : null);

      if (finalUser && finalUser.globalPushEnabled === false) {
        this.logger.log(`Notificação abortada [LGPD]: Usuário ${dto.recipientId} desativou notificações globais.`);
        return { success: true, message: 'Abortado por preferência do usuário (LGPD)', channels: [] };
      }

      // 🛡️ LGPD Check: Validating specific appointment preference
      if (dto.data?.appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: String(dto.data.appointmentId) },
          select: { reminderEnabled: true }
        });
        if (appointment && appointment.reminderEnabled === false) {
          this.logger.log(`Notificação abortada [LGPD]: Lembrete isolado desativado para o agendamento ${dto.data.appointmentId}.`);
          return { success: true, message: 'Abortado por preferência do agendamento (LGPD)', channels: [] };
        }
      }

      this.logger.log({
        message: 'Notificação criada',
        type: dto.type,
        recipientId: dto.recipientId,
        title: dto.title,
        priority: dto.priority || NotificationPriority.NORMAL,
        channels: dto.channels || [NotificationChannel.IN_APP],
      });

      // Simular envio por diferentes canais
      const channels = dto.channels || [NotificationChannel.IN_APP];

      for (const channel of channels) {
        switch (channel) {
          case NotificationChannel.IN_APP:
            await this.sendInApp(dto);
            break;
          case NotificationChannel.EMAIL:
            await this.sendEmail(dto);
            break;
          case NotificationChannel.SMS:
            await this.sendSMS(dto);
            break;
          case NotificationChannel.PUSH:
            await this.sendPush(dto);
            break;
          case NotificationChannel.WHATSAPP:
            await this.sendWhatsApp(dto);
            break;
        }
      }

      return {
        success: true,
        message: 'Notificação enviada com sucesso',
        channels,
      };
    } catch (error) {
      this.logger.error('Erro ao criar notificação:', error);
      return {
        success: false,
        message: 'Erro ao enviar notificação',
        error: error.message,
      };
    }
  }

  private async sendInApp(dto: CreateNotificationDto) {
    this.logger.log(`[IN_APP] Notificação para ${dto.recipientId}: ${dto.title}`);
    // Aqui você poderia salvar no banco para consulta posterior
    // ou enviar via WebSocket para o cliente conectado
  }

  private async sendEmail(dto: CreateNotificationDto) {
    this.logger.log(`[EMAIL] Enviando email para ${dto.recipientId}: ${dto.title}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: dto.recipientId } });
      if (!user || !user.email) {
        this.logger.warn(`Email omitido: destinatário ${dto.recipientId} não possui email cadastrado.`);
        return;
      }

      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@barberpro.com',
        to: user.email,
        subject: dto.title,
        text: dto.message,
        html: `<p>${dto.message.replace(/\n/g, '<br>')}</p>`,
      });
      this.logger.log(`[EMAIL] Enviado com sucesso para ${user.email}`);
    } catch (error) {
      this.logger.error(`[EMAIL] Erro ao enviar email para ${dto.recipientId}:`, error);
    }
  }

  private async sendSMS(dto: CreateNotificationDto) {
    this.logger.log(`[SMS] Enviando SMS para ${dto.recipientId}: ${dto.title}`);
    await this.triggerWebhook(dto, 'SMS');
  }

  private async sendPush(dto: CreateNotificationDto) {
    this.logger.log(`[PUSH] Enviando push notification para ${dto.recipientId}: ${dto.title}`);
    // Implementar integração com serviço de push (Firebase Cloud Messaging, OneSignal, etc)
  }

  private async sendWhatsApp(dto: CreateNotificationDto) {
    this.logger.log(`[WHATSAPP] Enviando WhatsApp para ${dto.recipientId}: ${dto.title}`);
    await this.triggerWebhook(dto, 'WHATSAPP');
  }

  // Método auxiliar para disparar Webhook de WhatsApp e SMS
  private async triggerWebhook(dto: CreateNotificationDto, channel: string) {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn(`[${channel}] Webhook URL não configurada. Skip.`);
      return;
    }

    try {
      // Tentar encontrar o telefone baseado no recipient (pode ser User, Client ou Barber)
      let phone = null;
      let name = '';

      const client = await this.prisma.client.findFirst({ where: { OR: [{ id: dto.recipientId }, { userId: dto.recipientId }] } });
      if (client && client.phone) { phone = client.phone; name = client.name; }
      else {
        const barber = await this.prisma.barber.findFirst({ where: { OR: [{ id: dto.recipientId }, { userId: dto.recipientId }] } });
        if (barber && barber.phone) { phone = barber.phone; name = barber.name; }
      }

      if (!phone) {
        this.logger.warn(`[${channel}] Telefone não encontrado para o destinatário ${dto.recipientId}.`);
        return;
      }

      await axios.post(
        webhookUrl,
        {
          number: phone,
          text: dto.message,
          channel: channel,
          name: name
        },
        {
          headers: {
            'apikey': process.env.WHATSAPP_INSTANCE_KEY || '',
            'Content-Type': 'application/json'
          }
        }
      );
      this.logger.log(`[${channel}] Disparado sucesso webhook para telefone final: ${phone}`);
    } catch (error) {
      this.logger.error(`[${channel}] Erro ao disparar webhook:`, error.message);
    }
  }

  // Método helper para criar notificação de novo agendamento
  async notifyNewAppointment(appointment: any, barber: any, client: any, services: any[]) {
    const servicesText = services.map((s) => s.name).join(', ');
    const dateFormatted = new Date(appointment.date).toLocaleString('pt-BR');

    return this.create({
      type: 'NEW_APPOINTMENT' as any,
      recipientId: barber.id,
      title: 'Novo Agendamento',
      message: `${client.name} agendou ${servicesText} para ${dateFormatted}`,
      data: {
        appointmentId: appointment.id,
        clientId: client.id,
        date: appointment.date,
      },
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
    });
  }

  // Método helper para notificar cancelamento pelo cliente
  async notifyCancellationByClient(appointment: any, barber: any, client: any, reason: string) {
    const dateFormatted = new Date(appointment.date).toLocaleString('pt-BR');

    return this.create({
      type: 'APPOINTMENT_CANCELLED_BY_CLIENT' as any,
      recipientId: barber.id,
      title: 'Agendamento Cancelado',
      message: `${client.name} cancelou o agendamento de ${dateFormatted}. Motivo: ${reason}`,
      data: {
        appointmentId: appointment.id,
        clientId: client.id,
        date: appointment.date,
        reason,
      },
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
    });
  }

  // Método helper para notificar cancelamento pelo barbeiro
  async notifyCancellationByBarber(appointment: any, barber: any, client: any, reason: string) {
    const dateFormatted = new Date(appointment.date).toLocaleString('pt-BR');

    return this.create({
      type: 'APPOINTMENT_CANCELLED_BY_BARBER' as any,
      recipientId: client.id,
      title: 'Agendamento Cancelado',
      message: `Seu agendamento com ${barber.name} em ${dateFormatted} foi cancelado. Motivo: ${reason}`,
      data: {
        appointmentId: appointment.id,
        barberId: barber.id,
        date: appointment.date,
        reason,
      },
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
    });
  }

  // Método helper para notificar reagendamento
  async notifyRescheduled(
    appointment: any,
    barber: any,
    client: any,
    oldDate: Date,
    newDate: Date,
  ) {
    const oldDateFormatted = oldDate.toLocaleString('pt-BR');
    const newDateFormatted = newDate.toLocaleString('pt-BR');

    return this.create({
      type: 'APPOINTMENT_RESCHEDULED' as any,
      recipientId: barber.id,
      title: 'Agendamento Reagendado',
      message: `${client.name} reagendou de ${oldDateFormatted} para ${newDateFormatted}`,
      data: {
        appointmentId: appointment.id,
        clientId: client.id,
        oldDate,
        newDate,
      },
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
    });
  }

  // Método helper para notificar agendamento completado
  async notifyCompleted(appointment: any, client: any) {
    return this.create({
      type: 'APPOINTMENT_COMPLETED' as any,
      recipientId: client.id,
      title: 'Atendimento Concluído',
      message: 'Seu atendimento foi concluído! Que tal avaliar sua experiência?',
      data: {
        appointmentId: appointment.id,
      },
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP],
    });
  }

  // ==========================================
  // TRIGGERS AUTOMÁTICOS (CRON JOBS)
  // ==========================================

  // Executar a cada 1 hora para encontrar agendamentos nas próximas 2h
  @Cron(CronExpression.EVERY_HOUR)
  async handleUpcomingAppointmentsReminders() {
    this.logger.log('Executando trigger automatizado: Lembretes de 2h');
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Bypass do RLS para queries globais de infraestrutura
    // Usamos o Prisma "cruado" temporariamente porque jobs não carregam o Access Context do Tenant
    const rawPrisma = new (this.prisma as any).constructor();

    try {
      const appointments = await rawPrisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          date: { gte: inTwoHours, lt: inThreeHours },
        },
        include: { client: true, barber: true, services: { include: { service: true } } },
      });

      for (const apt of appointments) {
        // Verifica se já enviou
        const alreadySent = await rawPrisma.notificationLog.findFirst({
          where: { appointmentId: apt.id, type: 'REMINDER_2H' }
        });

        if (!alreadySent) {
          const message = `Olá ${apt.client.name}, seu agendamento com ${apt.barber.name} é em menos de 2 horas!`;

          await this.create({
            type: 'REMINDER_2H' as any,
            recipientId: apt.client.id,
            title: 'Lembrete de Agendamento',
            message,
            priority: NotificationPriority.HIGH,
            channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
            data: { appointmentId: apt.id }
          });

          await rawPrisma.notificationLog.create({
            data: {
              shopId: apt.shopId,
              clientId: apt.client.id,
              appointmentId: apt.id,
              type: 'REMINDER_2H',
              status: 'SENT',
              sentAt: new Date()
            }
          });
        }
      }
    } catch (err) {
      this.logger.error('Erro no cron de lembretes:', err);
    } finally {
      await rawPrisma.$disconnect();
    }
  }

  // Executar todo dia às 10h da manhã
  @Cron('0 10 * * *')
  async handleRetentionCampaigns() {
    this.logger.log('Executando trigger automatizado: Retorno 30 dias');
    const now = new Date();
    const thirtyDaysAgoStart = new Date(now);
    thirtyDaysAgoStart.setDate(now.getDate() - 30);
    thirtyDaysAgoStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgoEnd = new Date(thirtyDaysAgoStart);
    thirtyDaysAgoEnd.setHours(23, 59, 59, 999);

    const rawPrisma = new (this.prisma as any).constructor();

    try {
      // Clientes cujo ÚLTIMO agendamento foi há exatamente 30 dias atrás
      const appointments = await rawPrisma.appointment.findMany({
        where: {
          status: 'COMPLETED',
          date: { gte: thirtyDaysAgoStart, lt: thirtyDaysAgoEnd }
        },
        include: { client: true, barber: true },
      });

      for (const apt of appointments) {
        // Confirma se ele realmente não veio depos disso
        const recentApts = await rawPrisma.appointment.count({
          where: {
            clientId: apt.clientId,
            date: { gt: thirtyDaysAgoEnd },
            status: { notIn: ['CANCELLED', 'CANCELLED_BY_BARBER'] }
          }
        });

        if (recentApts === 0) {
          const alreadySent = await rawPrisma.notificationLog.findFirst({
            where: { clientId: apt.client.id, type: 'RETENTION_30D', createdAt: { gte: thirtyDaysAgoStart } }
          });

          if (!alreadySent) {
            const message = `Olá ${apt.client.name}! Faz 30 dias do seu último corte com ${apt.barber.name}. Que tal agendar um novo horário?`;

            await this.create({
              type: 'RETENTION_30D' as any,
              recipientId: apt.client.id,
              title: 'Saudades do seu estilo!',
              message,
              priority: NotificationPriority.NORMAL,
              channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
              data: { barberId: apt.barber.id }
            });

            await rawPrisma.notificationLog.create({
              data: {
                shopId: apt.shopId,
                clientId: apt.client.id,
                barberId: apt.barber.id,
                type: 'RETENTION_30D',
                status: 'SENT',
                sentAt: new Date()
              }
            });
          }
        }
      }
    } catch (err) {
      this.logger.error('Erro no cron de retenção:', err);
    } finally {
      await rawPrisma.$disconnect();
    }
  }
}
