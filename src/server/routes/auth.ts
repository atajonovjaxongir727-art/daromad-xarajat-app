import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';

const router = Router();
const prisma = new PrismaClient();

// Foydalanuvchilar ro'yxati
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarColor: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
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

    if (!user || user.pin !== String(pin).trim()) {
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

// Foydalanuvchi ismi, PIN kodi va profilini yangilash
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, avatarColor } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Ism bandligini tekshirish (o'zidan boshqa userda bo'lsa)
    if (name && name.trim() !== existingUser.name) {
      const trimmedName = name.trim();
      const nameConflict = await prisma.user.findFirst({
        where: {
          name: trimmedName,
          NOT: { id },
        },
      });
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: `"${trimmedName}" ismli foydalanuvchi allaqachon mavjud`,
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingUser.name,
        pin: pin && String(pin).trim() ? String(pin).trim() : existingUser.pin,
        avatarColor: avatarColor || existingUser.avatarColor,
      },
    });

    await createAuditLog({
      userId: updated.id,
      userName: updated.name,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: updated.id,
      description: `${existingUser.name} profili yangilandi (Yangi ism: ${updated.name})`,
    });

    res.json({
      success: true,
      message: 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi',
      data: {
        id: updated.id,
        name: updated.name,
        avatarColor: updated.avatarColor,
        role: updated.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
