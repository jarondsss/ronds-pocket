import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarDays,
  ChartPie,
  HandCoins,
  History,
  Home,
  Plus,
  UserRound,
  Users,
  Wallet,
} from "@/components/icons";
import { useConvexAuth } from "convex/react";
import { Link } from "react-router";

function PhonePreview() {
  return (
    <div className="rounded-[1.7rem] bg-accent p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-[270px] rounded-[1.5rem] bg-background p-3 shadow-[0_14px_32px_-20px_var(--clay-dark)]">
        <div className="mb-3 flex items-center justify-between px-1 text-[7px] font-bold text-muted-foreground">
          <span>9:41</span>
          <span aria-hidden>● ● ●</span>
        </div>
        <p className="text-[8px] text-muted-foreground">Selamat pagi, Rani</p>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-display text-[13px] font-extrabold">
            Kantong keluarga
          </p>
          <span className="grid size-7 place-items-center rounded-lg bg-card text-primary">
            <Wallet className="size-3.5" />
          </span>
        </div>
        <div className="rounded-xl bg-card p-3">
          <p className="text-[7px] text-muted-foreground">Saldo semua dompet</p>
          <p className="mt-1 font-display text-xl font-extrabold leading-none">
            Rp7.450.000
          </p>
          <p className="mt-3 text-[7px] text-muted-foreground">
            Oktober 2026 <CalendarDays className="ml-1 inline size-2.5" />
          </p>
          <div className="mt-2 grid grid-cols-2 border-t border-border pt-2 text-[7px]">
            <div>
              <span className="text-muted-foreground">Pemasukan</span>
              <strong className="mt-0.5 block text-[9px] text-income">
                Rp8.500.000
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">Pengeluaran</span>
              <strong className="mt-0.5 block text-[9px] text-expense">
                Rp3.240.000
              </strong>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent px-2.5 py-2 text-primary">
          <CalendarDays className="size-3.5" />
          <span className="flex-1 text-[8px] font-bold text-foreground">
            Internet rumah
            <span className="block text-[7px] font-normal text-muted-foreground">
              Besok · Rp450.000
            </span>
          </span>
          <ArrowRight className="size-3" />
        </div>
        <div className="mb-2 mt-3 flex items-center justify-between">
          <strong className="text-[9px]">Catatan terbaru</strong>
          <span className="text-[7px] text-primary">Lihat semua</span>
        </div>
        <div className="rounded-xl bg-card px-3">
          <div className="flex items-center gap-2 border-b border-border py-2">
            <span className="grid size-6 place-items-center rounded-lg bg-secondary text-[11px]">
              <HandCoins className="size-3 text-primary" />
            </span>
            <span className="flex-1 text-[8px] font-bold">
              Makan siang
              <span className="block font-normal text-muted-foreground">
                Hari ini · Dompet harian
              </span>
            </span>
            <span className="text-[8px] font-bold text-expense">−Rp35.000</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="grid size-6 place-items-center rounded-lg bg-secondary">
              <Wallet className="size-3 text-primary" />
            </span>
            <span className="flex-1 text-[8px] font-bold">
              Transportasi
              <span className="block font-normal text-muted-foreground">
                Hari ini · Dompet harian
              </span>
            </span>
            <span className="text-[8px] font-bold text-expense">−Rp28.000</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {[
            { icon: HandCoins, label: "Anggaran" },
            { icon: ChartPie, label: "Tujuan" },
            { icon: Users, label: "Partner" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.label}
                className="flex items-center justify-center gap-1 rounded-lg bg-card py-1.5 text-[6px] font-bold"
              >
                <Icon className="size-2.5 text-primary" />
                {item.label}
              </span>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-around rounded-xl bg-card py-2 text-primary">
          {[Home, Wallet, Plus, History, UserRound].map((Icon, index) => (
            <span
              key={index}
              className={
                index === 2
                  ? "grid size-6 place-items-center rounded-lg bg-primary text-primary-foreground"
                  : "grid size-6 place-items-center"
              }
            >
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        Data contoh untuk ilustrasi.
      </p>
    </div>
  );
}

const questions = [
  {
    title: "Bisa dipakai bareng partner?",
    answer:
      "Bisa. Undang partner ke kantong bersama, lalu catat dari perangkat masing-masing.",
  },
  {
    title: "Harus menghubungkan rekening bank?",
    answer:
      "Tidak. Kamu bisa mencatat transaksi dan saldo dompet secara manual.",
  },
  {
    title: "Bisa mulai dari catatan sederhana?",
    answer:
      "Bisa. Mulai dengan nominal, lalu lengkapi kategori, dompet, dan tanggal.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useConvexAuth();
  const destination = isAuthenticated ? "/dashboard" : "/auth";
  return (
    <div className="public-design min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          className="font-display text-xl font-extrabold text-primary"
        >
          Ronds Pocket
        </Link>
        <nav className="flex items-center gap-5 text-xs font-bold sm:gap-10">
          <a href="#fitur" className="text-muted-foreground hover:text-primary">
            Fitur
          </a>
          <Link
            to={destination}
            className="min-w-28 rounded-xl bg-card px-5 py-3 text-center text-primary hover:bg-accent"
          >
            {isAuthenticated ? "Buka" : "Masuk"}
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
        <section className="grid items-center gap-10 pb-16 pt-9 lg:min-h-[560px] lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:pb-20 lg:pt-10">
          <div className="max-w-xl">
            <h1 className="max-w-[11ch] font-display text-[clamp(2.8rem,5.2vw,4.4rem)] font-extrabold leading-[1.05] tracking-tight">
              Uang keluarga, lebih terarah.
            </h1>
            <p className="mt-6 max-w-[39ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
              Catat pengeluaran, atur anggaran, dan bangun rencana bersama.
              Semua dalam satu kantong.
            </p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-12 min-w-44 rounded-xl">
                <Link to={destination}>
                  {isAuthenticated ? "Buka kantongku" : "Buat kantongmu"}
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="h-12 min-w-44 rounded-xl bg-card text-primary hover:bg-accent"
              >
                <a href="#cara-kerja">Lihat cara kerjanya</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Mulai gratis dengan emailmu.
            </p>
          </div>
          <PhonePreview />
        </section>

        <section id="fitur" className="scroll-mt-20 py-12 sm:py-16">
          <h2 className="max-w-[18ch] font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Lebih cepat paham uangmu ke mana.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Ringkasan yang jelas untuk keputusan sehari-hari.
          </p>
        </section>

        <section
          id="cara-kerja"
          className="grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <HandCoins className="size-6 text-primary" />
            <h2 className="mt-5 max-w-[15ch] font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Beri batas belanja. Lihat sisanya.
            </h2>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
              Atur jatah per kategori. Saat pengeluaran mendekati batas, kamu
              tahu apa yang perlu ditahan.
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-card p-5 shadow-[0_14px_30px_-24px_var(--clay-dark)] sm:p-7">
            <p className="text-xs font-bold">Anggaran bulan ini</p>
            <p className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Rp1.760.000
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Sisa dari jatah Rp5.000.000
            </p>
            <div className="mt-3 h-2 rounded-full bg-secondary">
              <div className="h-full w-[60%] rounded-full bg-primary" />
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="font-bold">Makan &amp; minum</span>
              <span className="font-bold text-primary">60% terpakai</span>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Contoh data.
            </p>
          </div>
        </section>

        <section className="my-12 grid items-center gap-8 rounded-[1.7rem] bg-card p-7 sm:p-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Users className="size-6 text-primary" />
            <h2 className="mt-5 max-w-[14ch] font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Satu kantong. Sama-sama tahu.
            </h2>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
              Undang partner ke kantong yang sama. Catatan dan perubahan
              terlihat jelas untuk semua anggota.
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-secondary p-5">
            <p className="text-sm font-extrabold">Kantong keluarga</p>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <p className="text-xs font-bold">
                Rani mencatat makan siang
                <span className="mt-1 block font-normal text-muted-foreground">
                  Rp35.000 · Dompet harian
                </span>
              </p>
              <p className="border-t border-border pt-3 text-xs font-bold">
                Adi mengatur anggaran belanja
                <span className="mt-1 block font-normal text-muted-foreground">
                  Jatah bulan ini Rp1.000.000
                </span>
              </p>
            </div>
            <p className="mt-5 text-[10px] text-muted-foreground">
              Contoh aktivitas bersama.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Sebelum mulai.
          </h2>
          <div className="mt-7 divide-y divide-border border-y border-border">
            {questions.map((item) => (
              <div key={item.title} className="py-5">
                <h3 className="text-sm font-bold sm:text-base">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-10 rounded-[1.7rem] bg-accent p-8 sm:p-10 lg:p-14">
          <h2 className="max-w-[12ch] font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Mulai dengan satu catatan.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Bangun kebiasaan rapi dari pengeluaran hari ini.
          </p>
          <Button asChild className="mt-6 h-12 min-w-44 rounded-xl">
            <Link to={destination}>
              {isAuthenticated ? "Buka kantongku" : "Buat kantongmu"}
            </Link>
          </Button>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 pb-10 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span className="font-display text-lg font-extrabold text-primary">
          Ronds Pocket
        </span>
        <span>Kantong kecil buat uangmu.</span>
      </footer>
    </div>
  );
}
