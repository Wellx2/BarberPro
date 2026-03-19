import React, { useState, useEffect } from 'react';
import { Plus, Layers, Check, Trash2, Edit3 } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { Modal } from '../../components/feedback';
import { planService } from '../../services/planService';
import { useNotification } from '../../context/NotificationContext';
import { Plan } from '../../types';

export const PlansTab: React.FC = () => {
  const { addNotification } = useNotification();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    benefitMonths: 1,
    benefitServices: 0,
    benefitProducts: 0,
    benefitMoneyback: 0,
    description: '',
    benefits: [] as string[],
    discount: 0,
    active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const data = await planService.getAll();
      setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      addNotification('error', 'Erro ao carregar planos');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditPlan(plan);
      setPlanForm({
        name: plan.name,
        price: plan.price,
        benefitMonths: plan.benefitMonths || 1,
        benefitServices: plan.benefitServices || 0,
        benefitProducts: plan.benefitProducts || 0,
        benefitMoneyback: plan.benefitMoneyback || 0,
        description: plan.description || '',
        benefits: plan.benefits || [],
        discount: plan.discount || 0,
        active: plan.active,
      });
    } else {
      setEditPlan(null);
      setPlanForm({
        name: '', price: 0, benefitMonths: 1, benefitServices: 0,
        benefitProducts: 0, benefitMoneyback: 0, description: '',
        benefits: [], discount: 0, active: true
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) {
      addNotification('error', 'Nome do plano é obrigatório');
      return;
    }
    try {
      if (editPlan) {
        await planService.update(editPlan.id, planForm);
        addNotification('success', 'Plano atualizado!');
      } else {
        await planService.create(planForm);
        addNotification('success', 'Plano criado!');
      }
      setShowPlanModal(false);
      loadPlans();
    } catch (error) {
      addNotification('error', 'Erro ao salvar plano');
    }
  };

  const handleTogglePlanActive = async (id: string) => {
    try {
      const plan = plans.find(p => p.id === id);
      if (!plan) return;
      await planService.update(id, { active: !plan.active });
      setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
      addNotification('success', 'Status atualizado!');
    } catch (error) {
      addNotification('error', 'Erro ao atualizar status');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o plano ${name}?`)) return;
    try {
      await planService.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      addNotification('success', 'Plano removido');
    } catch (error) {
      addNotification('error', 'Erro ao remover plano');
    }
  };
  return (
    <Card>
      <Card.Body className="space-y-4">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white uppercase">Planos de Assinatura</h3>
          <Button
            size="md"
            variant="primary"
            icon={<Plus size={20} />}
            onClick={() => handleOpenPlanModal()}
            className="flex-shrink-0 sm:w-auto w-10 h-10 !p-0 sm:!px-5 sm:!py-2.5"
            aria-label="Novo Plano"
          >
            <span className="hidden sm:inline">Novo Plano</span>
          </Button>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tenant-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando planos...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <Layers size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum plano cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className={`border-2 border-tenant-primary hover:shadow-xl transition-shadow ${!plan.active ? 'opacity-60 grayscale' : ''}`}>
                {/* Badge de Status */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${plan.active
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {plan.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <Card.Body className="space-y-4">
                  <div>
                    <h4 className="font-black text-xl text-tenant-primary dark:text-tenant-primary uppercase">{plan.name}</h4>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                      R$ {plan.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Validade: {plan.benefitMonths} ms(es)
                    </p>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2 py-3 border-y border-gray-200 dark:border-gray-700">
                    {plan.benefitServices > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {plan.benefitServices} serviços inclusos
                        </span>
                      </div>
                    )}
                    {plan.benefitProducts > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {plan.benefitProducts} produtos inclusos
                        </span>
                      </div>
                    )}
                    {plan.benefitMoneyback > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {plan.benefitMoneyback}% de cashback
                        </span>
                      </div>
                    )}
                    {plan.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenPlanModal(plan)}
                      className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleTogglePlanActive(plan.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${plan.active
                        ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 dark:text-green-400'
                        }`}
                    >
                      {plan.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      disabled={plan.active}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-colors"
                      title={plan.active ? 'Desative o plano antes de excluir' : 'Excluir plano'}
                    >
                      Excluir
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Card.Body>

      {/* Plan Modal */}
      {showPlanModal && (
        <Modal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          title={editPlan ? 'Editar Plano' : 'Novo Plano'}
          size="lg"
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome do Plano *</label>
                  <Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ex: Trimestral VIP" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preço (R$) *</label>
                  <Input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duração (Meses)</label>
                  <Input type="number" min="1" value={planForm.benefitMonths} onChange={e => setPlanForm({ ...planForm, benefitMonths: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Serviços Inclusos</label>
                    <Input type="number" value={planForm.benefitServices} onChange={e => setPlanForm({ ...planForm, benefitServices: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Produtos Inclusos</label>
                    <Input type="number" value={planForm.benefitProducts} onChange={e => setPlanForm({ ...planForm, benefitProducts: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cashback (%)</label>
                  <Input type="number" max="100" value={planForm.benefitMoneyback} onChange={e => setPlanForm({ ...planForm, benefitMoneyback: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição / Benefícios</label>
              <textarea
                value={planForm.description}
                onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:border-tenant-primary transition-colors min-h-[100px]"
                placeholder="Detalhes sobre as vantagens do plano..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={() => setShowPlanModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleSavePlan} variant="primary" className="flex-1">
                {editPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
