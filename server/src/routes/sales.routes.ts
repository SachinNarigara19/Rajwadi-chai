import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// POST /api/sales (POS Checkout - Atomic Transaction)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      customerId,
      items, // array of { productId, quantity, unitPrice, discount, tax }
      discount = 0,
      tax = 0,
      paymentMethod = 'CASH', // CASH, UPI, CARD, CREDIT, SPLIT
      paymentDetails,
      paidAmount,
      ageVerified = false,
      verifierNotes,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default_settings' } });
    const allowNegativeStock = settings?.allowNegativeStock ?? false;

    // Fetch products to check stock and age restriction
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check age restriction
    let hasAgeRestrictedItem = false;
    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.productId} not found.` });
      }
      if (prod.isAgeRestricted) {
        hasAgeRestrictedItem = true;
      }
      // Check stock
      if (!allowNegativeStock && prod.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${item.quantity}.`,
        });
      }
    }

    if (hasAgeRestrictedItem && !ageVerified && settings?.enableAgeVerification) {
      return res.status(400).json({
        success: false,
        requiresAgeVerification: true,
        message: 'This sale contains age-restricted items (18+). Cashier age verification is mandatory before completing order.',
      });
    }

    // Execute atomic sale transaction
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Generate Invoice Number
      const prefix = settings?.invoicePrefix || 'JMRC';
      const lastSale = await tx.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      });

      let nextNum = settings?.startInvoiceNumber || 1001;
      if (lastSale?.invoiceNumber) {
        const parts = lastSale.invoiceNumber.split('-');
        const parsed = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }
      const invoiceNumber = `${prefix}-${nextNum}`;

      // 2. Compute item totals
      let calculatedSubtotal = 0;
      let calculatedTax = Number(tax) || 0;
      const saleItemsData: any[] = [];

      for (const item of items) {
        const prod = productMap.get(item.productId)!;
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice || prod.sellingPrice);
        const itemDiscount = Number(item.discount) || 0;
        const itemTax = Number(item.tax) || 0;
        const lineTotal = Math.max(0, qty * price - itemDiscount + itemTax);

        calculatedSubtotal += qty * price;

        saleItemsData.push({
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: price,
          purchasePrice: prod.purchasePrice, // Stored for accurate COGS
          discount: itemDiscount,
          tax: itemTax,
          totalPrice: lineTotal,
        });
      }

      const totalDiscount = Number(discount) || 0;
      const grandTotal = Math.max(0, calculatedSubtotal - totalDiscount + calculatedTax);
      const paid = paidAmount !== undefined ? Number(paidAmount) : (paymentMethod === 'CREDIT' ? 0 : grandTotal);
      const change = paid > grandTotal ? paid - grandTotal : 0;
      const paymentStatus = paymentMethod === 'CREDIT'
        ? (paid > 0 ? 'PARTIAL' : 'PENDING')
        : (paid >= grandTotal ? 'PAID' : 'PARTIAL');

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customerId || null,
          cashierId: req.user?.id || null,
          subtotal: calculatedSubtotal,
          discount: totalDiscount,
          tax: calculatedTax,
          total: grandTotal,
          paidAmount: paid,
          changeAmount: change,
          paymentMethod,
          paymentDetails: paymentDetails ? JSON.stringify(paymentDetails) : null,
          paymentStatus,
          ageVerified: hasAgeRestrictedItem ? Boolean(ageVerified) : false,
          verifierNotes: verifierNotes || null,
          notes: notes?.trim() || null,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
          cashier: { select: { id: true, name: true, username: true } },
        },
      });

      // 4. Reduce stock and create StockTransactions
      for (const item of items) {
        const prod = productMap.get(item.productId)!;
        const newBalance = prod.currentStock - item.quantity;

        await tx.product.update({
          where: { id: prod.id },
          data: { currentStock: newBalance },
        });

        await tx.stockTransaction.create({
          data: {
            productId: prod.id,
            type: 'SALE',
            quantity: -item.quantity,
            rate: item.unitPrice || prod.sellingPrice,
            reference: `INVOICE: ${invoiceNumber}`,
            balanceAfter: newBalance,
            notes: `Sold via POS Invoice ${invoiceNumber}`,
            createdById: req.user?.id || null,
          },
        });
      }

      // 5. Update Customer & Ledger if customer attached or credit sale
      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          const unpaidPortion = Math.max(0, grandTotal - paid);
          const newCustomerBalance = customer.currentBalance + unpaidPortion;

          await tx.customer.update({
            where: { id: customerId },
            data: {
              currentBalance: newCustomerBalance,
              totalPurchases: customer.totalPurchases + grandTotal,
              lastPurchase: new Date(),
            },
          });

          // If there is any credit/unpaid portion, add DEBIT to customer ledger
          if (unpaidPortion > 0) {
            await tx.customerLedger.create({
              data: {
                customerId,
                description: `Invoice ${invoiceNumber} credit balance`,
                type: 'DEBIT',
                amount: unpaidPortion,
                balanceAfter: newCustomerBalance,
                referenceType: 'SALE',
                referenceId: sale.id,
              },
            });
          }
        }
      }

      // 6. Record Payment if paid > 0
      if (paid > 0) {
        const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;
        await tx.payment.create({
          data: {
            paymentNumber,
            paymentType: 'CUSTOMER_PAYMENT',
            customerId: customerId || null,
            amount: Math.min(paid, grandTotal),
            paymentMethod,
            reference: `Sale Invoice ${invoiceNumber}`,
            notes: `POS billing collection for ${invoiceNumber}`,
            receivedById: req.user?.id || null,
          },
        });
      }

      return sale;
    });

    await createAuditLog({
      action: 'SALE_CREATE',
      entity: 'SALE',
      entityId: saleResult.id,
      details: {
        invoiceNumber: saleResult.invoiceNumber,
        total: saleResult.total,
        paymentMethod: saleResult.paymentMethod,
        itemsCount: saleResult.items.length,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${saleResult.invoiceNumber} created successfully.`,
      sale: saleResult,
    });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Invoice creation failed.' });
  }
});

// GET /api/sales
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { startDate, endDate, customerId, cashierId, paymentMethod, paymentStatus, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (customerId) where.customerId = customerId;
    if (cashierId) where.cashierId = cashierId;
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          cashier: { select: { id: true, name: true, username: true } },
          items: true,
          saleReturns: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      sales,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve sales.' });
  }
});

// GET /api/sales/:id (or invoiceNumber)
router.get('/:id', async (req, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        cashier: { select: { id: true, name: true, username: true } },
        items: {
          include: {
            product: { select: { sku: true, unit: true, isAgeRestricted: true } },
          },
        },
        saleReturns: {
          include: { items: true },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default_settings' } });

    return res.json({ success: true, sale, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoice details.' });
  }
});

// POST /api/sales/returns (Requirement 20: Sales Return)
router.post('/returns', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { saleId, returnedItems, reason } = req.body;
    // returnedItems: array of { productId, quantity, refundRate }

    if (!saleId || !returnedItems || !Array.isArray(returnedItems) || returnedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale ID and returned items are required.' });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Original invoice not found.' });
    }

    const returnResult = await prisma.$transaction(async (tx) => {
      const returnNumber = `RET-${Date.now().toString().slice(-8)}`;
      let totalRefund = 0;
      const returnItemsData: any[] = [];

      for (const retItem of returnedItems) {
        const originalItem = sale.items.find((i) => i.productId === retItem.productId);
        if (!originalItem) {
          throw new Error(`Item ${retItem.productId} was not part of original invoice ${sale.invoiceNumber}.`);
        }
        if (retItem.quantity > originalItem.quantity) {
          throw new Error(`Returned quantity (${retItem.quantity}) cannot exceed purchased quantity (${originalItem.quantity}).`);
        }

        const refundRate = Number(retItem.refundRate || originalItem.unitPrice);
        const itemRefund = retItem.quantity * refundRate;
        totalRefund += itemRefund;

        returnItemsData.push({
          productId: retItem.productId,
          quantity: retItem.quantity,
          refundRate,
          totalRefund: itemRefund,
        });

        // 1. Increase product stock
        const prod = await tx.product.findUnique({ where: { id: retItem.productId } });
        if (prod) {
          const newStock = prod.currentStock + retItem.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: newStock },
          });

          // 2. Create Stock Transaction for return
          await tx.stockTransaction.create({
            data: {
              productId: prod.id,
              type: 'SALE_RETURN',
              quantity: retItem.quantity,
              rate: refundRate,
              reference: `RETURN: ${returnNumber} (Inv: ${sale.invoiceNumber})`,
              balanceAfter: newStock,
              notes: reason || `Sales return on invoice ${sale.invoiceNumber}`,
              createdById: req.user?.id || null,
            },
          });
        }
      }

      // 3. Create SaleReturn record
      const saleReturn = await tx.saleReturn.create({
        data: {
          returnNumber,
          saleId: sale.id,
          customerId: sale.customerId,
          refundAmount: totalRefund,
          reason: reason?.trim() || null,
          processedById: req.user?.id || null,
          items: {
            create: returnItemsData,
          },
        },
      });

      // 4. Update customer balance and ledger if customer exists
      if (sale.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
        if (customer) {
          const newBal = Math.max(0, customer.currentBalance - totalRefund);
          await tx.customer.update({
            where: { id: customer.id },
            data: { currentBalance: newBal },
          });

          await tx.customerLedger.create({
            data: {
              customerId: customer.id,
              description: `Sales return refund for ${sale.invoiceNumber}`,
              type: 'CREDIT',
              amount: totalRefund,
              balanceAfter: newBal,
              referenceType: 'RETURN',
              referenceId: saleReturn.id,
            },
          });
        }
      }

      // 5. Update original sale status
      await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'RETURNED' },
      });

      return saleReturn;
    });

    await createAuditLog({
      action: 'SALE_RETURN',
      entity: 'SALE',
      entityId: sale.id,
      details: {
        returnNumber: returnResult.returnNumber,
        refundAmount: returnResult.refundAmount,
        invoiceNumber: sale.invoiceNumber,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Return ${returnResult.returnNumber} processed successfully.`,
      saleReturn: returnResult,
    });
  } catch (error: any) {
    console.error('Sales return error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to process sales return.' });
  }
});

export default router;
