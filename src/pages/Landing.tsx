import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah } from "@/lib/format";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChartPie,
  Check,
  CloudLightning,
  HandCoins,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const FEATURES = [
  {
    icon: HandCoins,
    title: "Catat dalam 5 detik",
    body: "Nominal, kategori, tanggal. Tanpa kolom ribet, tanpa buku yang harus dicari.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Users,
    title: "Berdua, satu buku kas",
    body: "Undang pasanganmu pakai kode unik. Kalian berdua bisa mencatat di buku yang sama.",
    tone: "bg-income/15 text-income",
  },
  {
    icon: ChartPie,
    title: "Rekap yang jelas",
    body: "Grafik kategori dan tren enam bulan supaya kelihatan uang pergi ke mana.",
    tone: "bg-expense/15 text-expense",
  },
  {
    icon: ShieldCheck,
    title: "Aman & privat",
    body: "Setiap akses buku dicek ulang. Orang lain tidak bisa mengintip catatanmu.",
    tone: "bg-accent/50 text-accent-foreground",
  },
];

const MOCK_ROWS = [
  { emoji: "🍜", label: "Makan & Minum", note: "kopi pagi", amount: -35000 },
  { emoji: "💼", label: "Gaji", note: "gajian bulan ini", amount: 5000000 },
  { emoji: "🛵", label: "Transportasi", note: "ojek ke kantor", amount: -18000 },
  { emoji: "🛍️", label: "Belanja", note: "belanja mingguan", amount: -215000 },
];

const STEPS = [
  {
    title: "Daftar & masuk",
    body: "Sekali daftar, buku kas pertamamu langsung dibuat otomatis.",
  },
  {
    title: "Undang partner",
    body: "Buat kode undangan, kirim ke pasanganmu, mereka langsung bisa ikut mencatat.",
  },
  {
    title: "Catat & pantau",
    body: "Semua transaksi langsung muncul di HP kalian berdua secara real-time.",
  },
];

