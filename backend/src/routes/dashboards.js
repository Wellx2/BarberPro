import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';
const router = Router();
router.get('/:role/:shopId', authMiddleware, adminOnly, async (req, res) => {
    const { shopId } = req.params;
    // KPIs agregados Prisma [web:84]
    const stats = await prisma.$transaction(async (tx) => ({
        totalClients: await tx.user.count({ where: { shopId } }),
        totalAppointments: await tx.appointment.count({ where: { shopId } }),
        totalRevenue: await tx.appointment.aggregate({
            where: { shopId, status: 'COMPLETED' },
            _sum: { totalPrice: true }
        }).then(r => r._sum.totalPrice || 0),
        avgRating: await tx.barber.aggregate({
            where: { shopId },
            _avg: { rating: true }
        }).then(r => r._avg.rating || 0),
        upcomingAppointments: await tx.appointment.count({
            where: {
                shopId,
                status: 'SCHEDULED',
                date: { gte: new Date() }
            }
        }),
        topService: await tx.appointment.groupBy({
            by: ['serviceIds'],
            where: { shopId },
            _count: { serviceIds: true },
            orderBy: { _count: { serviceIds: 'desc' } },
            take: 1
        }).then(([top]) => ({
            name: top?.serviceIds[0] || 'Nenhum',
            count: top?._count.serviceIds || 0
        }))
    }));
    // Gráficos dados (7 dias)
    const revenueChart = await prisma.appointment.groupBy({
        by: ['date'],
        where: {
            shopId,
            status: 'COMPLETED',
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        _sum: { totalPrice: true }
    });
    res.json({
        stats,
        charts: {
            revenue7days: revenueChart.map(g => ({
                date: g.date.toISOString().split('T')[0],
                revenue: g._sum.totalPrice || 0
            }))
        }
    });
});
export default router;
//# sourceMappingURL=dashboards.js.map