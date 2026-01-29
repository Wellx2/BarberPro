import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks() {
    // Prisma 5+ não suporta eventos beforeExit da mesma forma
    // Mantemos o método para compatibilidade de API mesmo sem usar o parâmetro
  }
}
