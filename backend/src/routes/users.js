import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';
const router = Router();
router.get('/me', authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            appointments: {
                where: { status: 'SCHEDULED' },
                orderBy: { date: 'asc' },
                take: 10,
                include: { barber: true, services: true }
            }
        }
    });
    if (!user)
        return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
});
router.get('/me/invoices', authMiddleware, async (req, res) => {
    // Invoices simulados por appointments (futuro: model Invoice)
    const appointments = await prisma.appointment.findMany({
        where: {
            clientId: req.user.id,
            status: 'COMPLETED'
        },
        orderBy: { date: 'desc' },
        include: { services: true }
    });
    res.json(appointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        description: `Serviços com ${apt.barber.name}`,
        amount: apt.totalPrice,
        status: 'PAID'
    })));
});
export default router;
//# sourceMappingURL=users.js.map