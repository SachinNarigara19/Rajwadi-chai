import { Router, Response } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/search?q=query
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.json({ success: true, results: { products: [], customers: [], suppliers: [], sales: [], purchases: [] } });
    }

    const term = q.trim();

    const [products, customers, suppliers, sales, purchases] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: term } },
            { sku: { contains: term } },
            { barcode: { contains: term } },
          ],
        },
        take: 8,
        include: { category: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: term } },
            { mobile: { contains: term } },
          ],
        },
        take: 6,
      }),
      prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: term } },
            { company: { contains: term } },
            { mobile: { contains: term } },
          ],
        },
        take: 6,
      }),
      prisma.sale.findMany({
        where: {
          invoiceNumber: { contains: term },
        },
        take: 6,
        include: { customer: true },
      }),
      prisma.purchase.findMany({
        where: {
          purchaseNumber: { contains: term },
        },
        take: 6,
        include: { supplier: true },
      }),
    ]);

    return res.json({
      success: true,
      query: term,
      results: {
        products,
        customers,
        suppliers,
        sales,
        purchases,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Global search failed.' });
  }
});

export default router;
