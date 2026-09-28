import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/expenses
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const { categoryId, startDate, endDate, paymentMethod } = req.query;
    const where: any = {};

    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      success: true,
      count: expenses.length,
      totalExpense: Math.round(totalExpense * 100) / 100,
      expenses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
});

// GET /api/expenses/categories
router.get('/categories', async (_req, res: Response): Promise<any> => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      include: {
        _count: { select: { expenses: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expense categories.' });
  }
});

// POST /api/expenses/categories
router.post('/categories', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await prisma.expenseCategory.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Expense category already exists.' });
    }

    const cat = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Category created.', category: cat });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create expense category.' });
  }
});

// POST /api/expenses
router.post('/', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, categoryId, amount, paymentMethod = 'CASH', date, notes, receiptUrl } = req.body;

    if (!title || !categoryId || !amount) {
      return res.status(400).json({ success: false, message: 'Title, category and amount are required.' });
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        categoryId,
        amount: Number(amount),
        paymentMethod,
        date: date ? new Date(date) : new Date(),
        notes: notes?.trim() || null,
        receiptUrl: receiptUrl?.trim() || null,
        createdById: req.user?.id || null,
      },
      include: {
        category: true,
      },
    });

    await createAuditLog({
      action: 'EXPENSE_CREATE',
      entity: 'EXPENSE',
      entityId: expense.id,
      details: { title: expense.title, amount: expense.amount, category: expense.category.name },
      req,
    });

    return res.status(201).json({ success: true, message: 'Expense recorded successfully.', expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.expense.delete({ where: { id } });

    await createAuditLog({
      action: 'EXPENSE_DELETE',
      entity: 'EXPENSE',
      entityId: id,
      req,
    });

    return res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
});

export default router;
