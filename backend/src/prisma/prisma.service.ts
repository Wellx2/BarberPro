import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantContext } from '../common/tenant/tenant.context';

const tenantModels = [
  'Barber', 'Service', 'ServiceDisabledPeriod', 'Product', 'Client', 'Appointment',
  'BlockedTime', 'AgendaLock',
  'ProductStockMovement', 'ServiceOrder', 'BarberCommission', 'Expense',
  'DailyCashFlow', 'NotificationLog', 'FixedCost'
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();

    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = tenantContext.getStore();
            const shopId = store?.shopId;

            if (shopId && tenantModels.includes(model)) {
              if (
                ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'updateMany', 'deleteMany'].includes(operation)
              ) {
                args = args || {} as any;
                (args as any).where = { ...(args as any).where, shopId };
              } else if (['update', 'delete'].includes(operation)) {
                args = args || {} as any;

                // Em operações únicas onde a verificação de RLS deve ocorrer primeiro
                if ((args as any).where && typeof (args as any).where === 'object' && 'id' in (args as any).where) {
                  // O bypass temporário impede o loop infinito
                  // Criamos uma nova instância limpa apenas para checagem (evitar loop)
                  const prismaRaw = new PrismaClient();
                  try {
                    const record = await (prismaRaw as any)[model].findFirst({
                      where: { id: ((args as any).where as any).id, shopId },
                      select: { id: true }
                    });

                    if (!record) {
                      throw new Error(`Acesso negado: Registro não encontrado no tenant atual.`);
                    }
                  } finally {
                    await prismaRaw.$disconnect();
                  }
                }
              }
            }

            return query(args);
          }
        }
      }
    }).$extends({
      query: {
        serviceOrder: {
          async update({ args, query }) {
            const result = await query(args);

            // Se a comanda foi finalizada, disparamos a automação de estoque
            const newStatus = args.data?.status;
            const isCompleted = newStatus === 'COMPLETED' || (newStatus as any)?.set === 'COMPLETED';
            if (isCompleted) {
              // Usamos uma raw client para evitar loops de extensions
              const prismaRaw = new PrismaClient();
              try {
                // Buscamos os itens tipo PRODUTO vinculados a esta comanda
                const orderItems = await prismaRaw.orderItem.findMany({
                  where: { orderId: (result as any).id, type: 'PRODUCT' },
                  include: { product: true }
                });

                for (const item of orderItems) {
                  if (item.productId && item.product) {
                    const newStock = item.product.stock - item.quantity;
                    await prismaRaw.product.update({
                      where: { id: item.productId },
                      data: {
                        stock: newStock < 0 ? 0 : newStock,
                        active: newStock <= 0 ? false : item.product.active
                      }
                    });
                  }
                }
              } catch (e) {
                console.error("Erro na automação de estoque (Prisma Extension): ", e);
              } finally {
                await prismaRaw.$disconnect();
              }
            }

            return result;
          }
        }
      }
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof prop === 'string' && prop in extendedClient) {
          return (extendedClient as any)[prop];
        }
        return (target as any)[prop];
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks() { }
}
