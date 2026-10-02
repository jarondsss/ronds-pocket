import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah } from "@/lib/format";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  ChartPie,
  Check,
  HandCoins,
  Loader2,
  PiggyBank,
  ShieldCheck,
} from "@/components/icons";
import { useNavigate } from "react-router";

/** Satu kurva gerak untuk seluruh halaman: turun cepat, mendarat pelan. */
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const FEATURES = [
  {
    icon: HandCoins,
    title: "Catat secepat bales chat",
    body: "Nominal, kategori, tanggal. Selesai sebelum lampu lalu lintas berubah hijau.",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: PiggyBank,
    title: "Kantong sebanyak yang kamu mau",
    body: "Pisahkan uang harian, tabungan, dan dana liburan jadi beberapa kantong.",
    tone: "bg-income/15 text-income",
  },
  {
    icon: ChartPie,
    title: "Rekap yang gampang dibaca",
    body: "Grafik kategori dan tren enam bulan bikin kelihatan uangmu pergi ke mana.",
    tone: "bg-expense/15 text-expense",
  },
  {
    icon: ShieldCheck,
    title: "Punyamu sendiri",
    body: "Cuma kamu yang bisa membuka kantongmu. Tidak ada yang bisa mengintip.",
    tone: "bg-accent/60 text-accent-foreground",
  },
];

const MOCK_ROWS = [
  { emoji: "🍜", label: "Makan & Minum", note: "sarapan di warung", amount: -35000 },
  { emoji: "💼", label: "Gaji", note: "gajian bulan ini", amount: 5000000 },
  { emoji: "🛵", label: "Transportasi", note: "ojek ke kantor", amount: -18000 },
  { emoji: "🛍️", label: "Belanja", note: "stok sabun & sampo", amount: -215000 },
];

const FACTS = [
  "Gratis, tanpa kartu kredit",
  "Enak dipakai di HP",
  "Catatanmu cuma punyamu",
];

