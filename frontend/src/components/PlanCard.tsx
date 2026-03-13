import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Plan } from '../types';

interface PlanCardProps {
  plan: Plan;
  linkPath?: string; // Caminho para o link do botão (ex: '/login' ou '/book')
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, linkPath = '/login' }) => {
  const isSingle = plan.id.startsWith('single') || plan.name.toLowerCase().includes('avulso');

  return (
    <div
      className={`relative bg-gray-800 rounded-[35px] p-8 flex flex-col transition-transform hover:-translate-y-1 ${plan.isPopular ? 'ring-2 ring-tenant-primary shadow-2xl shadow-tenant-primary/20' : 'border border-gray-700'}`}
    >
      {plan.isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-tenant-primary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          Mais Popular
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{plan.name}</h3>
        <div className="flex items-baseline">
          <span className="text-4xl font-black text-tenant-primary tracking-tighter">R$ {Math.floor(plan.price)}</span>
          <span className="text-xl font-bold text-tenant-primary">,{plan.price.toFixed(2).split('.')[1]}</span>
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
            <Check className="h-4 w-4 text-tenant-primary mr-2 flex-shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>

      <Link
        to={isSingle ? '/book' : linkPath}
        className={`w-full py-5 rounded-[22px] font-black uppercase text-[11px] tracking-[0.2em] text-center transition-all block active:scale-95 ${plan.isPopular
            ? 'bg-tenant-primary hover:opacity-90 text-white shadow-xl shadow-tenant-primary/20'
            : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
          }`}
      >
        {isSingle ? 'Reservar Avulso' : 'Assinar Agora'}
      </Link>
    </div>
  );
};
