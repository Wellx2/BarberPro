import { Router } from 'express';
import { prisma } from '../services/prisma';
const router = Router();
router.get('/shops/:shopId', async (req, res) => {
    const barbers = await prisma.barber.findMany({
        where: {
            shopId: req.params.shopId,
            active: true
        },
        orderBy: { rating: 'desc' }
    });
    res.json(barbers);
});
router.get('/:id', async (req, res) => {
    const barber = await prisma.barber.findUnique({
        where: { id: req.params.id },
        include: {
            appointments: {
                where: { status: 'SCHEDULED' },
                include: { client: true }
            }
        }
    });
    if (!barber)
        return res.status(404).json({ error: 'Barbeiro não encontrado' });
    res.json(barber);
});
export default router;
//# sourceMappingURL=barbers.js.map