import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Audit log tarixi (Section 33)
router.get('/', async (req, res) => {
  try {
    const { action, entityType, userId, search, limit } = req.query;

    const where: any = {};

    if (action) {
      where.action = String(action);
    }

    if (entityType) {
      where.entityType = String(entityType);
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (search) {
      where.description = { contains: String(search) };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
