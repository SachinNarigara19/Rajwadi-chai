import { Router, Response } from 'express';
import prisma from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/audit-logs (Admin only)
router.get('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { action, entity, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (action && action !== 'ALL') where.action = action;
    if (entity && entity !== 'ALL') where.entity = entity;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
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
      logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

export default router;
