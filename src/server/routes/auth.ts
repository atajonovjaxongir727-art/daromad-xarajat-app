import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';

const router = Router();
const prisma = new PrismaClient();

// Foydalanuvchilar ro'yxati (Ali va Vali)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarColor: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PIN orqali login qilish
router.post('/login', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi va PIN kiritilishi shart' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.pin !== pin) {
      return res.status(401).json({ success: false, message: 'PIN kod noto‘g‘ri' });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      description: `${user.name} tizimga kirdi`,
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
