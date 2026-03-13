import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { useNotification } from '../../context/NotificationContext';
import { Product, StockMovement } from '../../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2, Search, Plus, Package } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/feedback/Modal';
import { Grid } from '../../components/layout/Grid';
import { Flex } from '../../components/layout/Flex';
import { productService } from '../../services/productService';

export function StockMovements() {
  const { shop } = useShop();
  const { addNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StockMovement['type'] | 'ALL'>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [form, setForm] = useState({
    productId: '',
    quantity: 0,
    type: 'IN' as StockMovement['type'],
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Carregar produtos do backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await productService.list(shop.id);
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        addNotification('error', 'Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [shop.id]);

  const mockMovements: any[] = [
    {
      id: '1',
      productId: '1',
      type: 'IN',
      quantity: 50,
      date: new Date(Date.nãow() - 86400000).toISOString(),
    },
    {
      id: '2',
      productId: '2',
      type: 'OUT',
      quantity: 10,
      date: new Date(Date.nãow() - 172800000).toISOString(),
    },
    {
      id: '3',
      productId: '3',
      type: 'ADJUSTMENT',
      quantity: 5,
      date: new Date(Date.nãow() - 259200000).toISOString(),
    },
  ];

  const getTypeStyle = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'OUT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ADJUSTMENT': return 'bg-tenant-primary/10 text-tenant-primary dark:bg-tenant-primary/15 dark:text-tenant-primary';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN': return <ArrowDownLeft size={14} />;
      case 'OUT': return <ArrowUpRight size={14} />;
      case 'ADJUSTMENT': return <RefreshCw size={14} />;
    }
  };

  const getTypeName = (type: StockMovement['type']) => {
    switch (type) {
      case 'IN': return 'Entrada';
      case 'OUT': return 'Saída';
      case 'ADJUSTMENT': return 'Ajuste';
    }
  };

  const filteredMovements = useMemo(() => {
    let result = mockMovements;

    if (filterType !== 'ALL') {
      result = result.filter(m => m.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => {
        const product = products.find(p => p.id === m.productId);
        return product?.name.toLowerCase().includes(term);
      });
    }

    return result;
  }, [filterType, searchTerm, products]);

  const handleAddMovement = () => {
    if (!form.productId || form.quantity <= 0) {
      addNotification('error', 'Por favor, preencha todos os campos');
      return;
    }

    addNotification('success', 'Movimentação registrada com sucesso');
    setShowModal(false);
    setForm({
      productId: '',
      quantity: 0,
      type: 'IN',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Container size="xl" className="py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Flex direction="column" gap="nãone">
          <h1 className="text-3xl font-black uppercase">Movimentação de Estoque</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Gerencie entrada, saída e ajustes de estoque</p>
        </Flex>
        <Button onClick={() => setShowModal(true)} variant="primary" className="gap-2">
          <Plus size={20} /> Registrar Movimentação
        </Button>
      </div>

      <Card>
        <Card.Body className="space-y-4">
          <Grid cols={2} gap="md">
            <Input
              icon={<Search size={18} />}
              placeholder="Buscar por produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-nãone focus:border-blue-500"
            >
              <option value="ALL">Todos os tipos</option>
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
          </Grid>
        </Card.Body>
      </Card>

      <div className="space-y-3">
        {filteredMovements.length === 0 ? (
          <Card>
            <Card.Body className="py-8 text-center">
              <Package size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Nenhuma movimentação encontrada</p>
            </Card.Body>
          </Card>
        ) : (
          filteredMovements.map(movement => {
            const product = products.find(p => p.id === movement.productId);
            return (
              <Card key={movement.id}>
                <Card.Body className="flex items-center justify-between">
                  <Flex direction="column" gap="sm">
                    <Flex gap="md" className="items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getTypeStyle(movement.type)}`}>
                        {getTypeIcon(movement.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{product?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(movement.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </Flex>
                  </Flex>

                  <Flex gap="md" className="items-center">
                    <Flex direction="column" gap="nãone" className="text-right">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTypeStyle(movement.type)}`}>
                        {getTypeIcon(movement.type)}
                        {getTypeName(movement.type)}
                      </span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                        {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                      </p>
                    </Flex>

                    <button
                      onClick={() => addNotification('success', 'Movimentação removida')}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </Flex>
                </Card.Body>
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleAddMovement(); }} className="space-y-6">
          <Flex direction="column" gap="sm">
            <h2 className="text-2xl font-black uppercase">Registrar Movimentação</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Preencha os dados da movimentação de estoque</p>
          </Flex>

          <Grid cols={2} gap="lg">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Produto</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-nãone focus:border-blue-500"
                disabled={loadingProducts}
              >
                <option value="">{loadingProducts ? 'Carregando...' : 'Selecione um produto'}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                ))}
              </select>
            </div>

            <Input
              label="Quantidade"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-nãone focus:border-blue-500"
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>

            <Input
              label="Data"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Motivo (opcional)</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Descreva o motivo da movimentação..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-nãone focus:border-blue-500"
              />
            </div>
          </Grid>

          <Flex gap="md" className="justify-end">
            <Button type="button" onClick={() => setShowModal(false)} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Registrar Movimentação
            </Button>
          </Flex>
        </form>
      </Modal>
    </Container>
  );
}
