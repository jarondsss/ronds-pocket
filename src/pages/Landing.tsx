import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah } from "@/lib/format";
import { MotionConfig, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ChartPie,
  Check,
  HandCoins,
  Landmark,
  Loader2,
  MessageCircle,
  Moon,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Sun,
  Target,
  Users,
  Wallet,
} from "@/components/icons";
import { useNavigate } from "react-router";

/** Tema tokolades (clay) yang mengikuti kamar: terang ke gelap, tanpa
 * DarkMode-nya Tailwind. Gambar ikon terang/ gelap sesuai tema aktif. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Ganti tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}

/** Satu kurva gerak untuk seluruh halaman: turun cepat, mendarat pelan. */
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

/** Enam kartu "Everything in one place", mengikuti struktur kynan.id. */
const PILLARS = [
  {
    icon: MessageCircle,
    title: "Catat dari chat",
    body: "Nominal, kategori, tanggal. Selesai sebelum lampu lalu lintas berubah hijau.",
  },
  {
    icon: ChartPie,
    title: "Rekap & insight",
    body: "Grafik kategori dan tren enam bulan bikin kelihatan uangmu pergi ke mana.",
  },
  {
    icon: HandCoins,
    title: "Anggaran yang kejaga",
    body: "Kasih jatah tiap kategori, sisa kehitung sendiri, dan ada peringatan sebelum mentok.",
  },
  {
    icon: Wallet,
    title: "Wealth Hub",
    body: "Tunai, bank, e-wallet, sampai investasi: semua saldo tersambung dalam satu gambaran.",
  },
  {
    icon: Repeat,
    title: "Tagihan rutin & gaji",
    body: "Pengeluaran rutin tercatat otomatis tiap periode, tanpa input ulang.",
  },
  {
    icon: Users,
    title: "Catat bareng pasangan",
    body: "Undang orang tersayang ke kantong yang sama, catat dan pantau berdua.",
  },
];

/** Kartu "What you'll accomplish" — tujuan yang bisa dicapai pengguna. */
const ACCOMPLISHMENTS = [
  { emoji: "🧘", title: "Berhenti kehabisan uang", body: "Tahu sisa duit sebelum akhir bulan, bukan sesudahnya." },
  { emoji: "🛟", title: "Bangun dana darurat", body: "Sisihin pelan-pelan tiap bulan sampai jadi bantalan." },
  { emoji: "🏷️", title: "Lunasin utang lebih cepat", body: "Lihat utang dan piutang di satu papan, bayar yang paling dulu." },
  { emoji: "🏝️", title: "Nabung buat target besar", body: "DP rumah, nikahan, liburan: pantau progresnya bareng." },
  { emoji: "🔍", title: "Tahu uang pergi ke mana", body: "Rekap per kategori bikin kebocoran kelihatan cepat." },
];

