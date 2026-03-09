import { api } from './api';

export type ExpenseType =
  | 'RENT'
  | 'UTILITIES'
  | 'SALARIES'
  | 'COMMISSIONS'
  | 'PRODUCTS'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'TAXES'
  | 'OTHER';

export interface Expense {
  id: string;
  shopId: string;
  type: ExpenseType;
  description: string;
  amount: number;
  isRecurring: boolean;
  dueDate?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  type: ExpenseType;
  description: string;
  amount: number;
  isRecurring?: boolean;
  dueDate?: string;
}

export interface UpdateExpenseDto {
  type?: ExpenseType;
  description?: string;
  amount?: number;
  isRecurring?: boolean;
  dueDate?: string;
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  RENT: 'Aluguel',
  UTILITIES: 'Contas (água/luz/internet)',
  SALARIES: 'Salários',
  COMMISSIONS: 'Comissões',
  PRODUCTS: 'Produtos',
  MAINTENANCE: 'Manutenção',
  MARKETING: 'Marketing',
  TAXES: 'Impostos',
  OTHER: 'Outros',
};

export const expenseService = {
  async list(): Promise<Expense[]> {
    const response = await api.get('/expenses');
    return response.data as Expense[];
  },

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const response = await api.post('/expenses', dto);
    return response.data as Expense;
  },

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}`, dto);
    return response.data as Expense;
  },

  async markAsPaid(id: string): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/pay`);
    return response.data as Expense;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
