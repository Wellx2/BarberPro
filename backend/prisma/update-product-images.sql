-- ========================================
-- Script: Atualizar Imagens dos Produtos
-- Data: 12/02/2026
-- Descrição: Adiciona URLs do Unsplash para todos os produtos
-- ========================================

-- POMADAS E CERAS
UPDATE products SET image = 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400' WHERE name = 'Pomada Modeladora Strong';
UPDATE products SET image = 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400' WHERE name = 'Cera para Cabelo Matte';

-- SHAMPOOS E CONDICIONADORES
UPDATE products SET image = 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400' WHERE name = 'Shampoo Anticaspa Premium';
UPDATE products SET image = 'https://images.unsplash.com/photo-1556229010-aa03873b9e9a?w=400' WHERE name = 'Condicionador Hidratante';

-- PRODUTOS PARA BARBA
UPDATE products SET image = 'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?w=400' WHERE name = 'Óleo para Barba';
UPDATE products SET image = 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=400' WHERE name = 'Balm Pós-Barba';
UPDATE products SET image = 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400' WHERE name = 'Espuma de Barbear Premium';
UPDATE products SET image = 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400' WHERE name = 'Loção Pré-Barba';

-- GÉIS E SPRAYS
UPDATE products SET image = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400' WHERE name = 'Gel Fixador Ultra Hold';
UPDATE products SET image = 'https://images.unsplash.com/photo-1585838686643-f5d1c2e89fb7?w=400' WHERE name = 'Spray Texturizador';

-- ACESSÓRIOS
UPDATE products SET image = 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400' WHERE name = 'Kit Pente + Escova';
UPDATE products SET image = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400' WHERE name = 'Talco para Acabamento';

-- BEBIDAS
UPDATE products SET image = 'https://images.unsplash.com/photo-1622543925917-763c34f6530a?w=400' WHERE name = 'Bebida Energético Lata';
UPDATE products SET image = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400' WHERE name = 'Água Mineral 500ml';
UPDATE products SET image = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' WHERE name = 'Café Expresso';

-- Verificar atualização
SELECT name, category, 
       CASE 
         WHEN image IS NOT NULL THEN '✅ Com imagem'
         ELSE '❌ Sem imagem'
       END as status
FROM products
ORDER BY category, name;
