import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js'; // export const prisma = new PrismaClient();
const router = Router();
router.get('/', async (req, res) => {
    const shops = await prisma.shop.findMany({
        include: { services: true } // Eager load
    });
    res.json(shops);
});
router.get('/:id', async (req, res) => {
    const shop = await prisma.shop.findUnique({
        where: { id: req.params.id },
        include: {
            services: { where: { active: true } },
            barbers: { where: { active: true } }
        }
    });
    if (!shop)
        return res.status(404).json({ error: 'Shop não encontrado' });
    res.json(shop);
});
router.get('/:id/services', async (req, res) => {
    const services = await prisma.service.findMany({
        where: {
            shopId: req.params.id,
            active: true
        },
        orderBy: { category: 'asc' }
    });
    res.json(services);
});
export default router;
//# sourceMappingURL=shops.js.map