import { Brand } from "@/components/Brand";
import { BookSwitcher } from "@/components/dashboard/BookSwitcher";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SaveBadge } from "@/components/SaveBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { BooksProvider, useBooks } from "@/lib/book-context";
import { formatRupiah } from "@/lib/format";
import { SaveStatusProvider } from "@/lib/save-status";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartPie,
  HandCoins,
  LogOut,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  useOutlet,
} from "react-router";

const PRIMARY_TABS = [
  { to: "/dashboard", label: "Transaksi", icon: Receipt, end: true },
  { to: "/dashboard/dompet", label: "Dompet", icon: Wallet, end: false },
  { to: "/dashboard/anggaran", label: "Anggaran", icon: HandCoins, end: false },
  { to: "/dashboard/goals", label: "Goals", icon: Target, end: false },
  { to: "/dashboard/tabungan", label: "Tabungan", icon: PiggyBank, end: false },
];

const SECONDARY_TABS = [
  { to: "/dashboard/rekap", label: "Rekap", icon: ChartPie },
  { to: "/dashboard/partner", label: "Sharing", icon: Users },
];

function BottomNav() {
  return (
    <nav className="clay fixed bottom-3 left-1/2 z-40 flex w-[min(96vw,30rem)] -translate-x-1/2 items-center gap-0.5 p-1.5 lg:hidden">
      {PRIMARY_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.span
                  animate={{ y: isActive ? -2 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-all",
                    isActive && "clay-primary",
                  )}
                >
                  <Icon className="size-5" />
                </motion.span>
                {tab.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarNav() {
  return (
    <>
      <nav className="flex flex-col gap-2">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "clay-press flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                  isActive
                    ? "clay-primary"
                    : "clay-sm text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>
      <nav className="flex flex-col gap-1.5 border-t border-border/70 pt-3">
        {SECONDARY_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
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
      </nav>
    </>
  );
}

function UserCard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const label = user?.name ?? user?.email?.split("@")[0] ?? "Pengguna";

  return (
    <div className="clay-sm flex items-center gap-3 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-black text-accent-foreground">
        {label.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {user?.email ?? "Masuk sebagai tamu"}
        </span>
      </span>
      <button
        type="button"
        aria-label="Keluar"
        title="Keluar"
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
        className="clay-sm clay-press grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function TotalBalance({ total, wide }: { total: number; wide?: boolean }) {
  return (
    <div
      className={cn(
        "clay-sm flex items-center gap-3 p-3",
        wide && "py-3.5",
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-income/15 text-base">
        👛
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Total saldo
        </span>
        <span className="block font-display text-sm font-extrabold">
          {formatRupiah(total)}
        </span>
      </span>
    </div>
  );
}

function Shell() {
  const { activeBook, isLoading } = useBooks();
  const location = useLocation();
  const outlet = useOutlet();
  const bookId = activeBook?._id;

  const walletData = useQuery(
    api.wallets.list,
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

  const total = walletData?.total ?? 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 top-1/3 size-72 rounded-full bg-accent/50 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl gap-6 px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <Brand />
            <TotalBalance total={total} wide />
            <BookSwitcher />
            <SidebarNav />
            <UserCard />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 flex flex-col gap-3 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <Brand compact />
              <div className="flex items-center gap-2">
                <SaveBadge />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Menu lainnya"
                      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Lainnya</DropdownMenuLabel>
                    {SECONDARY_TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <DropdownMenuItem
                          key={tab.to}
                          asChild
                          className="gap-2 font-semibold"
                        >
                          <NavLink to={tab.to}>
                            <Icon className="size-4" />
                            {tab.label}
                          </NavLink>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1">
                <BookSwitcher />
              </div>
              <TotalBalance total={total} />
            </div>
          </header>

          <div className="mb-3 hidden justify-end lg:flex">
            <SaveBadge />
          </div>

          {isLoading ? (
            <div className="grid min-h-[50vh] place-items-center">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                Memuat kantongmu...
              </span>
            </div>
          ) : activeBook === null ? (
            <div className="clay p-8 text-center">
              <p className="font-display text-lg font-extrabold">
                Menyiapkan kantong pertamamu...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sebentar ya, kantong utamamu sedang kami siapkan.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ErrorBoundary>{outlet}</ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default function Dashboard() {
  return (
    <BooksProvider>
      <SaveStatusProvider>
        <Shell />
      </SaveStatusProvider>
    </BooksProvider>
  );
}
