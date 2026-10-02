import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import recurringRoutes from './routes/recurring.js';
import debtsRoutes from './routes/debts.js';
import incomeRoutes from './routes/income.js';
import expensesRoutes from './routes/expenses.js';
import accountsRoutes from './routes/accounts.js';
import categoriesRoutes from './routes/categories.js';
import reportsRoutes from './routes/reports.js';
import calendarRoutes from './routes/calendar.js';
import transactionsRoutes from './routes/transactions.js';
import auditRoutes from './routes/audit.js';
import { syncRecurringDebts } from './services/syncService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API yo'nalishlari
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Daromad va Xarajatlarni Boshqarish Tizimi',
    time: new Date().toISOString(),
  });
});

// Frontend (Vite build) statik fayllarini ulash
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback middleware (Express 5 mos)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath);
  }
  next();
});

app.listen(PORT, async () => {
  console.log(`🚀 Moliyaviy tizim to‘liq ishga tushdi: http://localhost:${PORT}`);
  try {
    const syncRes = await syncRecurringDebts();
    console.log(`🔄 Oylik qarzdorliklar sinxronizatsiya qilindi: ${syncRes.createdCount} yangi qarz, ${syncRes.overdueCount} kechikkan`);
  } catch (err) {
    console.error('Boshlang‘ich sinxronizatsiya xatosi:', err);
  }
});
