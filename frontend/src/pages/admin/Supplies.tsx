import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Search, Filter, Edit3, Trash2,
    AlertCircle, ChevronRight, ArrowUpRight, ArrowDownRight,
    MoreVertical, History, Info, Layers
} from 'lucide-react';
import {
    SupplyItem,
    supplyItemService,
    SUPPLY_UNIT_LABELS,
    SupplyUnitType,
    CreateSupplyItemDto
} from '../../services/supplyItemService';
import { useNotification } from '../../context/NotificationContext';
import { Button, Card, Input, Select } from '../../components/ui';
import { Modal, Alert } from '../../components/feedback';
import { Grid } from '../../components/layout/Grid';

export const Supplies: React.FC = () => {
    const { addNotification } = useNotification();
    const [items, setItems] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<string[]>([]);

    // Modal states
    const [showItemModal, setShowItemModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
    const [adjustingItem, setAdjustingItem] = useState<SupplyItem | null>(null);

    // Form states
    const [form, setForm] = useState<CreateSupplyItemDto>({
        name: '',
        description: '',
        category: '',
        unit: 'UNIT',
        quantity: 0,
        minQuantity: 0,
        unitCost: 0,
        notes: ''
    });
    const [adjustDelta, setAdjustDelta] = useState(0);
    const [adjustNotes, setAdjustNotes] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsData, categoriesData] = await Promise.all([
                supplyItemService.list(),
                supplyItemService.listCategories().catch(() => [])
            ]);
            setItems(itemsData);
            setCategories(categoriesData);
        } catch (error) {
            addNotification('error', 'Erro ao carregar insumos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    const handleOpenModal = (item?: SupplyItem) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name,
                description: item.description || '',
                category: item.category || '',
                unit: item.unit,
                quantity: item.quantity,
                minQuantity: item.minQuantity || 0,
                unitCost: item.unitCost || 0,
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            setForm({
                name: '',
                description: '',
                category: '',
                unit: 'UNIT',
                quantity: 0,
                minQuantity: 0,
                unitCost: 0,
                notes: ''
            });
        }
        setShowItemModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await supplyItemService.update(editingItem.id, form);
                addNotification('success', 'Insumo atualizado com sucesso');
            } else {
                await supplyItemService.create(form);
                addNotification('success', 'Insumo criado com sucesso');
            }
            setShowItemModal(false);
            loadData();
        } catch (error) {
            addNotification('error', 'Erro ao salvar insumo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este insumo?')) return;
        try {
            await supplyItemService.remove(id);
            addNotification('success', 'Insumo removido');
            loadData();
        } catch (error) {
            addNotification('error', 'Erro ao remover insumo');
        }
    };

    const handleAdjust = async () => {
        if (!adjustingItem || adjustDelta === 0) return;
        try {
            await supplyItemService.adjustQuantity(adjustingItem.id, {
                delta: adjustDelta,
                notes: adjustNotes
            });
            addNotification('success', 'Estoque ajustado com sucesso');
            setShowAdjustModal(false);
            setAdjustDelta(0);
            setAdjustNotes('');
            loadData();
        } catch (error) {
            addNotification('error', 'Erro ao ajustar estoque');
        }
    };

    const lowStockItems = items.filter(i => i.isLowStock);

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <Grid cols={3} gap="lg">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <Card.Body className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Total de Itens</p>
                                <h3 className="text-3xl font-black">{items.length}</h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <Package size={24} />
                            </div>
                        </div>
                        <p className="text-blue-100 text-xs mt-4 font-bold">Insumos cadastrados no sistema</p>
                    </Card.Body>
                </Card>

                <Card className={`border-0 ${lowStockItems.length > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-gradient-to-br from-green-500 to-green-600 text-white'}`}>
                    <Card.Body className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">Itens com Estoque Baixo</p>
                                <h3 className="text-3xl font-black">{lowStockItems.length}</h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <AlertCircle size={24} />
                            </div>
                        </div>
                        <p className="text-white/80 text-xs mt-4 font-bold">
                            {lowStockItems.length > 0 ? 'Necessário reposição imediata' : 'Níveis de estoque saudáveis'}
                        </p>
                    </Card.Body>
                </Card>

                <Card className="bg-gradient-to-br from-tenant-primary to-tenant-primary text-white border-0">
                    <Card.Body className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/90 text-xs font-black uppercase tracking-widest mb-1">Valor em Estoque</p>
                                <h3 className="text-3xl font-black">
                                    R$ {items.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}
                                </h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <ArrowUpRight size={24} />
                            </div>
                        </div>
                        <p className="text-white/90 text-xs mt-4 font-bold">Baseado no custo unitário médio</p>
                    </Card.Body>
                </Card>
            </Grid>

            {/* Main Content */}
            <Card>
                <Card.Body className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Gestão de Insumos</h2>
                            <p className="text-sm text-gray-500">Controle toalhas, lâminas, sprays e materiais de consumo</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                icon={<Plus size={20} />}
                                onClick={() => handleOpenModal()}
                            >
                                Novo Insumo
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou categoria..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                            >
                                <option value="">Todas Categorias</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest pl-2">Insumo</th>
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest">Categoria</th>
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Quantidade</th>
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest text-right">Custo Unit.</th>
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest text-right">Custo Total</th>
                                    <th className="pb-4 pt-2 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            Nenhum insumo encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                            <td className="py-4 pl-2">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 line-clamp-1">{item.description || 'Sem descrição'}</p>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                    {item.category || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex items-center gap-1.5 font-black text-sm ${item.isLowStock ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.quantity} {SUPPLY_UNIT_LABELS[item.unit]}
                                                        {item.isLowStock && <AlertCircle size={14} />}
                                                    </div>
                                                    {item.minQuantity > 0 && (
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Mín: {item.minQuantity}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right font-medium text-gray-500">
                                                R$ {item.unitCost?.toFixed(2)}
                                            </td>
                                            <td className="py-4 text-right font-black text-gray-900 dark:text-white">
                                                R$ {item.totalCost?.toFixed(2)}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setAdjustingItem(item);
                                                            setShowAdjustModal(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Ajustar Estoque"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-tenant-primary hover:bg-tenant-primary/5 dark:hover:bg-tenant-primary/20/20 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modals */}
            <Modal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                title={editingItem ? 'Editar Insumo' : 'Novo Insumo'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome do Insumo"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Toalhas Descartáveis"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Categoria"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            placeholder="Ex: Têxtil"
                        />
                        <Select
                            label="Unidade de Medida"
                            value={form.unit}
                            onChange={e => setForm({ ...form, unit: e.target.value as SupplyUnitType })}
                            options={Object.entries(SUPPLY_UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Qtd Atual"
                            type="number"
                            required
                            value={form.quantity}
                            onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                        />
                        <Input
                            label="Qtd Mínima"
                            type="number"
                            value={form.minQuantity}
                            onChange={e => setForm({ ...form, minQuantity: Number(e.target.value) })}
                        />
                        <Input
                            label="Custo Unit."
                            type="number"
                            step="0.01"
                            value={form.unitCost}
                            onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })}
                        />
                    </div>
                    
                    {/* Exibição do Custo Total Calculado */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Custo Total Previsto</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                            R$ {(form.quantity * (form.unitCost || 0)).toFixed(2)}
                        </span>
                    </div>
                    <Input
                        label="Notas"
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                    <div className="flex gap-2 pt-4">
                        <Button variant="secondary" fullWidth onClick={() => setShowItemModal(false)}>Cancelar</Button>
                        <Button variant="primary" fullWidth type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showAdjustModal}
                onClose={() => setShowAdjustModal(false)}
                title={`Movimentação de Estoque: ${adjustingItem?.name}`}
            >
                <div className="space-y-4">
                    <Alert variant="info" icon={<Info size={18} />}>
                        Use valores positivos para entrada de material e negativos para saída/consumo.
                    </Alert>
                    <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setAdjustDelta(prev => prev - 1)}
                                className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                                <ArrowDownRight size={24} />
                            </button>
                            <div className="text-center">
                                <input
                                    type="number"
                                    value={adjustDelta}
                                    onChange={e => setAdjustDelta(Number(e.target.value))}
                                    className="w-24 text-4xl font-black bg-transparent border-0 text-center focus:ring-0 dark:text-white"
                                />
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Quantidade</p>
                            </div>
                            <button
                                onClick={() => setAdjustDelta(prev => prev + 1)}
                                className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                                <ArrowUpRight size={24} />
                            </button>
                        </div>
                    </div>
                    <Input
                        label="Observações / Motivo"
                        value={adjustNotes}
                        onChange={e => setAdjustNotes(e.target.value)}
                        placeholder="Ex: Compra do mês ou Quebra de estoque"
                    />
                    <Button variant="primary" fullWidth onClick={handleAdjust} disabled={adjustDelta === 0}>
                        Confirmar Movimentação
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
