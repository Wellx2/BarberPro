import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
const JWT_SECRET = process.env.JWT_SECRET || 'barberpro-super-secret-2026';
export const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Busca user no DB (Prisma)
        // req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        req.user = { id: decoded.userId, role: decoded.role };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};
export const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin requerido' });
    }
    next();
};
//# sourceMappingURL=auth.js.map