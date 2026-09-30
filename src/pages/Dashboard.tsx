import { Brand } from "@/components/Brand";
import { BookSwitcher } from "@/components/dashboard/BookSwitcher";
import { BooksProvider, useBooks } from "@/lib/book-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ChartPie,
  Loader2,
  LogOut,
  Receipt,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Catatan", icon: Receipt, end: true },
  { to: "/dashboard/rekap", label: "Rekap", icon: ChartPie, end: false },
  { to: "/dashboard/partner", label: "Partner", icon: Users, end: false },
];

function NavItems({ variant }: { variant: "sidebar" | "bottom" }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        if (variant === "bottom") {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl transition-all",
                      isActive && "clay-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          );
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
            {item.label}
          </NavLink>
        );
      })}
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

function Shell() {
  const { activeBook, isLoading } = useBooks();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* soft clay background blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 top-1/3 size-72 rounded-full bg-accent/25 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl gap-6 px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <Brand />
            <BookSwitcher />
            <nav className="flex flex-col gap-2">
              <NavItems variant="sidebar" />
            </nav>
            <UserCard />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Brand compact />
            <div className="w-48">
              <BookSwitcher />
            </div>
          </header>

          {isLoading ? (
            <div className="grid min-h-[50vh] place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeBook === null ? (
            <div className="clay p-8 text-center">
              <p className="font-display text-lg font-extrabold">
                Menyiapkan buku kas pertama kamu...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tunggu sebentar, buku kas default sedang dibuat.
              </p>
            </div>
          ) : (
            <motion.div
              key={activeBook._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          )}
        </main>
      </div>

      <nav className="clay fixed bottom-3 left-1/2 z-40 flex w-[min(94vw,26rem)] -translate-x-1/2 items-center gap-1 p-1.5 lg:hidden">
        <NavItems variant="bottom" />
      </nav>
    </div>
  );
}

export default function Dashboard() {
  return (
    <BooksProvider>
      <Shell />
    </BooksProvider>
  );
}
