import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { authenticate, generateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account is inactive.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as any,
      email: user.email,
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { role: user.role },
      req,
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// GET /api/auth/users (ADMIN only)
router.get('/users', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
});

// POST /api/auth/users (ADMIN only)
router.post('/users', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { username, name, email, password, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Username, name and password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        email: email?.trim() || null,
        password: hashedPassword,
        role: role || 'CASHIER',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      action: 'USER_CREATE',
      entity: 'USER',
      entityId: newUser.id,
      details: { username: newUser.username, role: newUser.role },
      req,
    });

    return res.status(201).json({ success: true, message: 'Staff user created successfully.', user: newUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
});

// PUT /api/auth/users/:id (ADMIN only)
router.put('/users/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, email, role, isActive, password } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (role !== undefined) dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await createAuditLog({
      action: 'USER_UPDATE',
      entity: 'USER',
      entityId: id,
      details: dataToUpdate,
      req,
    });

    return res.json({ success: true, message: 'User updated successfully.', user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

export default router;
