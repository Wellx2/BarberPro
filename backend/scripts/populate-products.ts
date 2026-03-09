import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // POMADAS E CERAS
  {
    name: 'Pomada Modeladora Strong',
    category: 'POMADAS',
    price: 45.00,
    costPrice: 22.00,
    stock: 25,
    unit: 'unidade',
    description: 'Pomada de alta fixação para modelagem profissional',
    formulation: 'Cera de abelha, óleo de argan, lanolina',
    howToUse: 'Aplicar pequena quantidade no cabelo úmido ou seco e modelar',
    recommendedFor: 'Cabelos de todos os tipos que necessitam de fixação forte',
    image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400',
  },
  {
    name: 'Cera Modeladora Efeito Mate',
    category: 'POMADAS',
    price: 42.00,
    costPrice: 20.00,
    stock: 30,
    unit: 'unidade',
    description: 'Cera com acabamento fosco e fixação média',
    formulation: 'Cera microcristalina, argila branca, óleo de coco',
    howToUse: 'Esquentar entre as mãos e aplicar no cabelo seco',
    recommendedFor: 'Homens que buscam visual natural e sem brilho',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
  },
  {
    name: 'Pomada Brilho Intenso',
    category: 'POMADAS',
    price: 48.00,
    costPrice: 24.00,
    stock: 20,
    unit: 'unidade',
    description: 'Pomada para penteados clássicos com alto brilho',
    formulation: 'Petrolato, cera de carnaúba, óleo mineral',
    howToUse: 'Aplicar no cabelo úmido e pentear para o estilo desejado',
    recommendedFor: 'Estilos vintage e penteados laterais',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400',
  },

  // SHAMPOOS
  {
    name: 'Shampoo Anticaspa Premium',
    category: 'SHAMPOOS',
    price: 38.00,
    costPrice: 18.00,
    stock: 40,
    unit: 'unidade',
    description: 'Shampoo profissional para tratamento de caspa e oleosidade',
    formulation: 'Piritionato de zinco, mentol, extrato de tea tree',
    howToUse: 'Aplicar no couro cabeludo úmido, massagear e enxaguar. Repetir se necessário',
    recommendedFor: 'Cabelos com caspa, oleosidade ou coceira no couro cabeludo',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400',
  },
  {
    name: 'Shampoo para Barba',
    category: 'SHAMPOOS',
    price: 35.00,
    costPrice: 16.00,
    stock: 35,
    unit: 'unidade',
    description: 'Limpeza suave específica para barbas',
    formulation: 'Proteínas da seda, óleo de jojoba, vitamina E',
    howToUse: 'Aplicar na barba úmida, massagear e enxaguar',
    recommendedFor: 'Todos os tipos de barba',
    image: 'https://images.unsplash.com/photo-1621604166921-7a582c030ec7?w=400',
  },
  {
    name: 'Shampoo Hidratante',
    category: 'SHAMPOOS',
    price: 36.00,
    costPrice: 17.00,
    stock: 38,
    unit: 'unidade',
    description: 'Hidratação profunda para cabelos secos e danificados',
    formulation: 'Queratina, D-pantenol, óleo de argan',
    howToUse: 'Aplicar nos cabelos molhados, massagear e deixar agir por 2 minutos antes de enxaguar',
    recommendedFor: 'Cabelos secos, crespos ou quimicamente tratados',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },

  // CONDICIONADORES
  {
    name: 'Condicionador Reparador',
    category: 'CONDICIONADORES',
    price: 40.00,
    costPrice: 19.00,
    stock: 32,
    unit: 'unidade',
    description: 'Reconstrução capilar intensa',
    formulation: 'Colágeno hidrolisado, ceramidas, óleo de macadâmia',
    howToUse: 'Após o shampoo, aplicar no comprimento dos fios, deixar 3 minutos e enxaguar',
    recommendedFor: 'Cabelos danificados, quebradiços ou porosos',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
  },
  {
    name: 'Leave-in Protetor Térmico',
    category: 'CONDICIONADORES',
    price: 42.00,
    costPrice: 20.00,
    stock: 28,
    unit: 'unidade',
    description: 'Proteção contra calor e finalizador sem enxágue',
    formulation: 'Silicones voláteis, filtro UV, proteínas de quinoa',
    howToUse: 'Aplicar nos cabelos úmidos antes da secagem ou finalização',
    recommendedFor: 'Todos os tipos de cabelo, especialmente antes de usar secador ou chapinha',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400',
  },

  // ÓLEOS E SÉRUMS
  {
    name: 'Óleo para Barba Premium',
    category: 'ÓLEOS',
    price: 55.00,
    costPrice: 26.00,
    stock: 22,
    unit: 'unidade',
    description: 'Blend de óleos essenciais para nutrição e brilho',
    formulation: 'Óleo de jojoba, argan, amêndoas doces, vitamina E, fragrância amadeirada',
    howToUse: 'Aplicar 3-5 gotas na barba seca ou úmida, distribuir uniformemente',
    recommendedFor: 'Barbas de todos os tamanhos, previne ressecamento e coceira',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
  },
  {
    name: 'Sérum Capilar Finalizador',
    category: 'ÓLEOS',
    price: 52.00,
    costPrice: 25.00,
    stock: 26,
    unit: 'unidade',
    description: 'Brilho intenso e controle de frizz',
    formulation: 'Óleo de argan marroquino, silicone catiônico, vitamina E',
    howToUse: 'Aplicar 1-2 gotas nas pontas dos cabelos secos',
    recommendedFor: 'Cabelos sem vida, opacos ou com pontas duplas',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400',
  },

  // GEL E SPRAY
  {
    name: 'Gel Fixador Extra Forte',
    category: 'FIXADORES',
    price: 28.00,
    costPrice: 13.00,
    stock: 45,
    unit: 'unidade',
    description: 'Gel de alta performance para fixação duradoura',
    formulation: 'Polímeros fixadores, D-pantenol, proteína da seda',
    howToUse: 'Aplicar no cabelo úmido e modelar conforme desejado',
    recommendedFor: 'Penteados que necessitam de fixação extrema',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
  },
  {
    name: 'Spray Fixador Profissional',
    category: 'FIXADORES',
    price: 32.00,
    costPrice: 15.00,
    stock: 40,
    unit: 'unidade',
    description: 'Fixação leve com secagem rápida',
    formulation: 'Resinas acrílicas, vitamina B5, filtro UV',
    howToUse: 'Borrifar a 20cm de distância após finalizar o penteado',
    recommendedFor: 'Fixação de penteados sem peso ou resíduos',
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400',
  },

  // PÓS-BARBA
  {
    name: 'Loção Pós-Barba Refrescante',
    category: 'PÓS-BARBA',
    price: 46.00,
    costPrice: 22.00,
    stock: 30,
    unit: 'unidade',
    description: 'Acalma e hidrata após o barbear',
    formulation: 'Aloe vera, mentol, hamamélis, ácido salicílico',
    howToUse: 'Aplicar após o barbear em pele limpa e seca',
    recommendedFor: 'Todos os tipos de pele, especialmente sensíveis',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
  },
  {
    name: 'Bálsamo Pós-Barba',
    category: 'PÓS-BARBA',
    price: 48.00,
    costPrice: 23.00,
    stock: 28,
    unit: 'unidade',
    description: 'Hidratação intensa sem álcool',
    formulation: 'Manteiga de karité, vitamina E, óleo de sândalo',
    howToUse: 'Massagear suavemente no rosto após o barbear',
    recommendedFor: 'Peles secas ou que irritam facilmente após o barbear',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
  },

  // COLORAÇÃO
  {
    name: 'Tinta para Cabelo - Preto Intenso',
    category: 'COLORAÇÃO',
    price: 65.00,
    costPrice: 30.00,
    stock: 15,
    unit: 'unidade',
    description: 'Coloração permanente profissional',
    formulation: 'Amônia-free, queratina, óleo de argan',
    howToUse: 'Misturar com oxidante, aplicar e deixar agir 30-40 minutos. Uso profissional',
    recommendedFor: 'Cobertura de cabelos brancos ou mudança de cor permanente',
    image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400',
  },
  {
    name: 'Tinta para Barba - Castanho',
    category: 'COLORAÇÃO',
    price: 58.00,
    costPrice: 27.00,
    stock: 18,
    unit: 'unidade',
    description: 'Coloração específica para barbas com resultado natural',
    formulation: 'Sem amônia, com ceramidas e vitamina E',
    howToUse: 'Aplicar na barba limpa e seca, deixar 10 minutos e enxaguar',
    recommendedFor: 'Disfarçar fios brancos da barba',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
  },

  // ESFOLIANTES E MÁSCARAS
  {
    name: 'Esfoliante Facial Masculino',
    category: 'TRATAMENTO',
    price: 44.00,
    costPrice: 21.00,
    stock: 24,
    unit: 'unidade',
    description: 'Limpeza profunda e renovação celular',
    formulation: 'Microesferas de jojoba, carvão ativado, ácido salicílico',
    howToUse: 'Aplicar em movimentos circulares 2x por semana, enxaguar',
    recommendedFor: 'Peles oleosas, com cravos ou poros dilatados',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
  },
  {
    name: 'Máscara Capilar Reconstrução',
    category: 'TRATAMENTO',
    price: 68.00,
    costPrice: 32.00,
    stock: 20,
    unit: 'unidade',
    description: 'Tratamento intensivo semanal',
    formulation: 'Queratina hidrolisada, colágeno, aminoácidos',
    howToUse: 'Aplicar após o shampoo, deixar 10-15 minutos com touca térmica, enxaguar',
    recommendedFor: 'Cabelos muito danificados ou com química',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400',
  },

  // ACESSÓRIOS/FERRAMENTAS
  {
    name: 'Escova de Barba Cerdas Naturais',
    category: 'ACESSÓRIOS',
    price: 38.00,
    costPrice: 18.00,
    stock: 20,
    unit: 'unidade',
    description: 'Escova premium para modelagem e distribuição de produtos',
    formulation: 'Cerdas de javali, cabo de madeira nobre',
    howToUse: 'Escovar a barba diariamente no sentido do crescimento dos fios',
    recommendedFor: 'Barbas médias e longas',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
  },
  {
    name: 'Pente de Madeira Premium',
    category: 'ACESSÓRIOS',
    price: 32.00,
    costPrice: 15.00,
    stock: 25,
    unit: 'unidade',
    description: 'Pente antiestático para finalização',
    formulation: 'Madeira de sândalo polida',
    howToUse: 'Usar para pentear e distribuir produtos uniformemente',
    recommendedFor: 'Todos os tipos de cabelo e barba',
    image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=400',
  },
];

