import { Router, Response } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/notifications
router.get('/', async (_req, res: Response): Promise<any> => {
  try {
    const notifications: any[] = [];

    // 1. Low stock & Out of stock alerts
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, currentStock: true, minStockLevel: true, unit: true },
    });

    for (const p of products) {
      if (p.currentStock <= 0) {
        notifications.push({
          id: `out-of-stock-${p.id}`,
          type: 'OUT_OF_STOCK',
          severity: 'error',
          title: `Out of Stock: ${p.name}`,
          message: `${p.name} has 0 ${p.unit} remaining! New billing blocked until replenished.`,
          link: `/inventory?filter=out-of-stock`,
          timestamp: new Date(),
        });
      } else if (p.currentStock <= p.minStockLevel) {
        notifications.push({
          id: `low-stock-${p.id}`,
          type: 'LOW_STOCK',
          severity: 'warning',
          title: `Low Stock Alert: ${p.name}`,
          message: `Only ${p.currentStock} ${p.unit} left (Minimum threshold is ${p.minStockLevel}).`,
          link: `/inventory?filter=low-stock`,
          timestamp: new Date(),
        });
      }
    }

    // 2. Pending high credit customers (e.g. > ₹500)
    const highCreditCustomers = await prisma.customer.findMany({
      where: { currentBalance: { gt: 500 } },
      orderBy: { currentBalance: 'desc' },
      take: 5,
    });

    for (const c of highCreditCustomers) {
      notifications.push({
        id: `customer-credit-${c.id}`,
        type: 'CUSTOMER_CREDIT',
        severity: 'info',
        title: `Pending Khata: ${c.name}`,
        message: `Outstanding credit balance of ₹${c.currentBalance} pending settlement.`,
        link: `/customers/${c.id}`,
        timestamp: new Date(),
      });
    }

    // 3. Pending supplier payables
    const highPayableSuppliers = await prisma.supplier.findMany({
      where: { currentBalance: { gt: 1000 } },
      orderBy: { currentBalance: 'desc' },
      take: 5,
    });

    for (const s of highPayableSuppliers) {
      notifications.push({
        id: `supplier-payable-${s.id}`,
        type: 'SUPPLIER_PAYABLE',
        severity: 'info',
        title: `Supplier Payable: ${s.name}`,
        message: `Outstanding procurement payable of ₹${s.currentBalance}.`,
        link: `/suppliers/${s.id}`,
        timestamp: new Date(),
      });
    }

    return res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

export default router;
