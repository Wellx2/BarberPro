import React from 'react';
import { Plus, Layers, Check } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface PlansTabProps {
  plans: any[];
  loadingPlans: boolean;
  handleOpenPlanModal: (plan?: any) => void;
  handleTogglePlanActive: (id: string) => void;
  handleDeletePlan: (id: string, name: string) => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({
  plans,
  loadingPlans,
  handleOpenPlanModal,
  handleTogglePlanActive,
  handleDeletePlan
}) => {
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
    </Card>
  );
};
