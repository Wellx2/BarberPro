import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js'; // Ajuste se services não existe
const router = Router();
const JWT_SECRET = 'barberpro-super-secret-2026';
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user)
            return res.status(401).json({ error: 'Credenciais inválidas' });
        // Demo password "123456" (hash no Prisma Studio)
        if (password !== '123456')
            return res.status(401).json({ error: 'Senha errada' });
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro servidor' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                passwordHash: 'demo_hash', // bcrypt futuro
                role: 'CLIENT'
            }
        });
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro registro' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map