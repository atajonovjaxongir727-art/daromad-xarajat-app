import { Router } from 'express';
import { syncRecurringDebts } from '../services/syncService.js';
import { getDashboardSummary } from '../services/calcService.js';

const router = Router();

// Dashboard asosiy ma'lumotlari
router.get('/', async (req, res) => {
  try {
    const selectedMonth = req.query.month as string | undefined;

    // Har safar ochilganda yoki so'rov kelganda avtomatik oylik qarzdorliklarni tekshirish
    const syncResult = await syncRecurringDebts();

    const summary = await getDashboardSummary(selectedMonth);

    res.json({
      success: true,
      data: {
        ...summary,
        notifications: syncResult.notifications,
        syncStats: {
          createdCount: syncResult.createdCount,
          updatedCount: syncResult.updatedCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
