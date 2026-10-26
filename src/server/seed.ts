import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("ℹ️ Baza allaqachon mavjud ma'lumotlarga ega. Seed o'tkazib yuborildi.");
    return;
  }

  console.log("🚀 Baza boshlang'ich tizim ma'lumotlari bilan to'ldirilmoqda...");

  // 1. Foydalanuvchilar (JAXONGIR va BAXRAM)
  await prisma.user.upsert({
    where: { name: "JAXONGIR" },
    update: {},
    create: {
      name: "JAXONGIR",
      pin: "1234",
      avatarColor: "#2563eb",
      role: "user",
    },
  });

  await prisma.user.upsert({
    where: { name: "BAXRAM" },
    update: {},
    create: {
      name: "BAXRAM",
      pin: "5678",
      avatarColor: "#10b981",
      role: "user",
    },
  });

  // 2. Hisoblar / Hamyonlar (0 balans bilan)
  await prisma.account.upsert({
    where: { name: "Naqd pul" },
    update: {},
    create: {
      name: "Naqd pul",
      type: "cash",
      balance: 0,
      color: "#10b981",
      icon: "banknote",
      isDefault: true,
    },
  });

  await prisma.account.upsert({
    where: { name: "Bank karta (Uzcard/Humo)" },
    update: {},
    create: {
      name: "Bank karta (Uzcard/Humo)",
      type: "card",
      balance: 0,
      color: "#3b82f6",
      icon: "credit-card",
      isDefault: false,
    },
  });

  await prisma.account.upsert({
    where: { name: "Bank hisob raqami" },
    update: {},
    create: {
      name: "Bank hisob raqami",
      type: "bank",
      balance: 0,
      color: "#8b5cf6",
      icon: "building-2",
      isDefault: false,
    },
  });

  // 3. Standart Xarajat Kategoriyalari (barchasi qo'shtirnoq ichida xavfsiz)
  const categoriesData = [
    { name: "Oziq-ovqat", icon: "utensils", color: "#f59e0b" },
    { name: "Transport", icon: "car", color: "#3b82f6" },
    { name: "Uy-ro'zg'or", icon: "home", color: "#10b981" },
    { name: "Kommunal", icon: "zap", color: "#ef4444" },
    { name: "Ijara", icon: "key", color: "#8b5cf6" },
    { name: "Internet", icon: "wifi", color: "#06b6d4" },
    { name: "Telefon", icon: "phone", color: "#6366f1" },
    { name: "Ofis", icon: "briefcase", color: "#ec4899" },
    { name: "Reklama", icon: "megaphone", color: "#f97316" },
    { name: "Ish haqi", icon: "users", color: "#14b8a6" },
    { name: "Soliq", icon: "file-text", color: "#dc2626" },
    { name: "Bank", icon: "landmark", color: "#475569" },
    { name: "Ta'mirlash", icon: "wrench", color: "#d97706" },
    { name: "Ta'lim", icon: "graduation-cap", color: "#2563eb" },
    { name: "Tibbiyot", icon: "activity", color: "#e11d48" },
    { name: "Boshqa", icon: "more-horizontal", color: "#64748b" },
  ];

  for (const cat of categoriesData) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isCustom: false },
    });
  }

  console.log("✅ Baza toza holatda tayyorlandi (Demo ma'lumotlarsiz).");
}

main()
  .catch((e) => {
    console.error("❌ Xatolik:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