function MockPreview() {
  const income = MOCK_ROWS.filter((row) => row.amount > 0).reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const expense = MOCK_ROWS.filter((row) => row.amount < 0).reduce(
    (sum, row) => sum + Math.abs(row.amount),
    0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      className="clay relative w-full max-w-sm p-4"
    >
      <div className="clay-primary p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">
          Saldo bulan ini
        </p>
        <p className="mt-1.5 font-display text-2xl font-extrabold">
          {formatRupiah(income - expense)}
        </p>
        <div className="mt-3 flex gap-4 text-xs font-semibold text-white/85">
          <span>Masuk {formatRupiah(income)}</span>
          <span>Keluar {formatRupiah(expense)}</span>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {MOCK_ROWS.map((row, index) => (
          <motion.li
            key={row.label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.12, duration: 0.4 }}
            className="clay-sm flex items-center gap-3 p-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-base">
              {row.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">
                {row.label}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {row.note}
              </span>
            </span>
            <span
              className="shrink-0 text-xs font-extrabold"
              style={{
                color:
                  row.amount > 0
                    ? "var(--income)"
                    : "var(--expense)",
              }}
            >
              {row.amount > 0 ? "+" : "−"}
              {formatRupiah(Math.abs(row.amount))}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/70 px-3 py-2.5">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <p className="text-[11px] font-semibold text-foreground/80">
          "kopi 35rb tadi pagi" → tercatat otomatis
        </p>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";
  const primaryLabel = isAuthenticated ? "Buka Buku Kas" : "Mulai catat gratis";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-32 -top-32 size-96 rounded-full bg-primary/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-28 top-40 size-80 rounded-full bg-accent/30 blur-3xl"
      />

      <div className="relative">
        <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
          <div className="clay mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Brand />
            <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
              <a href="#fitur" className="transition-colors hover:text-primary">
                Fitur
              </a>
              <a href="#cara" className="transition-colors hover:text-primary">
                Cara kerja
              </a>
              <a href="#privasi" className="transition-colors hover:text-primary">
                Privasi
              </a>
            </nav>
            <Button
              type="button"
              onClick={() => navigate(primaryHref)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isAuthenticated ? (
                "Dashboard"
              ) : (
                "Masuk"
              )}
              {!isLoading && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          {/* Hero */}
          <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span className="clay-sm inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                <CloudLightning className="size-3.5" />
                Buku kas digital untuk berdua
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Catat uang berdua,
                <span className="text-primary"> tanpa ribet.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Buku Kas adalah catatan keuangan sederhana untuk kamu dan
                pasangan. Tulis pengeluaran dan pemasukan, lihat saldo serta
                rekapnya langsung — semua dalam satu buku yang sama.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => navigate(primaryHref)}
                  disabled={isLoading}
                >
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#fitur">Lihat fitur</a>
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                {["Gratis untuk dipakai berdua", "Tanpa kartu kredit", "Mobile friendly"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-income" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </motion.div>

            <div className="flex justify-center lg:justify-end">
              <MockPreview />
            </div>
          </section>

          {/* Stats strip */}
          <section className="clay grid grid-cols-3 gap-2 p-4 text-center sm:p-6">
            {[
              { value: "1 buku", label: "untuk kamu & partner" },
              { value: "3 detik", label: "catat satu transaksi" },
              { value: "100%", label: "data tersimpan aman" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4 }}
              >
                <p className="font-display text-xl font-extrabold text-primary sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground sm:text-xs">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </section>

          {/* Features */}
          <section id="fitur" className="scroll-mt-28 py-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl"
            >
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Semua yang dibutuhkan, tidak lebih
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dibuat supaya kamu benar-benar mencatat tiap hari, bukan
                menyerah di tengah jalan.
              </p>
            </motion.div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    whileHover={{ y: -5 }}
                    className="clay p-5 sm:p-6"
                  >
                    <span
                      className={`grid size-11 place-items-center rounded-2xl ${feature.tone}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-extrabold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </section>

          {/* How it works */}
          <section id="cara" className="scroll-mt-28 py-6">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Mulai dalam tiga langkah
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="clay p-5 sm:p-6"
                >
                  <span className="clay-primary grid size-10 place-items-center rounded-2xl font-display text-lg font-extrabold">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Privacy / partner callout */}
          <section id="privasi" className="scroll-mt-28 py-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="clay grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center"
            >
              <div>
                <span className="clay-sm inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-income">
                  <ShieldCheck className="size-3.5" />
                  Privasi dijaga
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Cuma kamu dan partner yang bisa lihat
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Setiap permintaan ke buku kas diperiksa ulang: kalau kamu bukan
                  anggota buku itu, datanya tidak bisa dibaca maupun diubah.
                  Hanya pemilik buku yang bisa mengatur kode undangan dan
                  menghapus partner.
                </p>
              </div>
              <ul className="flex flex-col gap-3">
                {[
                  "Pemilik & partner sama-sama bisa mencatat transaksi",
                  "Hanya pemilik yang mengelola akses partner",
                  "Ringkasan saldo dan grafik per kategori",
                  "Filter per bulan untuk melihat riwayat",
                ].map((item) => (
                  <li
                    key={item}
                    className="clay-sm flex items-center gap-3 px-4 py-3 text-sm font-semibold"
                  >
                    <Check className="size-4 shrink-0 text-income" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>

          {/* CTA */}
          <section className="pb-16">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="clay-primary relative overflow-hidden px-6 py-12 text-center sm:px-10"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/20 blur-2xl"
              />
              <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Mulai buku kas kalian hari ini
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
                Daftar sekali, buku kas pertama langsung dibuat. Undang
                pasanganmu dan mulai mencatat bersama.
              </p>
              <div className="relative mt-7 flex justify-center">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate(primaryHref)}
                  disabled={isLoading}
                >
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="px-4 pb-10 sm:px-6">
          <div className="clay mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left">
            <Brand />
            <p className="text-xs text-muted-foreground">
              Buku Kas — catatan keuangan sederhana untuk berdua.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