const STEPS = [
  {
    title: "Daftar sebentar",
    body: "Masukkan email, kami kirim kode enam digit. Akunnya langsung jadi kalau belum ada.",
  },
  {
    title: "Beri nama kantongmu",
    body: "Kantong pertama sudah disiapkan otomatis. Ganti namanya sesuka kamu.",
  },
  {
    title: "Mulai catat",
    body: "Setiap pengeluaran dan pemasukan langsung muncul di ringkasan bulan ini.",
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
    <div className="relative w-full max-w-sm">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="clay-shell"
      >
        <span
          aria-hidden
          className="clay-float absolute -top-4 -right-4 z-10 grid size-12 place-items-center rounded-2xl bg-accent text-2xl"
        >
          👛
        </span>

        <div className="clay-sunken p-3">
          <div className="clay-primary p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">
              Sisa uang bulan ini
            </p>
            <p className="mt-1.5 font-display text-2xl font-extrabold">
              {formatRupiah(income - expense)}
            </p>
            <div className="mt-3 flex gap-4 text-xs font-semibold text-white/85">
              <span>Masuk {formatRupiah(income)}</span>
              <span>Keluar {formatRupiah(expense)}</span>
            </div>
          </div>

          {/* Baris catatan: dipisah garis tipis, bukan lima kartu mengambang. */}
          <ul className="mt-3 divide-y divide-border/60">
            {MOCK_ROWS.map((row, index) => (
              <motion.li
                key={row.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  duration: 0.6,
                  ease: EASE,
                }}
                className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/80 text-base">
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
                    color: row.amount > 0 ? "var(--income)" : "var(--expense)",
                  }}
                >
                  {row.amount > 0 ? "+" : "−"}
                  {formatRupiah(Math.abs(row.amount))}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      <p className="mt-3 text-center text-[11px] font-semibold text-muted-foreground">
        Contoh tampilan. Angkanya cuma contoh, bukan catatan orang beneran.
      </p>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";
  const primaryLabel = isAuthenticated ? "Buka kantongku" : "Daftar gratis";

  const primaryAction = (
    <Button
      type="button"
      size="lg"
      onClick={() => navigate(primaryHref)}
      disabled={isLoading}
      className="group h-12 gap-3 pr-2 pl-5"
    >
      {primaryLabel}
      <span className="grid size-9 place-items-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
      </span>
    </Button>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-hidden">
        <div
          aria-hidden
          className="pointer-events-none fixed -left-32 -top-32 size-96 rounded-full bg-primary/18 blur-3xl"
        />

        <div className="relative">
          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
            <div className="clay mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
              <Brand />
              <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
                <a href="#fitur" className="transition-colors hover:text-primary">
                  Fitur
                </a>
                <a href="#cara" className="transition-colors hover:text-primary">
                  Cara pakai
                </a>
                <a href="#kantong" className="transition-colors hover:text-primary">
                  Kantong
                </a>
              </nav>
              <Button
                type="button"
                onClick={() => navigate(primaryHref)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  primaryLabel
                )}
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            {/* Hero */}
            <section className="grid items-center gap-12 py-10 sm:py-14 lg:min-h-[calc(100dvh-7rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.8, ease: EASE }}
              >
                <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
                  Uangmu, rapi
                  <span className="text-primary"> di satu kantong.</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Uang jajan, gaji, sampai pengeluaran kecil yang sering lupa.
                  Kamu tulis, sisanya kami hitung.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {primaryAction}
                  <Button asChild size="lg" variant="outline" className="h-12">
                    <a href="#fitur">Lihat fitur</a>
                  </Button>
                </div>
              </motion.div>

              <div className="flex justify-center lg:justify-end">
                <MockPreview />
              </div>
            </section>

            {/* Fakta singkat: teks jujur, dipisah garis tipis, tanpa angka. */}
            <section className="grid grid-cols-1 divide-y divide-border/70 border-y border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {FACTS.map((fact) => (
                <p
                  key={fact}
                  className="flex items-center justify-center gap-2 py-5 text-sm font-semibold text-muted-foreground"
                >
                  <Check className="size-4 shrink-0 text-income" />
                  {fact}
                </p>
              ))}
            </section>

            {/* Fitur */}
            <section id="fitur" className="scroll-mt-28 py-20 sm:py-28">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-xl"
              >
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Simpel, tapi nggak nyisa
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Semua yang kamu butuhkan untuk rajin mencatat, tanpa fitur yang
                  bikin bingung.
                </p>
              </motion.div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  const featured = index === 0;
                  return (
                    <motion.article
                      key={feature.title}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{
                        duration: 0.7,
                        ease: EASE,
                        delay: index * 0.07,
                      }}
                      whileHover={{ y: -6 }}
                      className={
                        featured
                          ? "clay-primary p-6 sm:p-7"
                          : "clay p-6 sm:p-7"
                      }
                    >
                      <span
                        className={`grid size-11 place-items-center rounded-2xl ${
                          featured ? "bg-white/25" : feature.tone
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <h3 className="mt-5 font-display text-lg font-extrabold">
                        {feature.title}
                      </h3>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          featured ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {feature.body}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            </section>

            {/* Cara pakai */}
            <section id="cara" className="scroll-mt-28 py-20 sm:py-28">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="clay grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
              >
                <div>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Mulai dalam tiga langkah
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Nggak ada setup panjang. Kantong pertamamu sudah menunggu
                    begitu kamu masuk.
                  </p>
                </div>
                <ol className="flex flex-col gap-3">
                  {STEPS.map((step, index) => (
                    <motion.li
                      key={step.title}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        duration: 0.6,
                        ease: EASE,
                        delay: index * 0.09,
                      }}
                      className="clay-sunken flex items-start gap-4 px-4 py-4 sm:px-5"
                    >
                      <span className="clay-primary grid size-9 shrink-0 place-items-center font-display text-base font-extrabold">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-base font-extrabold">
                          {step.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {step.body}
                        </span>
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            </section>

            {/* Kantong + privasi */}
            <section id="kantong" className="scroll-mt-28 py-20 sm:py-28">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="clay grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:items-center"
              >
                <div>
                  <span className="clay-sm inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-income">
                    <PiggyBank className="size-3.5" />
                    Kantongmu, aturanmu
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Satu aplikasi, banyak kantong
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Pisahkan uang harian dari tabungan, atau bikin kantong khusus
                    buat dana liburan. Tiap kantong punya catatan dan rekapnya
                    sendiri, jadi kelihatan mana yang masih aman dan mana yang
                    perlu ditahan.
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {[
                    "Tambah kantong baru kapan pun kamu mau",
                    "Pindah kantong cukup dari satu dropdown",
                    "Sisa uang dan rekap dihitung otomatis",
                    "Ada kode undangan kalau nanti mau catat bareng orang lain",
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

            {/* CTA penutup: shell clay menahan core violet di dalamnya. */}
            <section className="pb-24 sm:pb-28">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="clay p-2 sm:p-3"
              >
                <div className="clay-primary relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-16">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/20 blur-2xl"
                  />
                  <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Bikin kantong pertamamu
                  </h2>
                  <p className="relative mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
                    Daftar dengan email, dan mulai catat pengeluaran hari ini.
                    Gratis, tanpa syarat aneh-aneh.
                  </p>
                  <div className="relative mt-8 flex justify-center">
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      onClick={() => navigate(primaryHref)}
                      disabled={isLoading}
                      className="group h-12 gap-3 pr-2 pl-5"
                    >
                      {primaryLabel}
                      <span className="grid size-9 place-items-center rounded-full bg-primary/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                        <ArrowRight className="size-4" />
                      </span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </section>
          </main>

          <footer className="px-4 pb-12 sm:px-6">
            <div className="clay mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left">
              <Brand />
              <p className="text-xs text-muted-foreground">
                Dibuat buat kamu yang pengin rapi tanpa ribet.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
