import { PrismaClient } from '@prisma/client';
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: ['query', 'info', 'warn', 'error'], // Logs dev
    });
};
export const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma;
//# sourceMappingURL=prisma.js.map