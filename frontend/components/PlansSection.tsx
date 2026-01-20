
import React from 'react';
// Fix: Import Link from react-router-dom to resolve export error in some environments
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PLANS } from '../constants';
import { useShop } from '../context/ShopContext';

interface PlansSectionProps {
  simple?: boolean; // Se true, remove o cabeçalho grande para usar dentro de outras páginas
}

export const PlansSection: React.FC<PlansSectionProps> = ({ simple = false }) => {
  const { shop } = useShop();
  
  // Filter plans for current shop
  const shopPlans = PLANS.filter(p => p.shopId === shop.id);

  if (shopPlans.length === 0) return null;

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!simple && (
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4 uppercase tracking-tighter">Planos de Assinatura</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm font-medium">
              Escolha o plano ideal para o seu estilo nesta unidade. Economize e mantenha o visual sempre em dia.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {shopPlans.map((plan) => {
            const isSingle = plan.id.startsWith('single');
            return (
              <div 
                key={plan.id} 
                className={`relative bg-gray-800 rounded-[35px] p-8 flex flex-col transition-transform hover:-translate-y-1 ${plan.isPopular ? 'ring-2 ring-amber-500 shadow-2xl shadow-amber-900/20' : 'border border-gray-700'}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Mais Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black text-amber-500 tracking-tighter">R$ {Math.floor(plan.price)}</span>
                    <span className="text-xl font-bold text-amber-500">,{plan.price.toFixed(2).split('.')[1]}</span>
                    <span className="text-gray-400 ml-2 text-xs font-bold uppercase">{isSingle ? '/corte' : '/mês'}</span>
                  </div>
                  {plan.discount > 0 && (
                      <span className="inline-block mt-3 bg-green-500/10 text-green-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                          {plan.discount}% OFF em produtos
                      </span>
                  )}
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-xs font-medium text-gray-300">
                      <Check className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                
                {/* Standardized Button inside Plans Section */}
                {isSingle ? (
                  <Link 
                    to="/book" 
                    className="w-full py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] text-center transition-all bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 block active:scale-95"
                  >
                    Reservar Avulso
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    className={`w-full py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] text-center transition-all block active:scale-95 ${plan.isPopular ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                  >
                    Assinar Agora
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
