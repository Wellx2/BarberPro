import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../services/prisma';

const router = Router();

const createSchema = z.object({
  shopId: z.string(),
  barberId: z.string(),
  serviceIds: z.array(z.string()).min(1),
  date: z.string().datetime(),
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { shopId, barberId, serviceIds, date } = createSchema.parse(req.body);
    const clientId = req.user!.id;

    // 1. Verifica conflitos (30min window)
    const start = new Date(date);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId,
        status: 'SCHEDULED',
        date: { gte: start, lt: end }
      }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Horário ocupado' });
    }

    // 2. Calcula preço
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // 3. Cria appointment
    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        clientId,
        barberId,
        serviceIds,
        date: start,
        totalPrice,
        status: 'SCHEDULED'
      },
      include: {
        client: { select: { name: true } },
        barber: { select: { name: true } },
        services: true
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { clientId: req.user!.id },
    include: { barber: true, services: true },
    orderBy: { date: 'desc' }
  });
  res.json(appointments);
});

export default router;
