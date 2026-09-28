import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// POST /api/purchases (Atomic Transaction)
router.post('/', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      supplierId,
      supplierBillNo,
      items, // array of { productId, quantity, purchaseRate, tax }
      discount = 0,
      tax = 0,
      paidAmount,
      paymentMethod = 'CASH',
      paymentStatus = 'PAID',
      notes,
    } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and purchase items are required.' });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const purchaseResult = await prisma.$transaction(async (tx) => {
      // 1. Generate Purchase Number
      const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;

      let subtotal = 0;
      let totalTax = Number(tax) || 0;
      const purchaseItemsData: any[] = [];

      for (const item of items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        const qty = Number(item.quantity);
        const rate = Number(item.purchaseRate || prod.purchasePrice);
        const itemTax = Number(item.tax) || 0;
        const lineTotal = qty * rate + itemTax;

        subtotal += qty * rate;

        purchaseItemsData.push({
          productId: prod.id,
          quantity: qty,
          purchaseRate: rate,
          tax: itemTax,
          totalPrice: lineTotal,
        });
      }

      const totalDiscount = Number(discount) || 0;
      const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);
      const paid = paidAmount !== undefined ? Number(paidAmount) : (paymentStatus === 'PAID' ? grandTotal : 0);
      const unpaidPortion = Math.max(0, grandTotal - paid);

      const finalPaymentStatus = paid >= grandTotal ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING');

      // 2. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          supplierBillNo: supplierBillNo?.trim() || null,
          subtotal,
          tax: totalTax,
          discount: totalDiscount,
          totalAmount: grandTotal,
          paidAmount: paid,
          paymentStatus: finalPaymentStatus,
          paymentMethod,
          notes: notes?.trim() || null,
          receivedById: req.user?.id || null,
          items: {
            create: purchaseItemsData,
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // 3. Update product current stock and latest purchase price, and record StockTransaction
      for (const item of items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const newBalance = prod.currentStock + item.quantity;
          const rate = Number(item.purchaseRate || prod.purchasePrice);

          await tx.product.update({
            where: { id: prod.id },
            data: {
              currentStock: newBalance,
              purchasePrice: rate, // update latest cost price
            },
          });

          await tx.stockTransaction.create({
            data: {
              productId: prod.id,
              type: 'PURCHASE',
              quantity: item.quantity,
              rate,
              reference: `PURCHASE: ${purchaseNumber}`,
              balanceAfter: newBalance,
              notes: `Stock arrival from supplier ${supplier.name}`,
              createdById: req.user?.id || null,
            },
          });
        }
      }

      // 4. Update Supplier balance & SupplierLedger
      if (unpaidPortion > 0) {
        const newSupplierBalance = supplier.currentBalance + unpaidPortion;
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentBalance: newSupplierBalance },
        });

        await tx.supplierLedger.create({
          data: {
            supplierId,
            description: `Purchase ${purchaseNumber} credit payable`,
            type: 'CREDIT',
            amount: unpaidPortion,
            balanceAfter: newSupplierBalance,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
          },
        });
      }

      // 5. If any payment was made now to supplier, create Payment record
      if (paid > 0) {
        const paymentNumber = `PAY-SUP-${Date.now().toString().slice(-8)}`;
        await tx.payment.create({
          data: {
            paymentNumber,
            paymentType: 'SUPPLIER_PAYMENT',
            supplierId,
            amount: paid,
            paymentMethod,
            reference: `Purchase Invoice ${purchaseNumber}`,
            notes: `Purchase procurement payment`,
            receivedById: req.user?.id || null,
          },
        });
      }

      return purchase;
    });

    await createAuditLog({
      action: 'PURCHASE_CREATE',
      entity: 'PURCHASE',
      entityId: purchaseResult.id,
      details: {
        purchaseNumber: purchaseResult.purchaseNumber,
        supplier: supplier.name,
        totalAmount: purchaseResult.totalAmount,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Purchase ${purchaseResult.purchaseNumber} recorded and stock updated successfully.`,
      purchase: purchaseResult,
    });
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create purchase order.' });
  }
});

// GET /api/purchases
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { supplierId, startDate, endDate, paymentStatus } = req.query;

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        receivedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, unit: true } },
          },
        },
        purchaseReturns: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: purchases.length, purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve purchases.' });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findFirst({
      where: {
        OR: [{ id }, { purchaseNumber: id }],
      },
      include: {
        supplier: true,
        receivedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, unit: true } },
          },
        },
        purchaseReturns: {
          include: { items: true },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found.' });
    }

    return res.json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve purchase details.' });
  }
});

// POST /api/purchases/returns (Requirement 21: Purchase Return)
router.post('/returns', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { purchaseId, returnedItems, reason } = req.body;
    // returnedItems: array of { productId, quantity, purchaseRate }

    if (!purchaseId || !returnedItems || !Array.isArray(returnedItems) || returnedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase ID and returned items are required.' });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true, supplier: true },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    const returnResult = await prisma.$transaction(async (tx) => {
      const returnNumber = `PO-RET-${Date.now().toString().slice(-8)}`;
      let totalRefund = 0;
      const returnItemsData: any[] = [];

      for (const retItem of returnedItems) {
        const originalItem = purchase.items.find((i) => i.productId === retItem.productId);
        if (!originalItem) {
          throw new Error(`Product ${retItem.productId} was not part of purchase ${purchase.purchaseNumber}.`);
        }

        const rate = Number(retItem.purchaseRate || originalItem.purchaseRate);
        const itemRefund = retItem.quantity * rate;
        totalRefund += itemRefund;

        returnItemsData.push({
          productId: retItem.productId,
          quantity: retItem.quantity,
          purchaseRate: rate,
          totalRefund: itemRefund,
        });

        // 1. Decrease product stock
        const prod = await tx.product.findUnique({ where: { id: retItem.productId } });
        if (prod) {
          const newStock = prod.currentStock - retItem.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: newStock },
          });

          // 2. Create Stock Transaction for purchase return
          await tx.stockTransaction.create({
            data: {
              productId: prod.id,
              type: 'PURCHASE_RETURN',
              quantity: -retItem.quantity,
              rate,
              reference: `PURCHASE_RETURN: ${returnNumber}`,
              balanceAfter: newStock,
              notes: reason || `Purchase return for ${purchase.purchaseNumber}`,
              createdById: req.user?.id || null,
            },
          });
        }
      }

      // 3. Create PurchaseReturn record
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseId: purchase.id,
          supplierId: purchase.supplierId,
          refundAmount: totalRefund,
          reason: reason?.trim() || null,
          items: {
            create: returnItemsData,
          },
        },
      });

      // 4. Update supplier balance and ledger
      const supplier = await tx.supplier.findUnique({ where: { id: purchase.supplierId } });
      if (supplier) {
        const newBal = Math.max(0, supplier.currentBalance - totalRefund);
        await tx.supplier.update({
          where: { id: supplier.id },
          data: { currentBalance: newBal },
        });

        await tx.supplierLedger.create({
          data: {
            supplierId: supplier.id,
            description: `Purchase return debit for ${purchase.purchaseNumber}`,
            type: 'DEBIT',
            amount: totalRefund,
            balanceAfter: newBal,
            referenceType: 'RETURN',
            referenceId: purchaseReturn.id,
          },
        });
      }

      return purchaseReturn;
    });

    await createAuditLog({
      action: 'PURCHASE_RETURN',
      entity: 'PURCHASE',
      entityId: purchase.id,
      details: {
        returnNumber: returnResult.returnNumber,
        refundAmount: returnResult.refundAmount,
        purchaseNumber: purchase.purchaseNumber,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Purchase return ${returnResult.returnNumber} processed successfully.`,
      purchaseReturn: returnResult,
    });
  } catch (error: any) {
    console.error('Purchase return error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to process purchase return.' });
  }
});

export default router;
