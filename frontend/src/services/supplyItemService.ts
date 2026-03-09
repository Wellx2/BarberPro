import { api } from './api';

// === Tipos ===

export type SupplyUnitType =
    | 'UNIT'
    | 'BOX'
    | 'PACK'
    | 'ML'
    | 'GRAMS'
    | 'LITERS'
    | 'KG'
    | 'METERS';

export const SUPPLY_UNIT_LABELS: Record<SupplyUnitType, string> = {
    UNIT: 'Unidade',
    BOX: 'Caixa',
    PACK: 'Pacote / Fardo',
    ML: 'Mililitros (ml)',
    GRAMS: 'Gramas (g)',
    LITERS: 'Litros (L)',
    KG: 'Quilograma (kg)',
    METERS: 'Metros (m)',
};

export interface SupplyItem {
    id: string;
    shopId: string;
    name: string;
    description?: string;
    category?: string;
    unit: SupplyUnitType;
    quantity: number;
    minQuantity?: number;
    unitCost?: number;
    totalCost?: number;
    isLowStock: boolean; // calculado no backend
    isActive: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplyItemDto {
    name: string;
    description?: string;
    category?: string;
    unit: SupplyUnitType;
    quantity: number;
    minQuantity?: number;
    unitCost?: number;
    totalCost?: number;
    notes?: string;
}

export interface UpdateSupplyItemDto extends Partial<CreateSupplyItemDto> {
    isActive?: boolean;
}

export interface AdjustQuantityDto {
    delta: number;   // positivo = entrada, negativo = saída
    notes?: string;
}

// === Serviço ===

export const supplyItemService = {
    /** Lista todos os insumos. Passe `category` para filtrar por categoria. */
    async list(category?: string): Promise<SupplyItem[]> {
        const url = category ? `/supply-items?category=${encodeURIComponent(category)}` : '/supply-items';
        const response = await api.get<SupplyItem[]>(url);
        return response.data;
    },

    /** Lista as categorias disponíveis */
    async listCategories(): Promise<string[]> {
        const response = await api.get<string[]>('/supply-items/categories');
        return response.data;
    },

    /** Busca um insumo por ID */
    async findOne(id: string): Promise<SupplyItem> {
        const response = await api.get<SupplyItem>(`/supply-items/${id}`);
        return response.data;
    },

    /** Cria um novo insumo */
    async create(dto: CreateSupplyItemDto): Promise<SupplyItem> {
        const response = await api.post<SupplyItem>('/supply-items', dto);
        return response.data;
    },

    /** Atualiza os dados de um insumo */
    async update(id: string, dto: UpdateSupplyItemDto): Promise<SupplyItem> {
        const response = await api.patch<SupplyItem>(`/supply-items/${id}`, dto);
        return response.data;
    },

    /**
     * Ajusta a quantidade do insumo.
     * delta > 0 = entrada de estoque
     * delta < 0 = saída de estoque
     */
    async adjustQuantity(id: string, dto: AdjustQuantityDto): Promise<SupplyItem> {
        const response = await api.patch<SupplyItem>(`/supply-items/${id}/adjust`, dto);
        return response.data;
    },

    /** Remove (desativa) um insumo */
    async remove(id: string): Promise<void> {
        await api.delete(`/supply-items/${id}`);
    },
};
