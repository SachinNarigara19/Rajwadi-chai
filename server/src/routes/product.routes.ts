import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// Configure multer for product image storage
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/products/upload-image
router.post('/upload-image', authenticate, upload.single('image'), (req: AuthRequest, res: Response): any => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, imageUrl, filename: req.file.filename });
});

// POST /api/products/upload-camera-photo (Camera capture photo snapshot upload)
router.post('/upload-camera-photo', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'No image data provided from camera.' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid camera photo format.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const filename = `product-camera-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    const imageUrl = `/uploads/${filename}`;
    return res.json({ success: true, imageUrl, filename });
  } catch (error) {
    console.error('Error saving camera photo:', error);
    return res.status(500).json({ success: false, message: 'Failed to process camera photo.' });
  }
});

// GET /api/products
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { categoryId, search, lowStock, outOfStock, isAgeRestricted } = req.query;

    const where: any = {};

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
        { brand: { contains: q } },
      ];
    }

    if (isAgeRestricted === 'true') {
      where.isAgeRestricted = true;
    }

    if (outOfStock === 'true') {
      where.currentStock = { lte: 0 };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    // If lowStock requested, filter in memory or where condition
    const filteredProducts = lowStock === 'true'
      ? products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockLevel)
      : products;

    return res.json({ success: true, count: filteredProducts.length, products: filteredProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Compute units sold and units purchased
    const totalSoldAgg = await prisma.saleItem.aggregate({
      where: { productId: id },
      _sum: { quantity: true },
    });

    const totalPurchasedAgg = await prisma.purchaseItem.aggregate({
      where: { productId: id },
      _sum: { quantity: true },
    });

    const totalStockValue = product.currentStock * product.purchasePrice;

    return res.json({
      success: true,
      product: {
        ...product,
        totalStockValue,
        unitsSold: totalSoldAgg._sum.quantity || 0,
        unitsPurchased: totalPurchasedAgg._sum.quantity || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve product.' });
  }
});

// GET /api/products/:id/stock-history (Requirement 6: Dedicated Individual Product Stock Movement History)
router.get('/:id/stock-history', async (req, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, currentStock: true, unit: true, purchasePrice: true, sellingPrice: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const transactions = await prisma.stockTransaction.findMany({
      where: { productId: id },
      include: {
        createdBy: {
          select: { name: true, username: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json({
      success: true,
      product,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve stock movement history.' });
  }
});

// GET /api/products/:id/analytics (Individual Product High Sell, Low Sell & Trends Analytics Graph)
router.get('/:id/analytics', async (req, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { period = '30d', startDate, endDate } = req.query;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Determine target date window
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      switch (period) {
        case '7d':
          start.setDate(start.getDate() - 6);
          break;
        case '14d':
          start.setDate(start.getDate() - 13);
          break;
        case '30d':
          start.setDate(start.getDate() - 29);
          break;
        case '90d':
          start.setDate(start.getDate() - 89);
          break;
        case '1y':
          start.setDate(start.getDate() - 364);
          break;
        case 'all':
          start = new Date(product.createdAt || '2025-01-01');
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start.setDate(start.getDate() - 29);
      }
    }

    // Query sales containing this item within date window
    const saleItems = await prisma.saleItem.findMany({
      where: {
        productId: id,
        sale: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        sale: {
          select: {
            id: true,
            invoiceNumber: true,
            createdAt: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        sale: {
          createdAt: 'asc',
        },
      },
    });

    // Group sales data by date string (YYYY-MM-DD)
    const salesByDate: Record<
      string,
      { quantity: number; revenue: number; cost: number; profit: number; count: number; invoices: string[] }
    > = {};

    const hourlyDistribution: Record<number, { hour: number; hourLabel: string; quantity: number; revenue: number }> = {};
    for (let h = 6; h <= 23; h++) {
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      hourlyDistribution[h] = { hour: h, hourLabel: `${h12}:00 ${ampm}`, quantity: 0, revenue: 0 };
    }

    const dayOfWeekStats: Record<
      number,
      { dayName: string; shortDay: string; totalQty: number; totalRevenue: number; occurrences: number }
    > = {
      0: { dayName: 'Sunday', shortDay: 'Sun', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      1: { dayName: 'Monday', shortDay: 'Mon', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      2: { dayName: 'Tuesday', shortDay: 'Tue', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      3: { dayName: 'Wednesday', shortDay: 'Wed', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      4: { dayName: 'Thursday', shortDay: 'Thu', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      5: { dayName: 'Friday', shortDay: 'Fri', totalQty: 0, totalRevenue: 0, occurrences: 0 },
      6: { dayName: 'Saturday', shortDay: 'Sat', totalQty: 0, totalRevenue: 0, occurrences: 0 },
    };

    let totalUnitsSold = 0;
    let totalRevenue = 0;
    let totalCogs = 0;

    for (const item of saleItems) {
      const saleDate = new Date(item.sale.createdAt);
      const dateKey = saleDate.toISOString().split('T')[0];
      const hour = saleDate.getHours();
      const buyPrice = item.purchasePrice > 0 ? item.purchasePrice : product.purchasePrice;
      const itemCost = item.quantity * buyPrice;
      const itemProfit = item.totalPrice - itemCost;

      totalUnitsSold += item.quantity;
      totalRevenue += item.totalPrice;
      totalCogs += itemCost;

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { quantity: 0, revenue: 0, cost: 0, profit: 0, count: 0, invoices: [] };
      }
      salesByDate[dateKey].quantity += item.quantity;
      salesByDate[dateKey].revenue += item.totalPrice;
      salesByDate[dateKey].cost += itemCost;
      salesByDate[dateKey].profit += itemProfit;
      salesByDate[dateKey].count += 1;
      salesByDate[dateKey].invoices.push(item.sale.invoiceNumber);

      if (hourlyDistribution[hour]) {
        hourlyDistribution[hour].quantity += item.quantity;
        hourlyDistribution[hour].revenue += item.totalPrice;
      }
    }

    // Build complete daily timeline with 0 values for days without sales
    const timeline: Array<{
      date: string;
      formattedDate: string;
      dayOfWeek: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
      salesCount: number;
      tag: 'HIGH_SELL' | 'AVERAGE_SELL' | 'LOW_SELL' | 'ZERO_SELL';
    }> = [];

    const currDate = new Date(start);
    while (currDate <= end) {
      const dateStr = currDate.toISOString().split('T')[0];
      const dow = currDate.getDay();
      dayOfWeekStats[dow].occurrences += 1;

      const dayData = salesByDate[dateStr] || {
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
        invoices: [],
      };

      dayOfWeekStats[dow].totalQty += dayData.quantity;
      dayOfWeekStats[dow].totalRevenue += dayData.revenue;

      const formattedDate = currDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      timeline.push({
        date: dateStr,
        formattedDate,
        dayOfWeek: dayOfWeekStats[dow].shortDay,
        quantity: Math.round(dayData.quantity * 100) / 100,
        revenue: Math.round(dayData.revenue * 100) / 100,
        cost: Math.round(dayData.cost * 100) / 100,
        profit: Math.round(dayData.profit * 100) / 100,
        salesCount: dayData.count,
        tag: 'ZERO_SELL',
      });

      currDate.setDate(currDate.getDate() + 1);
    }

    const totalDaysCount = timeline.length || 1;
    const averageDailyUnits = totalUnitsSold / totalDaysCount;
    const averageDailyRevenue = totalRevenue / totalDaysCount;
    const grossProfit = totalRevenue - totalCogs;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // High Sell threshold: 1.35x average or minimum 1
    // Low Sell threshold: 0.65x average
    const highSellThreshold = Math.max(1, Math.round(averageDailyUnits * 1.35 * 10) / 10);
    const lowSellThreshold = Math.max(0.5, Math.round(averageDailyUnits * 0.65 * 10) / 10);

    let peakDay = { date: '', formattedDate: '', quantity: 0, revenue: 0, dayOfWeek: '' };
    let lowestActiveDay = { date: '', formattedDate: '', quantity: Infinity, revenue: Infinity, dayOfWeek: '' };
    let zeroSalesDaysCount = 0;
    let activeSalesDaysCount = 0;
    let highSellDaysCount = 0;
    let lowSellDaysCount = 0;

    for (const t of timeline) {
      if (t.quantity > peakDay.quantity) {
        peakDay = {
          date: t.date,
          formattedDate: t.formattedDate,
          quantity: t.quantity,
          revenue: t.revenue,
          dayOfWeek: t.dayOfWeek,
        };
      }

      if (t.quantity > 0) {
        activeSalesDaysCount++;
        if (t.quantity < lowestActiveDay.quantity) {
          lowestActiveDay = {
            date: t.date,
            formattedDate: t.formattedDate,
            quantity: t.quantity,
            revenue: t.revenue,
            dayOfWeek: t.dayOfWeek,
          };
        }
      } else {
        zeroSalesDaysCount++;
      }

      if (t.quantity >= highSellThreshold && t.quantity > 0) {
        t.tag = 'HIGH_SELL';
        highSellDaysCount++;
      } else if (t.quantity > 0 && t.quantity <= lowSellThreshold) {
        t.tag = 'LOW_SELL';
        lowSellDaysCount++;
      } else if (t.quantity > 0) {
        t.tag = 'AVERAGE_SELL';
      } else {
        t.tag = 'ZERO_SELL';
      }
    }

    if (lowestActiveDay.quantity === Infinity) {
      lowestActiveDay = { date: '-', formattedDate: '-', quantity: 0, revenue: 0, dayOfWeek: '-' };
    }

    // Peak selling hour
    let peakHourObj = { hour: 0, label: 'None', quantity: 0, revenue: 0 };
    for (const h of Object.values(hourlyDistribution)) {
      if (h.quantity > peakHourObj.quantity) {
        peakHourObj = {
          hour: h.hour,
          label: h.hourLabel,
          quantity: h.quantity,
          revenue: h.revenue,
        };
      }
    }

    // Velocity & Performance Classification
    let velocityRating: 'HOT_SELLER' | 'HIGH_VOLUME' | 'STEADY_SELLER' | 'SLOW_MOVER' | 'DEAD_STOCK' = 'STEADY_SELLER';
    let velocityLabel = 'Steady Seller';
    let velocityDescription = 'Consistent sales velocity aligned with shop average.';
    let velocityColor = 'amber';

    if (totalUnitsSold === 0) {
      velocityRating = 'DEAD_STOCK';
      velocityLabel = '⚠️ Stagnant Stock / Zero Sales';
      velocityDescription = 'No units sold in this time range. Consider promotional discounts or bundle offers.';
      velocityColor = 'rose';
    } else if (averageDailyUnits >= 15) {
      velocityRating = 'HOT_SELLER';
      velocityLabel = '🔥 High Sell Bestseller';
      velocityDescription = 'Top tier volume product. Keep safety stock high to avoid stockouts!';
      velocityColor = 'emerald';
    } else if (averageDailyUnits >= 6) {
      velocityRating = 'HIGH_VOLUME';
      velocityLabel = '⚡ High Demand Mover';
      velocityDescription = 'Strong daily movement with frequent repeat customer orders.';
      velocityColor = 'sky';
    } else if (averageDailyUnits >= 2) {
      velocityRating = 'STEADY_SELLER';
      velocityLabel = '✨ Steady Performer';
      velocityDescription = 'Healthy consistent demand. Steady inventory turnover.';
      velocityColor = 'amber';
    } else {
      velocityRating = 'SLOW_MOVER';
      velocityLabel = '🐢 Low Sell / Slow Mover';
      velocityDescription = 'Low sales frequency. Monitor stock levels closely to avoid tied-up capital.';
      velocityColor = 'orange';
    }

    // Stock Runway (Estimated days of stock left)
    const runwayDays = averageDailyUnits > 0 ? Math.round(product.currentStock / averageDailyUnits) : 999;
    let runwayStatus = 'HEALTHY';
    if (product.currentStock <= 0) runwayStatus = 'OUT_OF_STOCK';
    else if (runwayDays <= 3) runwayStatus = 'CRITICAL';
    else if (runwayDays <= 7) runwayStatus = 'LOW';
    else if (runwayDays > 60) runwayStatus = 'OVERSTOCKED';

    // Day of week pattern array
    const dayOfWeekPattern = Object.values(dayOfWeekStats).map((d) => ({
      day: d.dayName,
      shortDay: d.shortDay,
      averageQty: d.occurrences > 0 ? Math.round((d.totalQty / d.occurrences) * 10) / 10 : 0,
      totalQty: Math.round(d.totalQty * 100) / 100,
      totalRevenue: Math.round(d.totalRevenue * 100) / 100,
      isPeak: false,
      isSlow: false,
    }));

    // Find peak and slow day of week
    let maxDowQty = -1;
    let minDowQty = Infinity;
    dayOfWeekPattern.forEach((d) => {
      if (d.averageQty > maxDowQty) maxDowQty = d.averageQty;
      if (d.averageQty < minDowQty) minDowQty = d.averageQty;
    });
    dayOfWeekPattern.forEach((d) => {
      if (d.averageQty === maxDowQty && maxDowQty > 0) d.isPeak = true;
      if (d.averageQty === minDowQty) d.isSlow = true;
    });

    return res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        unit: product.unit,
        imageUrl: product.imageUrl,
        category: product.category?.name || 'General',
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        currentStock: product.currentStock,
        minStockLevel: product.minStockLevel,
      },
      period,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        daysCount: totalDaysCount,
      },
      metrics: {
        totalUnitsSold: Math.round(totalUnitsSold * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCogs: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 10) / 10,
        averageDailyUnits: Math.round(averageDailyUnits * 10) / 10,
        averageDailyRevenue: Math.round(averageDailyRevenue * 10) / 10,
        highSellThreshold,
        lowSellThreshold,
        highSellDaysCount,
        lowSellDaysCount,
        activeSalesDaysCount,
        zeroSalesDaysCount,
        runwayDays,
        runwayStatus,
        velocity: {
          rating: velocityRating,
          label: velocityLabel,
          description: velocityDescription,
          color: velocityColor,
        },
      },
      milestones: {
        peakDay,
        lowestActiveDay,
        peakHour: peakHourObj,
      },
      timeline,
      dayOfWeekPattern,
      hourlyDistribution: Object.values(hourlyDistribution),
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product analytics.' });
  }
});

// POST /api/products
router.post('/', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      name,
      categoryId,
      brand,
      sku,
      barcode,
      unit,
      purchasePrice,
      sellingPrice,
      mrp,
      openingStock,
      minStockLevel,
      maxStockLevel,
      taxRate,
      supplierId,
      imageUrl,
      isAgeRestricted,
      complianceNotes,
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ success: false, message: 'Product name and category are required.' });
    }

    const finalSku = sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const finalBarcode = barcode?.trim() || `890${Date.now().toString().slice(-9)}`;
    const initStock = Number(openingStock) || 0;
    const buyPrice = Number(purchasePrice) || 0;
    const sellPrice = Number(sellingPrice) || 0;

    // Use Prisma transaction to atomically create Product + StockTransaction
    const createdProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name: name.trim(),
          categoryId,
          brand: brand?.trim() || 'Jay Mataji Rajwadi',
          sku: finalSku,
          barcode: finalBarcode,
          unit: unit || 'Cup',
          purchasePrice: buyPrice,
          sellingPrice: sellPrice,
          mrp: Number(mrp) || sellPrice,
          openingStock: initStock,
          currentStock: initStock,
          minStockLevel: Number(minStockLevel) || 5,
          maxStockLevel: maxStockLevel ? Number(maxStockLevel) : null,
          taxRate: Number(taxRate) || 0,
          supplierId: supplierId || null,
          imageUrl: imageUrl || null,
          isAgeRestricted: Boolean(isAgeRestricted),
          complianceNotes: complianceNotes?.trim() || null,
          status: 'ACTIVE',
        },
      });

      // Stock transaction for initial stock
      if (initStock > 0) {
        await tx.stockTransaction.create({
          data: {
            productId: prod.id,
            type: 'OPENING_STOCK',
            quantity: initStock,
            rate: buyPrice,
            reference: 'OPENING_STOCK_ENTRY',
            balanceAfter: initStock,
            notes: 'Initial inventory stock on creation',
            createdById: req.user?.id || null,
          },
        });
      }

      return prod;
    });

    await createAuditLog({
      action: 'PRODUCT_CREATE',
      entity: 'PRODUCT',
      entityId: createdProduct.id,
      details: { name: createdProduct.name, sku: createdProduct.sku, currentStock: createdProduct.currentStock },
      req,
    });

    return res.status(201).json({ success: true, message: 'Product created successfully.', product: createdProduct });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A product with this SKU or Barcode already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const {
      name,
      categoryId,
      brand,
      sku,
      barcode,
      unit,
      purchasePrice,
      sellingPrice,
      mrp,
      minStockLevel,
      maxStockLevel,
      taxRate,
      supplierId,
      imageUrl,
      isAgeRestricted,
      complianceNotes,
      status,
    } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(categoryId && { categoryId }),
        ...(brand !== undefined && { brand }),
        ...(sku && { sku: sku.trim() }),
        ...(barcode !== undefined && { barcode: barcode?.trim() || null }),
        ...(unit && { unit }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
        ...(mrp !== undefined && { mrp: Number(mrp) }),
        ...(minStockLevel !== undefined && { minStockLevel: Number(minStockLevel) }),
        ...(maxStockLevel !== undefined && { maxStockLevel: maxStockLevel ? Number(maxStockLevel) : null }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(isAgeRestricted !== undefined && { isAgeRestricted: Boolean(isAgeRestricted) }),
        ...(complianceNotes !== undefined && { complianceNotes: complianceNotes || null }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      action: 'PRODUCT_UPDATE',
      entity: 'PRODUCT',
      entityId: id,
      details: { name: updated.name },
      req,
    });

    return res.json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A product with this SKU or Barcode already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    // Check if product is in sales
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      // Mark inactive instead of deleting to preserve sales integrity
      await prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return res.json({
        success: true,
        message: 'Product has previous sales records. Status changed to INACTIVE instead of deleting to preserve billing history.',
      });
    }

    await prisma.stockTransaction.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    await createAuditLog({
      action: 'PRODUCT_DELETE',
      entity: 'PRODUCT',
      entityId: id,
      req,
    });

    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

export default router;
