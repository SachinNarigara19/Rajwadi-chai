import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rajwadi_royal_secret_key_super_secure_2026_token';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER';
  email?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, role: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or inactive user account.' });
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(allowedRoles: ('ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}
