import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Kategoriyalar ro'yxati (Section 11)
router.get('/', async (req, res) => {
  try {
    const list = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi kategoriya qo'shish
router.post('/', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Kategoriya nomi kiritilishi shart' });
    }

    const existing = await prisma.expenseCategory.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu nomdagi kategoriya allaqachon mavjud' });
    }

    const created = await prisma.expenseCategory.create({
      data: {
        name,
        icon: icon || 'tag',
        color: color || '#6b7280',
        isCustom: true,
      },
    });

    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
