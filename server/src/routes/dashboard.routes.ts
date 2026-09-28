import { Router, Response } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (_req, res: Response): Promise<any> => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOf7DaysAgo = new Date(now);
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
    startOf7DaysAgo.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Run parallel queries for maximum performance
    const [
      todaySales,
      todayPurchases,
      todayExpenses,
      customers,
      products,
      sales7Days,
      monthSales,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startOfToday, lte: endOfToday }, status: { not: 'CANCELLED' } },
        include: { items: true },
      }),
      prisma.purchase.findMany({
        where: { createdAt: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.customer.findMany({
        select: { currentBalance: true },
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          category: true,
          saleItems: { select: { quantity: true } },
        },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startOf7DaysAgo, lte: endOfToday }, status: { not: 'CANCELLED' } },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startOfMonth, lte: endOfToday }, status: { not: 'CANCELLED' } },
        select: { total: true },
      }),
    ]);

    // Calculate Today's Summary
    let todaySalesTotal = 0;
    let todayItemsSold = 0;
    let todayCogs = 0;

    for (const s of todaySales) {
      todaySalesTotal += s.total;
      for (const it of s.items) {
        todayItemsSold += it.quantity;
        todayCogs += it.quantity * it.purchasePrice;
      }
    }

    const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayProfit = todaySalesTotal - todayCogs - todayExpensesTotal;
    const totalOutstandingCredit = customers.reduce((sum, c) => sum + c.currentBalance, 0);

    // Calculate Inventory Counters & Customer Sales Deduction
    let totalStockQuantity = 0; // Remaining stock
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalSoldQuantity = 0; // Units bought by customers

    for (const p of products) {
      const sold = p.saleItems ? p.saleItems.reduce((acc, it) => acc + it.quantity, 0) : 0;
      totalSoldQuantity += sold;
      totalStockQuantity += p.currentStock;
      totalInventoryValue += p.currentStock * p.purchasePrice;
      if (p.currentStock <= 0) {
        outOfStockCount++;
      } else if (p.currentStock <= p.minStockLevel) {
        lowStockCount++;
      }
    }

    const totalInitialStock = totalStockQuantity + totalSoldQuantity;

    // Today's Hourly Sales (0 to 23)
    const hourlySalesMap: Record<number, number> = {};
    for (let h = 6; h <= 23; h++) {
      hourlySalesMap[h] = 0; // initialize from 6 AM to 11 PM for tea shop
    }
    for (const s of todaySales) {
      const hour = s.createdAt.getHours();
      hourlySalesMap[hour] = (hourlySalesMap[hour] || 0) + s.total;
    }
    const todayHourlySales = Object.entries(hourlySalesMap).map(([hour, amount]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      amount: Math.round(amount * 100) / 100,
    }));

    // Last 7 Days Sales Trend
    const dailyMap: Record<string, { date: string; amount: number; bills: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      dailyMap[key] = { date: display, amount: 0, bills: 0 };
    }
    for (const s of sales7Days) {
      const key = s.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].amount += s.total;
        dailyMap[key].bills += 1;
      }
    }
    const last7DaysSales = Object.values(dailyMap);

    // Current Month Total
    const currentMonthSalesTotal = monthSales.reduce((sum, s) => sum + s.total, 0);

    // Sales by Product Category & Top Selling Products
    const catRevenueMap: Record<string, number> = {};
    const productSoldMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const s of sales7Days) {
      for (const it of s.items) {
        if (!productSoldMap[it.productId]) {
          productSoldMap[it.productId] = { name: it.productName, quantity: 0, revenue: 0 };
        }
        productSoldMap[it.productId].quantity += it.quantity;
        productSoldMap[it.productId].revenue += it.totalPrice;
      }
    }

    // Query category names for category breakdown
    const allProducts = await prisma.product.findMany({ select: { id: true, category: { select: { name: true } } } });
    const prodCatMap = new Map(allProducts.map((p) => [p.id, p.category?.name || 'Chai & Snacks']));

    for (const s of sales7Days) {
      for (const it of s.items) {
        const catName = prodCatMap.get(it.productId) || 'Chai & Snacks';
        catRevenueMap[catName] = (catRevenueMap[catName] || 0) + it.totalPrice;
      }
    }

    const salesByCategory = Object.entries(catRevenueMap).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    const topSellingProducts = Object.values(productSoldMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({
      success: true,
      todaySummary: {
        todaySales: Math.round(todaySalesTotal * 100) / 100,
        todayPurchases: Math.round(todayPurchasesTotal * 100) / 100,
        todayExpenses: Math.round(todayExpensesTotal * 100) / 100,
        todayProfit: Math.round(todayProfit * 100) / 100,
        billsCount: todaySales.length,
        itemsSold: todayItemsSold,
        outstandingCredit: Math.round(totalOutstandingCredit * 100) / 100,
      },
      inventory: {
        totalProducts: products.length,
        totalInitialStock: Math.round(totalInitialStock * 100) / 100,
        totalSoldQuantity: Math.round(totalSoldQuantity * 100) / 100,
        totalStockQuantity: Math.round(totalStockQuantity * 100) / 100, // Remaining stock
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        inventoryValue: Math.round(totalInventoryValue * 100) / 100,
      },
      analytics: {
        todayHourlySales,
        last7DaysSales,
        currentMonthSales: Math.round(currentMonthSalesTotal * 100) / 100,
        salesByCategory,
        topSellingProducts,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
  }
});

export default router;
