import { Router } from 'express';
import { getDetailedReport } from '../services/calcService.js';
import { getCurrentYearMonth } from '../services/syncService.js';

const router = Router();

// Oylik batafsil hisobot (Section 14 & 30)
router.get('/', async (req, res) => {
  try {
    const yearMonth = (req.query.yearMonth as string) || getCurrentYearMonth();
    const report = await getDetailedReport(yearMonth);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
