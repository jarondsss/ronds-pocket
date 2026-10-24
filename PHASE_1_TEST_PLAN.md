# Phase 1: Testing Plan

**Dibuat**: 24 Oktober 2026, 17:08 UTC  
**Status**: Ready untuk testing manual

---

## ✅ Test 1: Cron Timezone

**Yang diubah**: `src/convex/crons.ts`  
**Perubahan**: Bill reminders sekarang jalan jam **17:00 UTC** (midnight WIB), bukan 01:00 UTC

### Manual Test Steps:

1. **Cek file crons.ts**
   ```bash
   cat src/convex/crons.ts
   ```
   Pastikan ada: `{ hourUTC: 17, minuteUTC: 0 }`

2. **Deploy ke Convex** (kalau udah punya project):
   ```bash
   npx convex deploy
   ```

3. **Verifikasi di Convex Dashboard**:
   - Login ke https://dashboard.convex.dev
   - Buka project lu
   - Masuk ke **Functions** → **Cron Jobs**
   - Cek "process bill reminders" scheduled jam berapa
   - Harusnya muncul: **17:00 UTC daily**

4. **Test Notification Timing**:
   - Bikin bill reminder dengan due date besok
   - Set `remind_days_before = 1`
   - Tunggu sampai jam **00:00 WIB** (17:00 UTC)
   - Cek apakah notifikasi muncul

**Expected Result**: User dapet notif di **midnight WIB**, bukan jam 8 pagi.

---

## ✅ Test 2: Pagination

**Yang diubah**: `src/convex/transactions.ts`  
**Perubahan**: 
- Tambah parameter `limit` di `transactions.list`
- Default max 500 transaksi per query
- Query pake `.order("desc").take()` buat efisiensi

### Manual Test Steps:

1. **Cek kode pagination**
   ```bash
   grep -A 10 "loadTransactions" src/convex/transactions.ts
   ```
   Pastikan ada: `.order("desc").take(maxResults)`

2. **Deploy & Test di Frontend**:
   ```bash
   npx convex deploy
   npm run dev
   ```

3. **Test dengan data banyak**:
   - Buka halaman Ledger/Transactions
   - Kalau lu punya **< 500 transaksi**: semua tetap muncul (no change)
   - Kalau lu punya **> 500 transaksi**: cuma 500 terbaru yang muncul

4. **Test dengan limit custom**:
   - Di frontend, coba panggil:
     ```typescript
     const transactions = useQuery(api.transactions.list, {
       bookId: currentBookId,
       limit: 50, // custom limit
     });
     ```
   - Harusnya cuma muncul 50 transaksi terbaru

5. **Test performa**:
   - Buka Network tab di DevTools
   - Lihat response time query `transactions.list`
   - Bandingkan sebelum & sesudah (harusnya lebih cepat kalau data banyak)

**Expected Result**: 
- Query lebih cepat kalau data > 500 rows
- Frontend tetap jalan normal kalau data < 500 rows
- Bisa custom limit dari frontend

---

## ✅ Test 3: Budget Check Optimization

**Yang diubah**: `src/convex/transactions.ts`  
**Perubahan**: 
- Bikin helper function `getMonthlySpending()`
- Budget overspend check lebih clean & maintainable

### Manual Test Steps:

1. **Cek helper function**
   ```bash
   grep -A 15 "getMonthlySpending" src/convex/transactions.ts
   ```
   Pastikan function exist

2. **Deploy & Test Budget Notification**:
   ```bash
   npx convex deploy
   npm run dev
   ```

3. **Test overspend notification**:
   - Buka halaman Budget
   - Set budget kategori "Makan" = Rp 1.000.000
   - Bikin transaksi expense "Makan" total Rp 1.100.000 di bulan ini
   - Cek apakah muncul **notification overspend**

4. **Test 80% warning** (dari budgets.ts):
   - Set budget "Transport" = Rp 500.000
   - Bikin transaksi expense "Transport" = Rp 450.000 (90%)
   - Cek di halaman Budget, harusnya ada **warning near limit**

5. **Test performa**:
   - Bikin 1000+ transaksi di bulan yang sama
   - Coba create transaksi baru dengan kategori yang ada budgetnya
   - Response time harusnya **< 2 detik** (kalau lebih lama, ada masalah)

**Expected Result**:
- Overspend notification tetap jalan
- Budget check gak bikin create transaction jadi lemot
- Logika sama, cuma lebih maintainable

---

## 🔍 Regression Test (Pastiin Gak Ada yang Rusak)

### Test Basic Flow:

1. **Login/Auth** masih jalan?
2. **Create transaction** masih bisa?
3. **Create wallet** masih bisa?
4. **Create budget** masih bisa?
5. **Invite member** masih jalan?
6. **Notifications** masih muncul?
7. **Activity log** masih tercatat?

Kalau **semua masih jalan normal**, Phase 1 **SUCCESS** ✅

---

## 📊 Performance Benchmark (Optional)

Kalau lu punya data banyak, coba benchmark sebelum vs sesudah:

### Before Phase 1:
```
transactions.list (10,000 rows): ~5-10 detik
create transaction dengan budget check: ~3-5 detik
```

### After Phase 1:
```
transactions.list dengan limit 500: ~1-2 detik
create transaction dengan budget check: ~1-2 detik
```

---

## ⚠️ Known Issues

1. **Node v26 belum support Convex**
   - Perlu downgrade ke Node v20/22/24 kalau mau deploy local
   - Atau deploy langsung ke Convex Cloud

2. **Pagination belum ada UI "Load More"**
   - Sekarang cuma hard limit 500
   - Nanti Phase 3 bisa tambahin infinite scroll atau pagination UI

3. **Budget check masih load semua transaksi bulan itu**
   - Udah lebih clean, tapi belum pake aggregate table
   - Nanti Phase 2/3 bisa optimize lebih lanjut kalau perlu

---

## 🚀 Next Steps

Kalau semua test **PASS**, lanjut ke **Phase 2**:
1. Wallet balance consistency (Convex transactions)
2. Recurring TX backfill (handle missed schedules)

Kalau ada yang **FAIL**, report ke gua dengan:
- Screenshot error
- Console log
- Step yang bikin gagal

---

**Claw dulu Juan, test pelan-pelan. Jangan buru-buru.** 🤙
