import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/customers
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const totalOutstanding = customers.reduce((sum, c) => sum + c.currentBalance, 0);

    return res.json({
      success: true,
      count: customers.length,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      customers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
});

// GET /api/customers/:id (Profile + Purchase History + Ledger)
router.get('/:id', async (req, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
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

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve customer details.' });
  }
});

// POST /api/customers
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, mobile, email, address, openingBalance = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    if (mobile && mobile.trim()) {
      const existing = await prisma.customer.findFirst({ where: { mobile: mobile.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A customer with this mobile number already exists.' });
      }
    }

    const initBal = Number(openingBalance) || 0;

    const newCustomer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          name: name.trim(),
          mobile: mobile?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          openingBalance: initBal,
          currentBalance: initBal,
        },
      });

      if (initBal > 0) {
        await tx.customerLedger.create({
          data: {
            customerId: cust.id,
            description: 'Opening Khata Balance',
            type: 'DEBIT',
            amount: initBal,
            balanceAfter: initBal,
            referenceType: 'ADJUSTMENT',
          },
        });
      }

      return cust;
    });

    await createAuditLog({
      action: 'CUSTOMER_CREATE',
      entity: 'CUSTOMER',
      entityId: newCustomer.id,
      details: { name: newCustomer.name, mobile: newCustomer.mobile, currentBalance: newCustomer.currentBalance },
      req,
    });

    return res.status(201).json({ success: true, message: 'Customer created successfully.', customer: newCustomer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create customer.' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, mobile, email, address } = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(mobile !== undefined && { mobile: mobile ? mobile.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
      },
    });

    await createAuditLog({
      action: 'CUSTOMER_UPDATE',
      entity: 'CUSTOMER',
      entityId: id,
      details: { name: updated.name },
      req,
    });

    return res.json({ success: true, message: 'Customer updated successfully.', customer: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update customer.' });
  }
});

// POST /api/customers/:id/payment (Requirement 16: Customer Khata Payment)
router.post('/:id/payment', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { amount, paymentMethod = 'CASH', reference, notes } = req.body;

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const paymentResult = await prisma.$transaction(async (tx) => {
      const paymentNumber = `RCPT-${Date.now().toString().slice(-8)}`;
      const newBalance = Math.max(0, customer.currentBalance - payAmt);

      // 1. Update customer balance
      await tx.customer.update({
        where: { id },
        data: { currentBalance: newBalance },
      });

      // 2. Create customer ledger entry (CREDIT reduces customer's debt)
      const ledgerEntry = await tx.customerLedger.create({
        data: {
          customerId: id,
          description: `Khata Payment Received (${paymentMethod})${reference ? ' - Ref: ' + reference : ''}`,
          type: 'CREDIT',
          amount: payAmt,
          balanceAfter: newBalance,
          referenceType: 'PAYMENT',
          referenceId: paymentNumber,
        },
      });

      // 3. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          paymentType: 'CUSTOMER_PAYMENT',
          customerId: id,
          amount: payAmt,
          paymentMethod,
          reference: reference?.trim() || null,
          notes: notes?.trim() || `Customer Khata Settlement`,
          receivedById: req.user?.id || null,
        },
      });

      return { payment, newBalance, ledgerEntry };
    });

    await createAuditLog({
      action: 'CUSTOMER_PAYMENT',
      entity: 'CUSTOMER',
      entityId: id,
      details: {
        paymentNumber: paymentResult.payment.paymentNumber,
        amount: payAmt,
        previousBalance: customer.currentBalance,
        newBalance: paymentResult.newBalance,
        paymentMethod,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmt} recorded successfully. New balance: ₹${paymentResult.newBalance}.`,
      payment: paymentResult.payment,
      newBalance: paymentResult.newBalance,
    });
  } catch (error: any) {
    console.error('Customer payment error:', error);
    return res.status(500).json({ success: false, message: 'Customer payment could not be recorded.' });
  }
});

export default router;
