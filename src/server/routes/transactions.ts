import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Barcha operatsiyalar vaqt bo'yicha (Section 21)
router.get('/', async (req, res) => {
  try {
    const { type, accountId, userId, search, limit } = req.query;

    const where: any = {};

    if (type) {
      where.type = String(type);
    }

    if (accountId) {
      where.accountId = String(accountId);
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (search) {
      where.description = { contains: String(search) };
    }

    const items = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: { date: 'desc' },
      take: limit ? Number(limit) : 100,
    });

    // Foydalanuvchi ma'lumotlarini qo'shish
    const users = await prisma.user.findMany({ select: { id: true, name: true, avatarColor: true } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = items.map((item) => ({
      ...item,
      user: userMap.get(item.userId) || { name: 'Noma\'lum', avatarColor: '#6b7280' },
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
