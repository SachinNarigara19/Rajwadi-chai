import { Router, Response } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/reports/daily (Requirement 24: Daily Report)
router.get('/daily', async (req, res: Response): Promise<any> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Sales of the day
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      include: { items: true },
    });

    let totalSales = 0;
    let totalItems = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;

    for (const s of sales) {
      totalSales += s.total;
      for (const item of s.items) {
        totalItems += item.quantity;
      }

      if (s.paymentMethod === 'CASH') cashSales += s.total;
      else if (s.paymentMethod === 'UPI') upiSales += s.total;
      else if (s.paymentMethod === 'CARD') cardSales += s.total;
      else if (s.paymentMethod === 'CREDIT') creditSales += s.total;
      else cashSales += s.total;
    }

    // Expenses of the day
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { category: true },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netAmount = totalSales - totalExpenses;

    return res.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      totalSales: Math.round(totalSales * 100) / 100,
      totalBills: sales.length,
      totalItems,
      paymentBreakdown: {
        cash: Math.round(cashSales * 100) / 100,
        upi: Math.round(upiSales * 100) / 100,
        card: Math.round(cardSales * 100) / 100,
        credit: Math.round(creditSales * 100) / 100,
      },
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      sales,
      expenses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate daily report.' });
  }
});

// GET /api/reports/monthly (Requirement 23: Monthly Report)
router.get('/monthly', async (req, res: Response): Promise<any> => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month !== undefined ? parseInt(month as string, 10) : now.getMonth(); // 0-indexed
    const targetYear = year !== undefined ? parseInt(year as string, 10) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Sales for the month
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
      include: { items: true },
    });

    let totalSales = 0;
    let totalCogs = 0;
    let totalItemsSold = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;

    for (const s of sales) {
      totalSales += s.total;
      for (const item of s.items) {
        totalItemsSold += item.quantity;
        totalCogs += item.quantity * item.purchasePrice;
      }

      if (s.paymentMethod === 'CASH') cashSales += s.total;
      else if (s.paymentMethod === 'UPI') upiSales += s.total;
      else if (s.paymentMethod === 'CARD') cardSales += s.total;
      else if (s.paymentMethod === 'CREDIT') creditSales += s.total;
      else cashSales += s.total;
    }

    // Purchases for the month
    const purchases = await prisma.purchase.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { items: true },
    });

    let totalPurchases = 0;
    let totalPurchasedItems = 0;
    for (const p of purchases) {
      totalPurchases += p.totalAmount;
      for (const it of p.items) {
        totalPurchasedItems += it.quantity;
      }
    }

    // Expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalSales - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    // Outstanding customer credit & supplier payables
    const [customers, suppliers, products] = await Promise.all([
      prisma.customer.findMany({ select: { currentBalance: true } }),
      prisma.supplier.findMany({ select: { currentBalance: true } }),
      prisma.product.findMany({ select: { currentStock: true, purchasePrice: true } }),
    ]);

    const totalCustomerCredit = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      financialSummary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        cogs: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        customerCredit: Math.round(totalCustomerCredit * 100) / 100,
        supplierPayables: Math.round(totalSupplierPayables * 100) / 100,
      },
      salesBreakdown: {
        numberOfInvoices: sales.length,
        itemsSold: totalItemsSold,
        averageBillValue: sales.length > 0 ? Math.round((totalSales / sales.length) * 100) / 100 : 0,
        cashSales: Math.round(cashSales * 100) / 100,
        upiSales: Math.round(upiSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        creditSales: Math.round(creditSales * 100) / 100,
      },
      inventoryFlow: {
        purchasedUnits: totalPurchasedItems,
        soldUnits: totalItemsSold,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate monthly report.' });
  }
});

// GET /api/reports/sales (Requirement 25: Sales Report with Analytics)
router.get('/sales', async (req, res: Response): Promise<any> => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else {
      // 30 days
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Sales Trend over time (grouped by day or hour)
    const trendMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    let totalRevenue = 0;

    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      trendMap[dateKey] = (trendMap[dateKey] || 0) + sale.total;
      totalRevenue += sale.total;

      for (const item of sale.items) {
        // Category breakdown
        const catName = item.product?.category?.name || 'Uncategorized';
        categoryMap[catName] = (categoryMap[catName] || 0) + item.totalPrice;

        // Top products
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productMap[item.productId].quantity += item.quantity;
        productMap[item.productId].revenue += item.totalPrice;
      }
    }

    const salesTrend = Object.entries(trendMap).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    const categorySales = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return res.json({
      success: true,
      period,
      totalSalesCount: sales.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      salesTrend,
      categorySales,
      topProducts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate sales report.' });
  }
});

// GET /api/reports/profit (Requirement 27: Profit Report: Revenue - COGS - Expenses = Net Profit)
router.get('/profit', async (req, res: Response): Promise<any> => {
  try {
    const { startDate, endDate } = req.query;

    let start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    }

    // Sales items with purchasePrice snapshot
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      include: { items: true },
    });

    let grossRevenue = 0;
    let cogs = 0;

    for (const sale of sales) {
      grossRevenue += sale.total;
      for (const item of sale.items) {
        cogs += item.quantity * item.purchasePrice;
      }
    }

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: { category: true },
    });

    let totalExpenses = 0;
    const expenseBreakdown: Record<string, number> = {};

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      const cat = exp.category?.name || 'General';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + exp.amount;
    }

    const grossProfit = grossRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return res.json({
      success: true,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      cogs: Math.round(cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      expenseBreakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate profit report.' });
  }
});

// GET /api/reports/purchases (Requirement 26: Purchase Report)
router.get('/purchases', async (req, res: Response): Promise<any> => {
  try {
    const { startDate, endDate } = req.query;

    let start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    let totalPurchaseAmount = 0;
    let totalItemsPurchased = 0;
    const supplierPurchases: Record<string, { name: string; amount: number; count: number }> = {};
    const productPurchases: Record<string, { name: string; quantity: number; amount: number }> = {};

    for (const p of purchases) {
      totalPurchaseAmount += p.totalAmount;

      const suppName = p.supplier.name;
      if (!supplierPurchases[suppName]) {
        supplierPurchases[suppName] = { name: suppName, amount: 0, count: 0 };
      }
      supplierPurchases[suppName].amount += p.totalAmount;
      supplierPurchases[suppName].count += 1;

      for (const it of p.items) {
        totalItemsPurchased += it.quantity;
        const prodName = it.product.name;
        if (!productPurchases[prodName]) {
          productPurchases[prodName] = { name: prodName, quantity: 0, amount: 0 };
        }
        productPurchases[prodName].quantity += it.quantity;
        productPurchases[prodName].amount += it.totalPrice;
      }
    }

    const suppliers = await prisma.supplier.findMany({
      select: { name: true, currentBalance: true },
    });
    const outstandingSupplierBalance = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

    return res.json({
      success: true,
      totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
      totalItemsPurchased,
      purchaseCount: purchases.length,
      outstandingSupplierBalance: Math.round(outstandingSupplierBalance * 100) / 100,
      supplierPurchases: Object.values(supplierPurchases),
      productPurchases: Object.values(productPurchases),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate purchase report.' });
  }
});

export default router;
