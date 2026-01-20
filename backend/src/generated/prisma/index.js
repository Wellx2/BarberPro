import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './client/edge';
const sqlite = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter: sqlite });
export { prisma };
//# sourceMappingURL=index.js.map