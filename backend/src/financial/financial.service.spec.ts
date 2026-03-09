import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from './financial.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsPeriod } from './dto/get-analytics.dto';
import { UserRole, AppointmentStatus, InvoiceStatus } from '@prisma/client';

describe('FinancialService - Lucro Líquido Real (Precision Financial Management)', () => {
    let service: FinancialService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        invoice: {
            findMany: jest.fn(),
        },
        appointment: {
            findMany: jest.fn(),
        },
        barberCommission: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        expense: {
            findMany: jest.fn(),
        },
        barber: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FinancialService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<FinancialService>(FinancialService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });

    it('deve calcular o Lucro Líquido Real precisamente para 1 serviço de R$ 50', async () => {
        // Cenário:
        // Faturamento: R$ 50,00 (1 serviço)
        // Cartão: Débito (2% = R$ 1,00)
        // Custo do insumo (supplyCost): R$ 5,00
        // Comissão do Barbeiro: 50% em serviços (R$ 25,00)
        // Custo Fixo Pro-rata: R$ 30,00 mensais -> Dia = R$ 1,00
        // Total de despesas: 1 (taxa) + 5 (insumo) + 25 (comissão) + 1 (custo fixo) = R$ 32,00
        // Lucro Líquido Real Esperado = R$ 50,00 - R$ 32,00 = R$ 18,00

        const shopId = 'dev-shop-123';
        const barberId = 'barber-xyz';

        const requester = {
            role: UserRole.ADMIN,
            shopId: shopId,
        };

        // Mocks
        mockPrismaService.invoice.findMany.mockResolvedValue([
            {
                id: 'inv-1',
                shopId,
                barberId,
                amount: 50,
                type: 'SERVICE',
                status: InvoiceStatus.PAID,
                paymentMethod: 'DEBIT_CARD',
                createdAt: new Date(),
                items: []
            }
        ]);

        mockPrismaService.appointment.findMany.mockResolvedValue([
            {
                id: 'apt-1',
                shopId,
                barberId,
                totalPrice: 50,
                status: AppointmentStatus.COMPLETED,
                date: new Date(),
                barber: { id: barberId, name: 'John Barber', avatar: null },
                services: [
                    { service: { price: 50, supplyCost: 5 } }
                ]
            }
        ]);

        // O FinancialService busca os barbeiros referenciados para fechar as contas
        mockPrismaService.barber.findMany.mockResolvedValue([
            { id: barberId, name: 'John Barber', avatar: null }
        ]);

        mockPrismaService.barberCommission.findMany.mockResolvedValue([
            {
                barberId,
                type: 'PERCENTAGE',
                value: 50, // 50%
                applyOnServices: true,
                applyOnProducts: false,
                active: true,
            }
        ]);

        mockPrismaService.barberCommission.findFirst.mockResolvedValue(
            { value: 50, applyOnServices: true }
        );

        mockPrismaService.expense.findMany.mockResolvedValue([
            {
                id: 'exp-1',
                amount: 30, // R$ 30 mensal
                isPaid: false,
            }
        ]);

        const result = await service.getAnalytics(requester, undefined as any, AnalyticsPeriod.TODAY);

        expect(result.gross).toBe(50);
        expect(result.cardFees).toBe(1); // 2% de 50
        expect(result.supplyCostsTotal).toBe(5);
        expect(result.totalCommissions).toBe(25); // 50% de 50
        expect(result.fixedCostsTotal).toBe(1); // 30 / 30 dias

        expect(result.expenses).toBe(32); // 1 + 5 + 25 + 1
        expect(result.net).toBe(18); // 50 - 32
        expect(result.isLoss).toBe(false);
    });
});
