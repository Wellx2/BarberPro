import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { Card, Button } from './ui';
import { Grid } from './layout/Grid';

interface ProductGridProps {
  products: Product[];
  subscriptionsActive: boolean;
  userHasPlan: boolean;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  maxItems?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  subscriptionsActive,
  userHasPlan,
  onAddToCart,
  onViewDetails,
  maxItems
}) => {
  const displayedProducts = maxItems ? products.slice(0, maxItems) : products;

  const getActualPrice = (product: Product) => {
    if (userHasPlan && subscriptionsActive) {
      // Assumindo 20% de desconto para assinantes
      return product.price * 0.8;
    }
    return product.price;
  };

  return (
    <Grid
      cols={Math.min(displayedProducts.length, 3) as 1 | 2 | 3 | 4 | 5 | 6}
      gap="lg"
      className={displayedProducts.length <= 2 ? 'max-w-3xl mx-auto' : ''}
    >
      {displayedProducts.map(product => {
        const actualPrice = getActualPrice(product);
        const hasDiscount = subscriptionsActive && userHasPlan && actualPrice < product.price;

        return (
          <Card
            key={product.id}
            hover
            className="flex flex-col group cursor-pointer overflow-hidden"
            onClick={() => onViewDetails(product)}
          >
            <div className="relative h-64">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white uppercase tracking-widest">
                  Esgotado
                </div>
              )}
            </div>
            <Card.Body className="flex-1 flex flex-col">
              <span className="text-[9px] font-black text-tenant-primary uppercase tracking-[0.2em] mb-2">
                {product.category}
              </span>
              <h3 className="font-black text-gray-900 dark:text-white text-lg mb-3 uppercase leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 font-medium flex-1">
                {product.description}
              </p>

              <div className="mt-auto space-y-4">
                <div>
                  {hasDiscount ? (
                    <>
                      <p className="text-xs text-gray-400 line-through font-bold">
                        R$ {product.price.toFixed(2)}
                      </p>
                      <p className="text-2xl font-black text-tenant-primary">
                        R$ {actualPrice.toFixed(2)}
                      </p>
                      <p className="text-[8px] font-black text-gray-400 uppercase mt-1">
                        Preço exclusivo VIP
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-tenant-primary">
                      R$ {product.price.toFixed(2)}
                    </p>
                  )}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  disabled={product.stock === 0}
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={<ShoppingBag size={16} strokeWidth={2.5} />}
                >
                  Carrinho
                </Button>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </Grid>
  );
};
