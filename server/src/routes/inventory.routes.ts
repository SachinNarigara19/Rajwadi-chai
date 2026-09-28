import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/inventory/summary
router.get('/summary', async (req, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
        purchasePrice: true,
        sellingPrice: true,
        saleItems: {
          select: { quantity: true },
        },
      },
    });

    const totalProducts = products.length;
    let totalStockQuantity = 0; // Remaining stock
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalSoldQuantity = 0; // Customer bought

    for (const p of products) {
      const sold = p.saleItems.reduce((acc, it) => acc + it.quantity, 0);
      totalSoldQuantity += sold;
      totalStockQuantity += p.currentStock;
      totalStockValue += p.currentStock * p.purchasePrice;
      if (p.currentStock <= 0) {
        outOfStockCount++;
      } else if (p.currentStock <= p.minStockLevel) {
        lowStockCount++;
      }
    }

    const initialTotalStock = totalStockQuantity + totalSoldQuantity;

    return res.json({
      success: true,
      totalProducts,
      initialTotalStock: Math.round(initialTotalStock * 100) / 100,
      totalSoldQuantity: Math.round(totalSoldQuantity * 100) / 100,
      totalStockQuantity: Math.round(totalStockQuantity * 100) / 100, // Remaining stock
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve inventory summary.' });
  }
});

// GET /api/inventory/valuation (Requirement 30: Inventory Valuation & Customer Stock Deduction)
router.get('/valuation', async (req, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        saleItems: {
          select: { quantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    let grandStockValue = 0;
    let totalInitialStockSum = 0;
    let totalSoldStockSum = 0;
    let totalRemainingStockSum = 0;

    const valuationList = products.map((p) => {
      const stockVal = p.currentStock * p.purchasePrice;
      grandStockValue += stockVal;
      const soldQty = p.saleItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalStock = p.currentStock + soldQty;
      const remainingStock = p.currentStock;

      totalInitialStockSum += totalStock;
      totalSoldStockSum += soldQty;
      totalRemainingStockSum += remainingStock;

      return {
        id: p.id,
        name: p.name,
        category: p.category.name,
        sku: p.sku,
        unit: p.unit,
        totalStock: Math.round(totalStock * 100) / 100, // Initial / Inward stock
        soldStock: Math.round(soldQty * 100) / 100,   // Customer purchased
        currentStock: Math.round(remainingStock * 100) / 100, // Remaining stock
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stockValue: Math.round(stockVal * 100) / 100,
        minStockLevel: p.minStockLevel,
        isLowStock: p.currentStock > 0 && p.currentStock <= p.minStockLevel,
        isOutOfStock: p.currentStock <= 0,
      };
    });

    return res.json({
      success: true,
      grandStockValue: Math.round(grandStockValue * 100) / 100,
      totalInitialStockSum: Math.round(totalInitialStockSum * 100) / 100,
      totalSoldStockSum: Math.round(totalSoldStockSum * 100) / 100,
      totalRemainingStockSum: Math.round(totalRemainingStockSum * 100) / 100,
      count: valuationList.length,
      items: valuationList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate inventory valuation.' });
  }
});

// GET /api/inventory/low-stock (Requirement 28: Low Stock System)
router.get('/low-stock', async (req, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { currentStock: 'asc' },
    });

    const lowStockProducts = products
      .filter((p) => p.currentStock <= p.minStockLevel)
      .map((p) => ({
        ...p,
        isOutOfStock: p.currentStock <= 0,
        suggestedOrderQty: Math.max((p.minStockLevel * 2) - p.currentStock, 10),
      }));

    return res.json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve low stock products.' });
  }
});

// POST /api/inventory/adjust (Requirement 6 & 48: Stock Adjustment - Never modify stock silently!)
router.post('/adjust', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { productId, type, quantity, notes } = req.body;

    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID, type and quantity are required.' });
    }

    const validTypes = ['ADJUSTMENT', 'DAMAGED', 'WASTAGE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid number.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // New balance calculation
    const newStock = product.currentStock + qty;

    if (newStock < 0) {
      const settings = await prisma.businessSettings.findUnique({ where: { id: 'default_settings' } });
      if (!settings?.allowNegativeStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce stock below zero. Current stock is ${product.currentStock} ${product.unit}.`,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // 2. Create StockTransaction record
      const stockTx = await tx.stockTransaction.create({
        data: {
          productId,
          type,
          quantity: qty,
          rate: product.purchasePrice,
          reference: `ADJUSTMENT-${type}`,
          balanceAfter: newStock,
          notes: notes?.trim() || `Manual stock adjustment (${type})`,
          createdById: req.user?.id || null,
        },
      });

      return { updatedProduct, stockTx };
    });

    await createAuditLog({
      action: 'STOCK_ADJUSTMENT',
      entity: 'PRODUCT',
      entityId: productId,
      details: {
        type,
        quantity: qty,
        previousStock: product.currentStock,
        newStock,
        notes,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Stock successfully updated. New stock: ${newStock} ${product.unit}.`,
      product: result.updatedProduct,
      transaction: result.stockTx,
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to adjust stock.' });
  }
});

export default router;
