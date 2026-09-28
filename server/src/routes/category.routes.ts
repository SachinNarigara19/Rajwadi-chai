import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// GET /api/categories (Public/Authenticated)
router.get('/', async (req, res: Response): Promise<any> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

// POST /api/categories (Admin / Inventory Manager)
router.post('/', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#d97706',
      },
    });

    await createAuditLog({
      action: 'CATEGORY_CREATE',
      entity: 'CATEGORY',
      entityId: category.id,
      details: { name: category.name },
      req,
    });

    return res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, description, color } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });

    await createAuditLog({
      action: 'CATEGORY_UPDATE',
      entity: 'CATEGORY',
      entityId: id,
      details: { name: updated.name },
      req,
    });

    return res.json({ success: true, message: 'Category updated successfully.', category: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: it has ${productsCount} associated products. Reassign or delete those products first.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      action: 'CATEGORY_DELETE',
      entity: 'CATEGORY',
      entityId: id,
      req,
    });

    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

export default router;
