import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/suppliers
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { company: { contains: q } },
        { mobile: { contains: q } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const totalPayable = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

    return res.json({
      success: true,
      count: suppliers.length,
      totalPayable: Math.round(totalPayable * 100) / 100,
      suppliers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve suppliers.' });
  }
});

// GET /api/suppliers/:id (Profile + Purchase History + Ledger)
router.get('/:id', async (req, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        ledger: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    return res.json({ success: true, supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve supplier details.' });
  }
});

// POST /api/suppliers
router.post('/', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, company, mobile, email, address, gstNumber, openingBalance = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }

    const initBal = Number(openingBalance) || 0;

    const supplier = await prisma.$transaction(async (tx) => {
      const supp = await tx.supplier.create({
        data: {
          name: name.trim(),
          company: company?.trim() || null,
          mobile: mobile?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          gstNumber: gstNumber?.trim() || null,
          openingBalance: initBal,
          currentBalance: initBal,
        },
      });

      if (initBal > 0) {
        await tx.supplierLedger.create({
          data: {
            supplierId: supp.id,
            description: 'Opening Payable Balance',
            type: 'CREDIT',
            amount: initBal,
            balanceAfter: initBal,
            referenceType: 'ADJUSTMENT',
          },
        });
      }

      return supp;
    });

    await createAuditLog({
      action: 'SUPPLIER_CREATE',
      entity: 'SUPPLIER',
      entityId: supplier.id,
      details: { name: supplier.name, company: supplier.company },
      req,
    });

    return res.status(201).json({ success: true, message: 'Supplier created successfully.', supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create supplier.' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, company, mobile, email, address, gstNumber } = req.body;

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(company !== undefined && { company: company ? company.trim() : null }),
        ...(mobile !== undefined && { mobile: mobile ? mobile.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(gstNumber !== undefined && { gstNumber: gstNumber ? gstNumber.trim() : null }),
      },
    });

    await createAuditLog({
      action: 'SUPPLIER_UPDATE',
      entity: 'SUPPLIER',
      entityId: id,
      details: { name: updated.name },
      req,
    });

    return res.json({ success: true, message: 'Supplier updated successfully.', supplier: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update supplier.' });
  }
});

// POST /api/suppliers/:id/payment
router.post('/:id/payment', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { amount, paymentMethod = 'CASH', reference, notes } = req.body;

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const paymentResult = await prisma.$transaction(async (tx) => {
      const paymentNumber = `PAY-SUP-${Date.now().toString().slice(-8)}`;
      const newBalance = Math.max(0, supplier.currentBalance - payAmt);

      await tx.supplier.update({
        where: { id },
        data: { currentBalance: newBalance },
      });

      // DEBIT in supplier ledger reduces our liability to them
      const ledgerEntry = await tx.supplierLedger.create({
        data: {
          supplierId: id,
          description: `Payment Disbursed (${paymentMethod})${reference ? ' - Ref: ' + reference : ''}`,
          type: 'DEBIT',
          amount: payAmt,
          balanceAfter: newBalance,
          referenceType: 'PAYMENT',
          referenceId: paymentNumber,
        },
      });

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          paymentType: 'SUPPLIER_PAYMENT',
          supplierId: id,
          amount: payAmt,
          paymentMethod,
          reference: reference?.trim() || null,
          notes: notes?.trim() || `Supplier Payable Settlement`,
          receivedById: req.user?.id || null,
        },
      });

      return { payment, newBalance, ledgerEntry };
    });

    await createAuditLog({
      action: 'SUPPLIER_PAYMENT',
      entity: 'SUPPLIER',
      entityId: id,
      details: {
        paymentNumber: paymentResult.payment.paymentNumber,
        amount: payAmt,
        previousBalance: supplier.currentBalance,
        newBalance: paymentResult.newBalance,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmt} to supplier recorded successfully. New balance: ₹${paymentResult.newBalance}.`,
      payment: paymentResult.payment,
      newBalance: paymentResult.newBalance,
    });
  } catch (error: any) {
    console.error('Supplier payment error:', error);
    return res.status(500).json({ success: false, message: 'Supplier payment could not be recorded.' });
  }
});

export default router;
