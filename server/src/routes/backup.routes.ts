import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to convert array of objects to CSV string
function toCsv(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

// GET /api/backup/export-json (Full Database JSON Backup)
router.get('/export-json', authenticate, requireRole(['ADMIN']), async (_req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [
      settings,
      categories,
      products,
      customers,
      suppliers,
      sales,
      saleItems,
      purchases,
      purchaseItems,
      expenses,
      stockTransactions,
      customerLedger,
      supplierLedger,
    ] = await Promise.all([
      prisma.businessSettings.findMany(),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.expense.findMany(),
      prisma.stockTransaction.findMany(),
      prisma.customerLedger.findMany(),
      prisma.supplierLedger.findMany(),
    ]);

    const backupData = {
      system: 'Jay Mataji Rajwadi Chai Shop Management System',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        categories,
        products,
        customers,
        suppliers,
        sales,
        saleItems,
        purchases,
        purchaseItems,
        expenses,
        stockTransactions,
        customerLedger,
        supplierLedger,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=rajwadi-chai-backup-${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create backup export.' });
  }
});

// GET /api/backup/export-csv/:type
router.get('/export-csv/:type', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { type } = req.params;
    let data: any[] = [];
    let filename = `export-${type}-${Date.now()}.csv`;

    if (type === 'products') {
      const products = await prisma.product.findMany({ include: { category: true } });
      data = products.map((p) => ({
        ID: p.id,
        Name: p.name,
        Category: p.category?.name,
        SKU: p.sku,
        Barcode: p.barcode,
        Unit: p.unit,
        CurrentStock: p.currentStock,
        PurchasePrice: p.purchasePrice,
        SellingPrice: p.sellingPrice,
        MinStock: p.minStockLevel,
        Status: p.status,
      }));
    } else if (type === 'sales') {
      const sales = await prisma.sale.findMany({ include: { customer: true, cashier: true } });
      data = sales.map((s) => ({
        InvoiceNumber: s.invoiceNumber,
        Customer: s.customer?.name || 'Walk-in',
        Cashier: s.cashier?.name,
        Date: s.createdAt.toISOString(),
        Subtotal: s.subtotal,
        Discount: s.discount,
        Tax: s.tax,
        Total: s.total,
        PaidAmount: s.paidAmount,
        PaymentMethod: s.paymentMethod,
        PaymentStatus: s.paymentStatus,
      }));
    } else if (type === 'customers') {
      const customers = await prisma.customer.findMany();
      data = customers.map((c) => ({
        Name: c.name,
        Mobile: c.mobile,
        Email: c.email,
        CurrentCreditBalance: c.currentBalance,
        TotalPurchases: c.totalPurchases,
        LastPurchase: c.lastPurchase?.toISOString() || '',
      }));
    } else if (type === 'suppliers') {
      const suppliers = await prisma.supplier.findMany();
      data = suppliers.map((s) => ({
        Name: s.name,
        Company: s.company,
        Mobile: s.mobile,
        GST: s.gstNumber,
        CurrentPayableBalance: s.currentBalance,
      }));
    } else if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({ include: { category: true } });
      data = expenses.map((e) => ({
        Date: e.date.toISOString().split('T')[0],
        Title: e.title,
        Category: e.category?.name,
        Amount: e.amount,
        PaymentMethod: e.paymentMethod,
        Notes: e.notes || '',
      }));
    } else if (type === 'inventory') {
      const products = await prisma.product.findMany({ include: { category: true } });
      data = products.map((p) => ({
        Name: p.name,
        Category: p.category?.name,
        SKU: p.sku,
        CurrentStock: p.currentStock,
        Unit: p.unit,
        CostPrice: p.purchasePrice,
        StockValue: p.currentStock * p.purchasePrice,
        MinStock: p.minStockLevel,
        StockStatus: p.currentStock <= 0 ? 'Out of Stock' : (p.currentStock <= p.minStockLevel ? 'Low Stock' : 'In Stock'),
      }));
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type requested.' });
    }

    const csvContent = toCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'CSV export failed.' });
  }
});

export default router;