const WHY = [
  {
    title: "Secepat ketik",
    body: "Satu baris isian, transaksi langsung kecatat. Nggak perlu buka-buka menu.",
  },
  {
    title: "Buat keluarga Indonesia",
    body: "Format rupiah, kategori lokal, dan dibuat dikelola bareng pasangan.",
  },
  {
    title: "Bukan sekadar catatan",
    body: "Anggaran, tabungan, tujuan, dan kekayaan bersih tersambung jadi satu.",
  },
  {
    title: "Punyamu sendiri",
    body: "Cuma kamu dan orang yang kamu undang yang bisa membuka kantongmu.",
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

/** Ikon garis yang melayang di sekitar kartu contoh, seperti di layar acuan. */
const FLOATING_ICONS = [
  { icon: Wallet, label: "Dompet", pos: "-top-5 -left-6" },
  { icon: ChartPie, label: "Rekap", pos: "top-16 -right-7" },
  { icon: PiggyBank, label: "Tabungan", pos: "bottom-24 -left-8" },
  { icon: Target, label: "Target", pos: "-bottom-4 right-10" },
];

const STEPS = [
  {
    num: "01",
    title: "Catat",
    body: "Catat tiap pemasukan dan pengeluaran dalam sekali ketik, cepat dan tanpa ribet.",
  },
  {
    num: "02",
    title: "Anggarkan",
    body: "Tentukan jatah tiap kategori dan biarkan sisanya kehitung otomatis tiap bulan.",
  },
  {
    num: "03",
    title: "Tumbuh",
    body: "Pantau tren, tabungan, dan kekayaan bersih yang saling terhubung sampai target tercapai.",
  },
];

const FAQS = [
  {
    q: "Apakah Ronds Pocket gratis?",
    a: "Gratis. Kamu bisa mencatat transaksi, mengatur anggaran bulanan, memantau tabungan dan kekayaan bersih, serta mengelola keuangan bareng pasangan, semuanya tanpa biaya.",
  },
  {
    q: "Gimana cara catat pengeluarannya?",
    a: "Buka kantongmu, ketik nominalnya, pilih kategori, selesai. Ada juga template tagihan rutin yang tercatat sendiri tiap periodenya.",
  },
  {
    q: "Bisa dipakai bareng pasangan?",
    a: "Bisa. Undang pasangan atau keluarga ke kantong yang sama lewat kode undangan, lalu catat dan pantau keuangan dari HP masing-masing.",
  },
  {
    q: "Apa itu Net Worth di sini?",
    a: "Gambaran utuh kekayaanmu: total dompet, tabungan, dan dana tujuan, dikurangi utang, ditambah piutang. Angkanya terhitung otomatis dari catatanmu.",
  },
  {
    q: "Apakah data keuangan saya aman?",
    a: "Akses kantong hanya diberikan kepada orang yang kamu undang, catatanmu tidak dibagikan ke siapa pun, dan akun bisa kamu hapus kapan saja.",
  },
  {
    q: "Apa saya perlu jago soal keuangan?",
    a: "Nggak sama sekali. Kamu cukup catat, dan aplikasinya yang merapikan jadi anggaran, rekap, dan laporan yang gampang dimengerti.",
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
  const usedPercent = Math.round((expense / (income + expense)) * 100);

  return (
    <div className="relative w-full max-w-sm">
      {/* Ikon garis mengambang di sekeliling kartu, seperti di layar acuan. */}
      {FLOATING_ICONS.map((item, index) => {
        const Glyph = item.icon;
        return (
          <motion.span
            key={item.label}
            aria-hidden
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.5 + index * 0.12 }}
            className={`clay clay-float absolute z-10 grid size-11 place-items-center text-primary ${item.pos}`}
          >
            <Glyph className="size-5" />
          </motion.span>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
        className="clay p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sisa uang bulan ini
            </p>
            <p className="mt-1.5 bg-gradient-to-br from-[#8b7cff] to-[#5b4fe8] bg-clip-text font-display text-2xl font-extrabold text-transparent">
              {formatRupiah(income - expense)}
            </p>
          </div>
          <span className="clay-chip mt-1">{usedPercent}% terpakai</span>
        </div>

        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-income">
            <span className="size-2 rounded-full bg-income" />
            Masuk {formatRupiah(income)}
          </span>
          <span className="flex items-center gap-1.5 text-expense">
            <span className="size-2 rounded-full bg-expense" />
            Keluar {formatRupiah(expense)}
          </span>
        </div>

        {/* Baris catatan: dipisah garis tipis, bukan lima kartu mengambang. */}
        <ul className="mt-4 divide-y divide-border/60">
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
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary/80 text-base">
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
      </motion.div>

      <p className="mt-4 text-center text-[11px] font-semibold text-muted-foreground">
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
              <ThemeToggle />
              <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
                <a href="#fitur" className="transition-colors hover:text-primary">
                  Fitur
                </a>
                <a href="#kenapa" className="transition-colors hover:text-primary">
                  Kenapa kami
                </a>
                <a href="#cara" className="transition-colors hover:text-primary">
                  Cara pakai
                </a>
                <a href="#tanya" className="transition-colors hover:text-primary">
                  Tanya jawab
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
            {/* Hero: badge + judul + CTA + mock aplikasi, seperti acuan kynan.id */}
            <section className="grid items-center gap-12 py-10 sm:py-14 lg:min-h-[calc(100dvh-7rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.8, ease: EASE }}
              >
                <span className="clay-sm inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-income">
                  <Check className="size-3.5" />
                  Gratis untuk mulai
                </span>
                <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
                  Atur uang keluarga,{" "}
                  <span className="text-primary">jadi tenang.</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Catat transaksi, jaga anggaran, hubungkan semua dompet, dan
                  rencanakan masa depan bareng orang tersayang. Semudah itu.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {primaryAction}
                  <Button asChild size="lg" variant="outline" className="h-12">
                    <a href="#fitur">Lihat fitur</a>
                  </Button>
                </div>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">
                  Mulai dalam 2 menit · Tanpa syarat aneh-aneh
                </p>
              </motion.div>

              <div className="flex justify-center lg:justify-end">
                <MockPreview />
              </div>
            </section>

            {/* Tiga blurb log-in cepat, seperti acuan */}
            <section className="grid grid-cols-1 divide-y divide-border/70 border-y border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { title: "Log in seconds", body: "Tambah transaksi dalam sekali ketik." },
                { title: "Budgets that stick", body: "Jatah per kategori yang kejaga." },
                { title: "Better, together", body: "Kelola bareng pasangan atau keluarga." },
              ].map((item) => (
                <p
                  key={item.title}
                  className="flex flex-col items-center gap-1 py-5 text-center"
                >
                  <span className="font-display text-sm font-extrabold">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.body}
                  </span>
                </p>
              ))}
            </section>

            {/* Everything in one place: 6 kartu fitur */}
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
                  Semuanya di satu tempat
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Dari transaksi harian sampai aset dan rencana keuangan
                  keluarga, semuanya saling terhubung dalam satu aplikasi yang
                  enak dipakai.
                </p>
              </motion.div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {PILLARS.map((feature, index) => {
                  const Icon = feature.icon;
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
                        delay: index * 0.06,
                      }}
                      whileHover={{ y: -6 }}
                      className="clay p-6"
                    >
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <h3 className="mt-5 font-display text-lg font-extrabold">
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

            {/* What you'll accomplish: tujuan, digeser seperti carousel acuan */}
            <section className="pb-4 sm:pb-8">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Apa yang bakal kamu capai
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Geser untuk lihat lebih banyak →
                </p>
              </motion.div>
              <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
                {ACCOMPLISHMENTS.map((item, index) => (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.6,
                      ease: EASE,
                      delay: index * 0.05,
                    }}
                    className="clay min-w-[16rem] max-w-[16rem] snap-start p-5 sm:min-w-[18rem]"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className="mt-3 font-display text-base font-extrabold">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </motion.article>
                ))}
              </div>
            </section>

            {/* Why Kynan → Why Ronds Pocket */}
            <section id="kenapa" className="scroll-mt-28 py-16 sm:py-24">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-xl"
              >
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Kenapa Ronds Pocket
                </h2>
              </motion.div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {WHY.map((item, index) => (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.6,
                      ease: EASE,
                      delay: index * 0.06,
                    }}
                    className="clay-sm p-5"
                  >
                    <h3 className="font-display text-base font-extrabold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </motion.article>
                ))}
              </div>
            </section>

            {/* Grafik pertumbuhan kekayaan bersih, seperti acuan */}
            <section className="pb-16 sm:pb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="clay p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-extrabold">
                      Pertumbuhan Kekayaan Bersih
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      6 bulan terakhir
                    </p>
                  </div>
                  <span className="clay-chip text-income">
                    On track ✓
                  </span>
                </div>
                {/* Batang naik sederhana: angka contoh, bukan data pengguna. */}
                <div className="mt-6 flex h-36 items-end gap-2 sm:gap-3">
                  {[38, 44, 41, 55, 62, 74].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        duration: 0.7,
                        ease: EASE,
                        delay: index * 0.08,
                      }}
                      className="flex-1 rounded-t-xl bg-primary/70"
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Contoh gambar. Net worth sungguhan dihitung di aplikasi: total
                  dompet + tabungan + tujuan − utang + piutang.
                </p>
              </motion.div>
            </section>

            {/* How it works: Track / Budget / Grow dengan nomor besar */}
            <section id="cara" className="scroll-mt-28 pb-16 sm:pb-24">
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
              >
                Mulai pegang kendali hari ini
              </motion.h2>
              <div className="mt-10 grid gap-5 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                  <motion.article
                    key={step.num}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.6,
                      ease: EASE,
                      delay: index * 0.08,
                    }}
                    className="clay p-6"
                  >
                    <span className="font-display text-3xl font-extrabold text-primary">
                      {step.num}
                    </span>
                    <h3 className="mt-3 font-display text-lg font-extrabold">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </motion.article>
                ))}
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

            {/* FAQ accordion, seperti acuan */}
            <section id="tanya" className="scroll-mt-28 py-16 sm:py-24">
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
              >
                Masih ada yang mengganjal?
              </motion.h2>
              <Accordion type="single" collapsible className="mt-8">
                {FAQS.map((faq) => (
                  <AccordionItem key={faq.q} value={faq.q} className="clay mb-3 rounded-3xl px-4 sm:px-5">
                    <AccordionTrigger className="text-left text-sm font-bold hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
                    Mulai atur keuangan keluargamu dalam 2 menit
                  </h2>
                  <p className="relative mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
                    Daftar dengan email, dan mulai catat pengeluaran hari ini.
                    Gratis.
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
