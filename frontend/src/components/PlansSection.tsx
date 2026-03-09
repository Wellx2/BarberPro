import React, { useEffect, useState, useRef } from 'react';
import { PlanCard } from './PlanCard';
import { SectionHeader } from './SectionHeader';
import { planService } from '../services';
import { Plan } from '../types';
import { Grid } from './layout/Grid';
import { useShop } from '../context/ShopContext';

interface PlansSectionProps {
  simple?: boolean; // Se true, remove o cabeçalho grande para usar dentro de outras páginas
}

export const PlansSection: React.FC<PlansSectionProps> = ({ simple = false }) => {
  const { shop } = useShop();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const lastShopId = useRef<string | null>(null);
  
  useEffect(() => {
    
    // âœ… PROTEÃ‡ÃƒO 1: Aguardar shop.id válido
    if (!shop.id || shop.id.startsWith('shop-') || shop.id.length < 10) {
      setLoading(false);
      return;
    }
    
    // âœ… PROTEÃ‡ÃƒO 2: Evitar recarregar para o mesmo shop
    if (hasFetched.current && lastShopId.current === shop.id) {
      return;
    }
    
    lastShopId.current = shop.id;
    hasFetched.current = true;
    
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const shopPlans = await planService.getPublicPlans(shop.id);
        
        
        // Filtrar apenas planos ativos
        const activePlans = shopPlans.filter(p => p.active);
        setPlans(activePlans);
        
      } catch (error: any) {
        console.error('âŒ PlansSection: Erro ao carregar planos:', error);
        setError('Não foi possível carregar os planos');
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [shop.id]);

  if (loading) {
    return (
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">Carregando planos...</p>
        </div>
      </section>
    );
  }

  if (plans.length === 0) return null;

  // Determinar colunas do Grid baseado no número de planos (máximo 4)
  const getCols = () => {
    if (plans.length <= 2) return plans.length as 1 | 2;
    if (plans.length === 3) return 3;
    return 4;
  };

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!simple && (
          <SectionHeader 
            title="Planos de Assinatura"
            description="Escolha o plano ideal para o seu estilo nesta unidade. Economize e mantenha o visual sempre em dia."
          />
        )}

        {/* Layout adaptativo: usa Grid com centralização para 1-2 itens */}
        <Grid 
          cols={getCols()}
          gap="lg"
          className={plans.length <= 2 ? 'justify-items-center' : ''}
        >
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} linkPath="/login" />
          ))}
        </Grid>
      </div>
    </section>
  );
};
