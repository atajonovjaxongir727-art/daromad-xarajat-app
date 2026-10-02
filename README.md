# Daromad va Xarajatlarni Boshqarish Tizimi (Moliya Pro v2.0)

Ushbu ilova **2 foydalanuvchi** (Ali va Vali) uchun mo‘ljallangan zamonaviy, qulay va professional shaxsiy/kichik oilaviy moliyaviy hisob-kitob tizimidir.

Dastur real **SQLite** ma‘lumotlar bazasi, **Prisma ORM**, **Express 5** serveri va **React + Vite + Tailwind CSS** frontend texnologiyalari asosida production-ready holatda to‘liq ishlab chiqilgan.

---

## 🚀 Ishga tushirish

Ilova hozirda to‘liq ishlab turibdi:

* **Web manzil:** `http://localhost:3000`

### Buyruqlar:
* **Serverni ishga tushirish:** `npm start`
* **Development rejimi:** `npm run dev`
* **Loyihani build qilish:** `npm run build`
* **Demo ma‘lumotlarni bazaga yuklash:** `npm run db:seed`

---

## 👥 Foydalanuvchilar va Kirish

Ilovada 2 ta foydalanuvchi mavjud:

1. **Ali** — PIN kod: `1234`
2. **Vali** — PIN kod: `5678`

Yuqori o‘ng burchakdagi foydalanuvchi chipini bosish orqali ikkinchi foydalanuvchining PIN kodini kiritib tezkor almashtirish mumkin.
* Har bir foydalanuvchi o‘zi kiritgan daromad va xarajatlarni to‘liq tahrirlashi/o‘chirishi mumkin.
* Ikkala foydalanuvchi ham umumiy Dashboard, qarzdorliklar, hamyonlar va hisobotlarni birgalikda ko‘ra oladi.

---

## 💡 Asosiy Biznes Mantiq va Jarayon (Workflow)

```
DOIMIY DAROMAD MANBAI
       ↓
HAR OY AVTOMATIK QARZDORLIK YARATILADI (PENDING / OVERDUE)
       ↓
TO‘LOV KUTILADI (DIQQAT: Daromad yoki Balansga qo‘shilmaydi!)
       ↓
MIJOZ PUL TO‘LAGANDA: "TO‘LOVNI QABUL QILISH" BOSILADI
       ↓
QARZ YOPILADI (Yoki qisman to‘lanadi)
       ↓
HAQIQIY DAROMADGA AYLANADI
       ↓
TANLANGAN HAMYON / KASSA BALANSI OSHADI
```

### Muhim Formula:
$$\text{Sof Balans} = \text{Haqiqiy olingan daromad} - \text{Haqiqiy xarajat}$$

Kutilayotgan qarzdorlik balansga kiritilmaydi. Faqatgina to‘lov qabul qilingandan keyingina u daromad hisoblanadi.

---

## 📌 Asosiy Bo‘limlar

1. **Dashboard:**
   * Jami daromad, Jami xarajat, Sof qoldiq (Daromad - Xarajat)
   * Olinishi kerak (Kutilayotgan qarzlar) va Kechikkan qarzdorlik (⚠️)
   * Foydalanuvchilar bo‘yicha taqsimot: Ali, Vali va UMUMIY natija
   * Hisoblar / Hamyonlar qoldig‘i
   * Kutilayotgan yaqin to‘lovlar va tezkor "To‘lovni qabul qilish" tugmasi
   * Oylik filtr (Oktyabr, Sentyabr, Avgust, Barcha davrlar)

2. **Qarzdorlik (Debts):**
   * Faqat olinishi kerak bo‘lgan pullar ro‘yxati
   * Kechikkan kunlar hisobi (masalan: "15 kun kechikkan")
   * Holat ranglari: To‘langan (Yashil), Qisman to‘langan (To‘q sariq), Qarzdor (Moviy), Kechikkan (Qizil)
   * **To‘lovni qabul qilish:** To‘liq yoki qisman to‘lov (Partial payment), bayramona animatsiya (confetti), hamyonni tanlash

3. **Doimiy daromadlar (Recurring Incomes):**
   * ABC MChJ (1 000 000 so‘m/oy, har oy 10-sana)
   * XYZ MChJ (2 500 000 so‘m/oy, har oy 25-sana)
   * DEF MChJ (750 000 so‘m/oy, har oy 5-sana)
   * **Tahrirlashda tarix saqlanadi:** Yangi summa kiritilganda eski oylar o‘zgarmaydi, faqat yangi oylarga qo‘llanadi
   * **Faolsizlantirish:** O‘chirish o‘rniga to‘xtatish, kelgusi oylarga avtomatik qarz yaratilmaydi, eski tarix to‘liq saqlanadi

4. **Daromadlar (Incomes):**
   * Bir martalik va doimiy daromadlar jurnali
   * Sana, foydalanuvchi, hisob, tur va qidiruv bo‘yicha filtrlar

5. **Xarajatlar (Expenses):**
   * 16 ta standart toifa (Oziq-ovqat, Transport, Ijara, Internet, Ofis, Kommunal va b.)
   * Yangi maxsus kategoriya qo‘shish imkoniyati
   * Hamyondan avtomatik pul ayirish

6. **Hisoblar / Hamyonlar (Wallets):**
   * Naqd pul, Bank karta (Uzcard/Humo), Bank hisob raqami
   * Yangi hisob ochish va **Pul o‘tkazish (Transfer)**

7. **Oylik Hisobotlar (Reports):**
   * Oy tanlash (Avgust, Sentyabr, Oktyabr va h.k.)
   * 6 oylik dinamika grafigi (Recharts: Daromad vs Xarajat vs Sof foyda)
   * Kategoriyalar bo‘yicha xarajatlar taqsimoti (Donut chart)
   * Ali va Vali taqqoslash grafigi

8. **Moliyaviy Kalendar (Calendar):**
   * Har bir kunda: 🟢 Daromad, 🔴 Xarajat, 🟡 Kutilayotgan to‘lov, ⚠️ Kechikkan qarz
   * Kunni bosganda to‘liq tafsilotlar modali

9. **Tarix (Transactions History):**
   * Vaqt bo‘yicha tartiblangan barcha moliyaviy oqimlar

10. **Audit Jurnali (Audit Log):**
    * Kim, qachon, qanday amal bajardi, nima o‘zgardi

11. **Eksport:**
    * **Excel (.xlsx):** Multi-sheet (Xulosa, Daromadlar, Xarajatlar, Qarzlar, Hisoblar)
    * **CSV:** Tranzaksiyalar
    * **PDF:** Toza chop etish / PDF ko‘rinishi

---

## 🛠 Texnologik Stek

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Canvas-Confetti, xlsx
* **Backend:** Node.js, Express 5, TypeScript, tsx
* **Ma‘lumotlar bazasi:** SQLite, Prisma ORM