async function main() {
  console.log('🔍 Verificando barbearias no sistema...');
  
  const shops = await prisma.barbershop.findMany({
    where: { active: true },
    select: { id: true, name: true }
  });

  if (shops.length === 0) {
    console.log('❌ Nenhuma barbearia encontrada. Execute o seed primeiro.');
    return;
  }

  console.log(`✅ Encontradas ${shops.length} barbearias ativas`);

  for (const shop of shops) {
    console.log(`\n📦 Populando produtos para: ${shop.name}`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const productData of products) {
      const existing = await prisma.product.findFirst({
        where: {
          shopId: shop.id,
          name: productData.name
        }
      });

      if (existing) {
        // Atualizar apenas se não tiver imagem
        if (!existing.image) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              image: productData.image,
              formulation: productData.formulation,
              howToUse: productData.howToUse,
              recommendedFor: productData.recommendedFor,
              costPrice: productData.costPrice,
            }
          });
          updated++;
          console.log(`   ↻ Atualizado: ${productData.name}`);
        } else {
          skipped++;
        }
      } else {
        // Criar novo produto
        await prisma.product.create({
          data: {
            ...productData,
            shopId: shop.id,
          }
        });
        created++;
        console.log(`   ✓ Criado: ${productData.name}`);
      }
    }

    console.log(`\n📊 Resumo para ${shop.name}:`);
    console.log(`   ✨ Criados: ${created}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ⏭️  Ignorados: ${skipped}`);
  }

  console.log('\n✅ Processo de população de produtos concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao popular produtos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
