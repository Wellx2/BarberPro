import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { prisma } from '../services/prisma.js';
import { z } from 'zod';

const router = Router();

// Listar produtos por shop
router.get('/shops/:shopId', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { 
      shopId: req.params.shopId,
      active: true 
    },
    orderBy: { category: 'asc' }
  });
  res.json(products);
});

// Carrinho: GET/ADD/UPDATE
router.get('/cart/:userId', authMiddleware, async (req, res) => {
  let cart = await prisma.cart.findFirst({
    where: { userId: req.params.userId, status: 'ACTIVE' }
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user!.id, shopId: req.query.shopId as string }
    });
  }
  res.json(cart);
});

router.post('/cart/:userId/items', authMiddleware, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.stock < quantity) {
    return res.status(400).json({ error: 'Estoque insuficiente' });
  }

  // Update/add item
  const cart = await prisma.cart.upsert({
    where: { userId_status: { userId: req.user!.id, status: 'ACTIVE' } },
    update: {
      items: {
        push: [{ productId, quantity, price: product.price }]
      }
    },
    create: {
      userId: req.user!.id,
      shopId: product.shopId,
      items: [{ productId, quantity, price: product.price }]
    }
  });

  res.json(cart);
});

// Checkout → Order
router.post('/orders', authMiddleware, async (req, res) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: req.user!.id, status: 'ACTIVE' }
  });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  // Decrement stock
  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      shopId: cart.shopId,
      items: cart.items,
      total: cart.total
    }
  });

  // Close cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: 'COMPLETED' }
  });

  res.json(order);
});

export default router;
