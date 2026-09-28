import { Request } from 'express';
import prisma from '../db.js';

interface AuditLogParams {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any> | string | null;
  req?: Request;
}

export async function createAuditLog({
  userId,
  userName,
  action,
  entity,
  entityId,
  details,
  req,
}: AuditLogParams) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress : undefined;
    const finalDetails = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        userId: userId || (req as any)?.user?.id || null,
        userName: userName || (req as any)?.user?.name || (req as any)?.user?.username || 'System',
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: finalDetails,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
