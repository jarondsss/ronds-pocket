import { Brand } from "@/components/Brand";
import { ClayLoader } from "@/components/ClayLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SaveBadge } from "@/components/SaveBadge";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { SupportActions } from "@/components/dashboard/SupportActions";
import { UserMenu, UserMenuSkeleton } from "@/components/dashboard/UserMenu";
import {
  TransactionDialog,
  type EditorSession,
} from "@/components/dashboard/TransactionDialog";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { BooksProvider, useBooks } from "@/lib/book-context";
import { SaveStatusProvider } from "@/lib/save-status";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { EASE } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartPie,
  HandCoins,
  History,
  Home,
  Landmark,
  Moon,
  PiggyBank,
  Plus,
  Sun,
  Target,
  UserRound,
  Users,
  Wallet,
} from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useOutlet } from "react-router";
import { useTheme } from "next-themes";
import { toDateInput } from "@/lib/format";

const BOTTOM_TABS = [
  { to: "/dashboard", label: "Beranda", icon: Home, end: true },
  { to: "/dashboard/dompet", label: "Dompet", icon: Wallet, end: false },
  { to: "/dashboard/riwayat", label: "Riwayat", icon: History, end: false },
  { to: "/dashboard/profil", label: "Profil", icon: UserRound, end: false },
];

const OTHER_TABS = [
  { to: "/dashboard/anggaran", label: "Anggaran", icon: HandCoins },
  { to: "/dashboard/goals", label: "Goals", icon: Target },
  { to: "/dashboard/tabungan", label: "Tabungan", icon: PiggyBank },
  { to: "/dashboard/net-worth", label: "Net Worth", icon: Landmark },
  { to: "/dashboard/rekap", label: "Rekap", icon: ChartPie },
  { to: "/dashboard/partner", label: "Sharing", icon: Users },
  // Jejak perubahan tidak lagi punya tab sendiri di nav bawah; di desktop
  // tetap bisa dibuka dari sini (di HP lewat tautan di notifikasi).
  { to: "/dashboard/riwayat/aktivitas", label: "Riwayat perubahan", icon: History },
];

function BottomNav({ onAdd }: { onAdd: () => void }) {
  // Tombol "+" di tengah: 2 tab kiri (Beranda, Dompet), 2 kanan (Riwayat, Profil).
  const half = BOTTOM_TABS.length / 2;
  const left = BOTTOM_TABS.slice(0, half);
  const right = BOTTOM_TABS.slice(half);
  // Tab Profil pakai wajah penggunanya sendiri, bukan ikon orang generik:
  // satu tempat yang jelas buat "ini akunku".
  const profile = useProfile();

  const renderTab = (tab: (typeof BOTTOM_TABS)[number]) => {
    const Icon = tab.icon;
    const isProfile = tab.to === "/dashboard/profil";
    return (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={tab.end}
        className={({ isActive }) =>
          cn(
            "flex flex-1 flex-col items-center gap-1 rounded-full px-1 py-1.5 text-[10px] font-bold transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-primary",
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Tab aktif naik 1px: umpan instan buat jempol di nav yang
                dipakai tiap detik (R-19). */}
            <motion.span
              animate={{ y: isActive ? -1 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className={cn(
                "grid size-9 place-items-center rounded-full transition-all",
                isActive && "clay-nav-active",
              )}
            >
              {isProfile ? (
                <span className="grid size-6 place-items-center rounded-lg bg-accent text-[13px] leading-none text-accent-foreground">
                  {profile.avatar ?? (
                    <span className="text-[11px] font-black">
                      {profile.initial}
                    </span>
                  )}
                </span>
              ) : (
                <Icon className="size-5" />
              )}
            </motion.span>
            {tab.label}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav className="clay-nav fixed bottom-4 left-1/2 z-40 flex w-[min(94vw,28rem)] -translate-x-1/2 items-center gap-0.5 p-1.5 lg:hidden">
      {left.map(renderTab)}
      <button
        type="button"
        onClick={onAdd}
        aria-label="Catat uang"
        className="clay-primary clay-press relative -my-2 grid size-14 shrink-0 place-items-center rounded-full shadow-[0_0.6rem_1.2rem_-0.35rem_var(--clay-dark)]"
      >
        <Plus className="size-7" />
      </button>
      {right.map(renderTab)}
    </nav>
  );
}

function SidebarNav() {
  return (
    <nav className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "clay-press flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition-colors",
                  isActive
                    ? "clay-nav-active"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Lainnya
        </p>
        {OTHER_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

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

function Shell() {
  const { activeBook, isLoading } = useBooks();
  const { isLoading: authLoading } = useAuth();
  const authReady = !authLoading;
  const location = useLocation();
  const outlet = useOutlet();
  const bookId = activeBook?._id;

  const walletData = useQuery(
    api.wallets.list,
    bookId ? { bookId } : "skip",
  );
  const categories = useQuery(
    api.categories.list,
    bookId ? { bookId } : "skip",
  );
  const ensureDefaults = useMutation(api.setup.ensurePocketDefaults);
  const seededFor = useRef<string | null>(null);

  // Kantong baru selalu dapat dompet + kategori bawaan.
  useEffect(() => {
    if (!bookId || walletData === undefined) return;
    if (walletData.wallets.length > 0) return;
    if (seededFor.current === bookId) return;
    seededFor.current = bookId;
    void ensureDefaults({ bookId }).catch(() => {
      seededFor.current = null;
    });
  }, [bookId, walletData, ensureDefaults]);

  // Sesi global "Catat uang" dari nav. Dibuat di event handler supaya tanggal
  // hari ini dihitung tanpa fungsi impure saat render.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<EditorSession | null>(null);
  const sessionKey = useRef(0);
  const openAdd = () => {
    sessionKey.current += 1;
    setSession({
      key: sessionKey.current,
      mode: "new",
      today: toDateInput(Date.now()),
      transaction: null,
      draft: null,
    });
    setDialogOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Desktop layout */}
      <div className="relative mx-auto flex w-full max-w-6xl gap-6 px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <Brand />
            <SidebarNav />
            {authReady ? <UserMenu /> : <UserMenuSkeleton />}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 flex items-center gap-3 lg:hidden">
            <Brand compact />
            <div className="flex items-center gap-1.5">
              <SupportActions />
              <SaveBadge />
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <div className="mb-3 hidden items-center gap-2 lg:flex">
            <SupportActions />
            <SaveBadge />
            <NotificationBell />
            <ThemeToggle />
          </div>

          {isLoading ? (
            <div className="grid min-h-[50vh] place-items-center">
              <ClayLoader label="Memuat kantongmu..." />
            </div>
          ) : activeBook === null ? (
            <div className="clay p-8 text-center">
              <ClayLoader className="mb-4" />
              <p className="font-display text-lg font-extrabold">
                Menyiapkan kantong pertamamu...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sebentar ya, kantong utamamu sedang kami siapkan.
              </p>
            </div>
          ) : (
            // Transisi antar-halaman 0.2s ease: orientasi arah konten
            // berganti; sengaja beda dari spring elemen melayang (R-19).
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <ErrorBoundary>{outlet}</ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile bottom navigation (di luar area konten utama agar selalu
          tetap di bawah, bahkan saat halaman discroll). */}
      <BottomNav onAdd={openAdd} />

      {bookId && (
        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          bookId={bookId}
          wallets={walletData?.wallets ?? []}
          categories={categories ?? []}
          session={session}
        />
      )}
    </div>
  );
}

export function Dashboard() {
  return (
    <SaveStatusProvider>
      <BooksProvider>
        <Shell />
      </BooksProvider>
    </SaveStatusProvider>
  );
}
