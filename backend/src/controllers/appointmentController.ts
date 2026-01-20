import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createSchema = z.object({
  shopId: z.string(),
  barberId: z.string(),
  serviceIds: z.array(z.string()),
  date: z.string().datetime(),
});

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { shopId, barberId, serviceIds, date } = createSchema.parse(req.body);
    
    // Verifica conflitos (simplificado)
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId,
        date: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 60*60*1000) }, // 1h window
        status: 'SCHEDULED'
      }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Horário conflita' });
    }

    // Calcula preço total
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        clientId: req.user!.id,
        barberId,
        serviceIds,
        date: new Date(date),
        totalPrice
      },
      include: { client: true, barber: true }
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({ error: 'Erro interno' });
  }
};
