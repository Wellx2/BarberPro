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
import { 
    expenseService, 
    Expense, 
    CreateExpenseDto, 
    EXPENSE_TYPE_LABELS 
} from '../../services/expenseService';
import { Check, DollarSign } from 'lucide-react';
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

    // === Expense / Custo Fixo States ===
    const [fixedCosts, setFixedCosts] = useState<Expense[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [expenseForm, setExpenseForm] = useState<CreateExpenseDto>({ 
        type: 'RENT', 
        description: '', 
        amount: 0, 
        isRecurring: false 
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setLoadingExpenses(true);
            const [itemsData, categoriesData, expensesData] = await Promise.all([
                supplyItemService.list(),
                supplyItemService.listCategories().catch(() => []),
                expenseService.list().catch(() => [])
            ]);
            setItems(itemsData);
            setCategories(categoriesData);
            setFixedCosts(expensesData as Expense[]);
        } catch (error) {
            addNotification('error', 'Erro ao carregar insumos e custos fixos');
        } finally {
            setLoading(false);
            setLoadingExpenses(false);
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

    // === Expense Actions ===
    const handleOpenExpenseModal = (expense?: Expense) => {
        if (expense) {
            setEditExpense(expense);
            setExpenseForm({ type: expense.type, description: expense.description, amount: expense.amount, isRecurring: expense.isRecurring, dueDate: expense.dueDate });
        } else {
            setEditExpense(null);
            setExpenseForm({ type: 'RENT', description: '', amount: 0, isRecurring: false, dueDate: undefined });
        }
        setShowExpenseModal(true);
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.description.trim()) { addNotification('error', 'Descrição é obrigatória'); return; }
        if (!expenseForm.amount || expenseForm.amount <= 0) { addNotification('error', 'Valor deve ser maior que zero'); return; }
        try {
            if (editExpense) {
                await expenseService.update(editExpense.id, expenseForm);
                addNotification('success', 'Despesa atualizada!');
            } else {
                await expenseService.create(expenseForm);
                addNotification('success', 'Despesa criada!');
            }
            const data = await expenseService.list();
            setFixedCosts(data);
            setShowExpenseModal(false);
        } catch (err: any) {
            addNotification('error', err?.response?.data?.message || 'Erro ao salvar despesa');
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm('Excluir esta despesa?')) return;
        try {
            await expenseService.remove(id);
            addNotification('success', 'Despesa excluída!');
            setFixedCosts(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            addNotification('error', 'Erro ao excluir despesa');
        }
    };

    const handleMarkExpensePaid = async (id: string) => {
        try {
            await expenseService.markAsPaid(id);
            addNotification('success', 'Marcada como paga!');
            const data = await expenseService.list();
            setFixedCosts(data);
        } catch (err: any) {
            addNotification('error', 'Erro ao marcar como paga');
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
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Insumos/Custos Fixos</h2>
                            <p className="text-sm text-gray-500">Controle toalhas, lâminas e gerencie aluguel, contas e despesas recorrentes</p>
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

            {/* Seção Custos Fixos / Despesas */}
            <Card>
                <Card.Body className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Custos Fixos & Despesas</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Gerencie aluguel, contas e outras despesas recorrentes</p>
                        </div>
                        <Button size="md" variant="primary" icon={<Plus size={18} />} onClick={() => handleOpenExpenseModal()} className="flex-shrink-0">
                            <span>Nova Despesa</span>
                        </Button>
                    </div>

                    {loadingExpenses ? (
                        <div className="text-center py-8">
                            <div className="h-8 w-8 border-4 border-tenant-primary border-t-transparent animate-spin rounded-full inline-block"></div>
                            <p className="mt-3 text-gray-500 text-sm">Carregando despesas...</p>
                        </div>
                    ) : fixedCosts.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                            <DollarSign size={40} className="mx-auto mb-3 opacity-40 text-gray-400" />
                            <p className="text-sm">Nenhuma despesa cadastrada.</p>
                            <p className="text-xs mt-1">Clique em "Nova Despesa" para começar.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Descrição</th>
                                        <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Tipo</th>
                                        <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Valor</th>
                                        <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Recorrente</th>
                                        <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Status</th>
                                        <th className="text-center py-2 px-3 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fixedCosts.map(expense => (
                                        <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">{expense.description}</td>
                                            <td className="py-2.5 px-3">
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium tracking-tight uppercase">
                                                    {EXPENSE_TYPE_LABELS[expense.type] || expense.type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white">
                                                R$ {expense.amount.toFixed(2)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {expense.isRecurring ? (
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">Sim</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Não</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {expense.isPaid ? (
                                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-bold">Paga</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs font-bold">Pendente</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    {!expense.isPaid && (
                                                        <button onClick={() => handleMarkExpensePaid(expense.id)} title="Marcar como paga"
                                                            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors">
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleOpenExpenseModal(expense)} title="Editar"
                                                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteExpense(expense.id)} title="Excluir"
                                                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                        <td colSpan={2} className="py-2.5 px-3 font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Total</td>
                                        <td className="py-2.5 px-3 text-right font-black text-red-600 dark:text-red-400">
                                            R$ {fixedCosts.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                                        </td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
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

            {/* Modal de Despesa */}
            {showExpenseModal && (
                <Modal
                    isOpen={showExpenseModal}
                    onClose={() => setShowExpenseModal(false)}
                    title={editExpense ? 'Editar Despesa' : 'Nova Despesa'}
                >
                    <form onSubmit={handleSaveExpense} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                                <select
                                    value={expenseForm.type}
                                    onChange={e => setExpenseForm(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    {Object.entries(EXPENSE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                                <Input
                                    type="number"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                            <Input
                                value={expenseForm.description}
                                onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Ex: Aluguel da sala"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="recorrente"
                                checked={expenseForm.isRecurring}
                                onChange={e => setExpenseForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                                className="w-4 h-4 text-tenant-primary rounded border-gray-300"
                            />
                            <label htmlFor="recorrente" className="text-sm font-bold text-gray-700 dark:text-gray-300">Despesa Recorrente (Mensal)</label>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
                            <Button variant="primary" className="flex-1" type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
