import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Agar bazada allaqachon foydalanuvchilar bo'lsa, mavjud ma'lumotlarni o'chirib yubormaslik uchun to'xtatamiz
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("✅ Baza allaqachon mavjud ma'lumotlarga ega. Mavjud ma'lumotlarni saqlab qolish uchun seed o'tkazib yuborildi.");
    return;
  }

  console.log('🌱 Baza tozalanmoqda va demo ma\'lumotlar yuklanmoqda...');

  // 1. Foydalanuvchilar (Ali va Vali)
  const ali = await prisma.user.upsert({
    where: { name: 'Ali' },
    update: {},
    create: {
      name: 'Ali',
      pin: '1234',
      avatarColor: '#2563eb', // Ko'k
      role: 'user',
    },
  });

  const vali = await prisma.user.upsert({
    where: { name: 'Vali' },
    update: {},
    create: {
      name: 'Vali',
      pin: '5678',
      avatarColor: '#10b981', // Yashil
      role: 'user',
    },
  });

  console.log('✅ Foydalanuvchilar yaratildi: Ali (PIN: 1234), Vali (PIN: 5678)');

  // 2. Hisoblar / Hamyonlar (Section 20)
  const cashAccount = await prisma.account.upsert({
    where: { name: 'Naqd pul' },
    update: {},
    create: {
      name: 'Naqd pul',
      type: 'cash',
      balance: 2000000,
      color: '#10b981',
      icon: 'banknote',
      isDefault: true,
    },
  });

  const cardAccount = await prisma.account.upsert({
    where: { name: 'Bank karta (Uzcard/Humo)' },
    update: {},
    create: {
      name: 'Bank karta (Uzcard/Humo)',
      type: 'card',
      balance: 5000000,
      color: '#3b82f6',
      icon: 'credit-card',
      isDefault: false,
    },
  });

  const bankAccount = await prisma.account.upsert({
    where: { name: 'Bank hisob raqami' },
    update: {},
    create: {
      name: 'Bank hisob raqami',
      type: 'bank',
      balance: 10000000,
      color: '#8b5cf6',
      icon: 'building-2',
      isDefault: false,
    },
  });

  console.log('✅ Hisoblar yaratildi: Naqd: 2 000 000, Karta: 5 000 000, Bank: 10 000 000 (Jami: 17 000 000)');

  // 3. Standart Xarajat Kategoriyalari (Section 11)
  const categoriesData = [
    { name: 'Oziq-ovqat', icon: 'utensils', color: '#f59e0b' },
    { name: 'Transport', icon: 'car', color: '#3b82f6' },
    { name: 'Uy-ro‘zg‘or', icon: 'home', color: '#10b981' },
    { name: 'Kommunal', icon: 'zap', color: '#ef4444' },
    { name: 'Ijara', icon: 'key', color: '#8b5cf6' },
    { name: 'Internet', icon: 'wifi', color: '#06b6d4' },
    { name: 'Telefon', icon: 'phone', color: '#6366f1' },
    { name: 'Ofis', icon: 'briefcase', color: '#ec4899' },
    { name: 'Reklama', icon: 'megaphone', color: '#f97316' },
    { name: 'Ish haqi', icon: 'users', color: '#14b8a6' },
    { name: 'Soliq', icon: 'file-text', color: '#dc2626' },
    { name: 'Bank', icon: 'landmark', color: '#475569' },
    { name: 'Ta\'mirlash', icon: 'wrench', color: '#d97706' },
    { name: 'Ta\'lim', icon: 'graduation-cap', color: '#2563eb' },
    { name: 'Tibbiyot', icon: 'activity', color: '#e11d48' },
    { name: 'Boshqa', icon: 'more-horizontal', color: '#64748b' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isCustom: false },
    });
    categoriesMap[cat.name] = created.id;
  }
  console.log('✅ 16 ta standart xarajat kategoriyalari yaratildi');

  // 4. Doimiy Daromad Manbalari (Section 34)
  const recAbc = await prisma.recurringIncome.create({
    data: {
      title: 'ABC MChJ',
      amount: 1000000,
      billingDay: 10,
      assignedUserId: ali.id,
      isActive: true,
      startDate: '2026-08-01',
      category: 'Mijoz to\'lovi',
      note: 'Oylik IT va dasturiy ta\'minot xizmati',
    },
  });

  const recXyz = await prisma.recurringIncome.create({
    data: {
      title: 'XYZ MChJ',
      amount: 2500000,
      billingDay: 25,
      assignedUserId: vali.id,
      isActive: true,
      startDate: '2026-08-01',
      category: 'Mijoz to\'lovi',
      note: 'Marketing va brending xizmati',
    },
  });

  const recDef = await prisma.recurringIncome.create({
    data: {
      title: 'DEF MChJ',
      amount: 750000,
      billingDay: 5,
      assignedUserId: ali.id,
      isActive: true,
      startDate: '2026-08-01',
      category: 'Mijoz to\'lovi',
      note: 'Server monitoring va qo\'llab-quvvatlash',
    },
  });

  console.log('✅ Doimiy daromadlar yaratildi: ABC MChJ (1M), XYZ MChJ (2.5M), DEF MChJ (750k)');

  // 5. Avtomatik Oylik Qarzdorlik Instansiyalari (Avgust, Sentyabr, Oktyabr)
  // 2026-08: To'liq to'langan
  const instAbcAug = await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recAbc.id,
      yearMonth: '2026-08',
      dueDate: '2026-08-10',
      expectedAmount: 1000000,
      paidAmount: 1000000,
      status: 'PAID',
      assignedUserId: ali.id,
      note: 'Avgust oyi to\'lovi to\'liq yopildi',
    },
  });

  await prisma.payment.create({
    data: {
      recurringInstanceId: instAbcAug.id,
      amount: 1000000,
      paymentDate: '2026-08-14',
      accountId: cashAccount.id,
      receivedById: ali.id,
      note: 'Naqd ko\'rinishida qabul qilindi',
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-08-14',
      amount: 1000000,
      userId: ali.id,
      type: 'recurring_payment',
      source: 'ABC MChJ',
      category: 'Mijoz to\'lovi',
      accountId: cashAccount.id,
      paymentMethod: 'cash',
      recurringInstanceId: instAbcAug.id,
      note: 'Avgust oyi doimiy daromad to\'lovi',
    },
  });

  const instXyzAug = await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recXyz.id,
      yearMonth: '2026-08',
      dueDate: '2026-08-25',
      expectedAmount: 2500000,
      paidAmount: 2500000,
      status: 'PAID',
      assignedUserId: vali.id,
    },
  });

  await prisma.payment.create({
    data: {
      recurringInstanceId: instXyzAug.id,
      amount: 2500000,
      paymentDate: '2026-08-26',
      accountId: cardAccount.id,
      receivedById: vali.id,
      note: 'Kartaga tushdi',
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-08-26',
      amount: 2500000,
      userId: vali.id,
      type: 'recurring_payment',
      source: 'XYZ MChJ',
      category: 'Mijoz to\'lovi',
      accountId: cardAccount.id,
      paymentMethod: 'card',
      recurringInstanceId: instXyzAug.id,
      note: 'Avgust oyi to\'lovi',
    },
  });

  const instDefAug = await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recDef.id,
      yearMonth: '2026-08',
      dueDate: '2026-08-05',
      expectedAmount: 750000,
      paidAmount: 750000,
      status: 'PAID',
      assignedUserId: ali.id,
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-08-05',
      amount: 750000,
      userId: ali.id,
      type: 'recurring_payment',
      source: 'DEF MChJ',
      category: 'Mijoz to\'lovi',
      accountId: bankAccount.id,
      paymentMethod: 'bank',
      recurringInstanceId: instDefAug.id,
    },
  });

  // 2026-09: ABC MChJ qisman to'langan (400 000 to'langan, 600 000 qarz), XYZ MChJ kechikkan, DEF MChJ to'langan
  const instAbcSep = await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recAbc.id,
      yearMonth: '2026-09',
      dueDate: '2026-09-10',
      expectedAmount: 1000000,
      paidAmount: 400000,
      status: 'PARTIALLY_PAID',
      assignedUserId: ali.id,
      note: '400 000 so\'m to\'landi, qoldiq 600 000 so\'m',
    },
  });

  await prisma.payment.create({
    data: {
      recurringInstanceId: instAbcSep.id,
      amount: 400000,
      paymentDate: '2026-09-12',
      accountId: cashAccount.id,
      receivedById: ali.id,
      note: 'Qisman to\'lov (avans)',
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-09-12',
      amount: 400000,
      userId: ali.id,
      type: 'recurring_payment',
      source: 'ABC MChJ',
      category: 'Mijoz to\'lovi',
      accountId: cashAccount.id,
      paymentMethod: 'cash',
      recurringInstanceId: instAbcSep.id,
      note: 'Sentyabr oyi uchun qisman to\'lov',
    },
  });

  // XYZ MChJ: To'lanmagan va muddati o'tgan (Kechikkan qarz: 2 500 000 so'm)
  await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recXyz.id,
      yearMonth: '2026-09',
      dueDate: '2026-09-25',
      expectedAmount: 2500000,
      paidAmount: 0,
      status: 'OVERDUE',
      assignedUserId: vali.id,
      note: 'To\'lov muddati o\'tgan (25.09.2026)',
    },
  });

  // DEF MChJ: Sentyabr to'liq to'langan
  const instDefSep = await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recDef.id,
      yearMonth: '2026-09',
      dueDate: '2026-09-05',
      expectedAmount: 750000,
      paidAmount: 750000,
      status: 'PAID',
      assignedUserId: ali.id,
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-09-06',
      amount: 750000,
      userId: ali.id,
      type: 'recurring_payment',
      source: 'DEF MChJ',
      category: 'Mijoz to\'lovi',
      accountId: bankAccount.id,
      paymentMethod: 'bank',
      recurringInstanceId: instDefSep.id,
    },
  });

  // 2026-10: Yangi oylik kutilayotgan qarzdorliklar (PENDING)
  await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recAbc.id,
      yearMonth: '2026-10',
      dueDate: '2026-10-10',
      expectedAmount: 1000000,
      paidAmount: 0,
      status: 'PENDING',
      assignedUserId: ali.id,
    },
  });

  await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recXyz.id,
      yearMonth: '2026-10',
      dueDate: '2026-10-25',
      expectedAmount: 2500000,
      paidAmount: 0,
      status: 'PENDING',
      assignedUserId: vali.id,
    },
  });

  await prisma.recurringIncomeInstance.create({
    data: {
      recurringIncomeId: recDef.id,
      yearMonth: '2026-10',
      dueDate: '2026-10-05',
      expectedAmount: 750000,
      paidAmount: 0,
      status: 'PENDING',
      assignedUserId: ali.id,
    },
  });

  console.log('✅ Oylik avtomatik qarzdorliklar yaratildi');

  // 6. Bir martalik daromadlar (Section 9)
  await prisma.income.create({
    data: {
      date: '2026-08-25',
      amount: 500000,
      userId: ali.id,
      type: 'one_time',
      source: 'Mijozdan',
      category: 'Bir martalik daromad',
      accountId: cashAccount.id,
      paymentMethod: 'cash',
      note: 'Konsultatsiya xizmati uchun naqd pul',
    },
  });

  await prisma.income.create({
    data: {
      date: '2026-09-18',
      amount: 800000,
      userId: vali.id,
      type: 'one_time',
      source: 'Akmal aka',
      category: 'Freelance xizmat',
      accountId: cardAccount.id,
      paymentMethod: 'card',
      note: 'Mobil ilova dizayni uchun',
    },
  });

  console.log('✅ Bir martalik daromadlar kiritildi');

  // 7. Haqiqiy Xarajatlar (Section 10)
  await prisma.expense.create({
    data: {
      date: '2026-08-25',
      amount: 300000,
      userId: ali.id,
      categoryId: categoriesMap['Ofis'] || categoriesMap['Boshqa'],
      accountId: cashAccount.id,
      paymentMethod: 'cash',
      note: 'Ofis kanselyariya buyumlari',
    },
  });

  await prisma.expense.create({
    data: {
      date: '2026-08-25',
      amount: 150000,
      userId: vali.id,
      categoryId: categoriesMap['Transport'] || categoriesMap['Boshqa'],
      accountId: cardAccount.id,
      paymentMethod: 'card',
      note: 'Yo\'l xarajatlari va yoqilg\'i',
    },
  });

  await prisma.expense.create({
    data: {
      date: '2026-09-10',
      amount: 450000,
      userId: ali.id,
      categoryId: categoriesMap['Internet'] || categoriesMap['Boshqa'],
      accountId: cardAccount.id,
      paymentMethod: 'card',
      note: 'Ofis uchun 3 oylik optik internet',
    },
  });

  await prisma.expense.create({
    data: {
      date: '2026-09-15',
      amount: 280000,
      userId: vali.id,
      categoryId: categoriesMap['Oziq-ovqat'] || categoriesMap['Boshqa'],
      accountId: cashAccount.id,
      paymentMethod: 'cash',
      note: 'Tushlik va choyxona',
    },
  });

  await prisma.expense.create({
    data: {
      date: '2026-09-28',
      amount: 700000,
      userId: ali.id,
      categoryId: categoriesMap['Kommunal'] || categoriesMap['Boshqa'],
      accountId: bankAccount.id,
      paymentMethod: 'bank',
      note: 'Elektr energiyasi va suv to\'lovi',
    },
  });

  console.log('✅ Xarajatlar kiritildi');

  // 8. Tranzaksiyalar
  await prisma.transaction.createMany({
    data: [
      {
        date: '2026-08-14 10:30:00',
        type: 'INCOME',
        amount: 1000000,
        accountId: cashAccount.id,
        userId: ali.id,
        description: 'ABC MChJ to\'lovi (Avgust)',
      },
      {
        date: '2026-08-25 14:15:00',
        type: 'INCOME',
        amount: 500000,
        accountId: cashAccount.id,
        userId: ali.id,
        description: 'Bir martalik konsultatsiya daromadi',
      },
      {
        date: '2026-08-25 15:40:00',
        type: 'EXPENSE',
        amount: 300000,
        accountId: cashAccount.id,
        userId: ali.id,
        description: 'Ofis xarajati',
      },
      {
        date: '2026-08-25 16:00:00',
        type: 'EXPENSE',
        amount: 150000,
        accountId: cardAccount.id,
        userId: vali.id,
        description: 'Transport xarajati',
      },
      {
        date: '2026-08-26 11:20:00',
        type: 'INCOME',
        amount: 2500000,
        accountId: cardAccount.id,
        userId: vali.id,
        description: 'XYZ MChJ to\'lovi (Avgust)',
      },
      {
        date: '2026-09-12 09:45:00',
        type: 'INCOME',
        amount: 400000,
        accountId: cashAccount.id,
        userId: ali.id,
        description: 'ABC MChJ qisman to\'lovi (Sentyabr)',
      },
    ],
  });

  // 9. Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        userId: ali.id,
        userName: 'Ali',
        action: 'CREATE',
        entityType: 'RECURRING',
        description: 'Ali \'ABC MChJ\' doimiy daromad manbasini qo\'shdi (1 000 000 so\'m)',
      },
      {
        userId: vali.id,
        userName: 'Vali',
        action: 'CREATE',
        entityType: 'RECURRING',
        description: 'Vali \'XYZ MChJ\' doimiy daromad manbasini qo\'shdi (2 500 000 so\'m)',
      },
      {
        userId: ali.id,
        userName: 'Ali',
        action: 'RECEIVE_PAYMENT',
        entityType: 'DEBT',
        description: 'Ali ABC MChJ dan 1 000 000 so\'mlik to\'lovni qabul qildi',
      },
      {
        userId: ali.id,
        userName: 'Ali',
        action: 'CREATE',
        entityType: 'EXPENSE',
        description: 'Ali 300 000 so\'mlik ofis xarajatini kiritdi',
      },
      {
        userId: vali.id,
        userName: 'Vali',
        action: 'CREATE',
        entityType: 'EXPENSE',
        description: 'Vali 150 000 so\'mlik transport xarajatini kiritdi',
      },
    ],
  });

  console.log('🎉 Barcha demo ma\'lumotlar muvaffaqiyatli saqlandi!');
}

main()
  .catch((e) => {
    console.error('❌ Xatolik yuz berdi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
