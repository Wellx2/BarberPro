import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import shopsRoutes from './routes/shops.js';
import barbersRoutes from './routes/barbers.js';
import appointmentsRoutes from './routes/appointments.js';
import usersRoutes from './routes/users.js';
import dashboardsRoutes from './routes/dashboards.js';
import productsRoutes from './routes/products.js';
// .js no ESM!
// outros
const app = express();
app.use('/api/v1/auth', authRoutes);
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' })); // Frontend
app.use(express.json());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);
app.use('/api/v1/dashboards', dashboardsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/shops', shopsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/barbers', barbersRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/products', productsRoutes);
app.get('/health', (req, res) => res.json({ status: 'OK' }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
//# sourceMappingURL=app.js.map