import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Bell, Check, History } from "@/components/icons";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function waktuLalu(timestamp: number) {
  const diff = Date.now() - timestamp;
  const menit = Math.round(diff / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Lonceng notifikasi: memberi tahu kalau teman satu pocket nambah catatan baru.
 * Query Convex reaktif, jadi toast-nya muncul tanpa perlu refresh halaman.
 */
export function NotificationBell() {
  const { activeBook } = useBooks();
  const navigate = useNavigate();
  const bookId = activeBook?._id;
  const rows = useQuery(api.books.notifications, bookId ? { bookId } : "skip");
  const markRead = useMutation(api.books.markNotificationsRead);
  const seen = useRef<Set<string> | null>(null);

  // Toast hanya untuk notifikasi yang masuk setelah halaman kebuka, bukan
  // untuk tumpukan yang sudah ada waktu pertama kali dibuka.
  useEffect(() => {
    if (!rows) return;
    const known = seen.current;
    if (known === null) {
      seen.current = new Set(rows.map((row) => row._id));
      return;
    }
    const fresh = rows.filter((row) => !known.has(row._id));
    for (const row of rows) known.add(row._id);
    const newest = fresh[0];
    if (!newest) return;
    toast.info(`${newest.actor_name} ${newest.message}`, {
      description: [newest.label, newest.detail].filter(Boolean).join(" · "),
    });
  }, [rows]);

  const unread = (rows ?? []).filter((row) => row.read_at === undefined).length;
  const items = (rows ?? []).slice(0, 8);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open || unread === 0 || !bookId) return;
        void markRead({ bookId }).catch(() => {});
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"
          }
          className="clay-sm clay-press relative grid size-8 place-items-center text-muted-foreground hover:text-primary"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 font-display font-extrabold">
            Kabar terbaru
          </DropdownMenuLabel>
          {unread > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Check className="size-3" /> {unread} baru
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Belum ada kabar. Kalau temanmu nambah catatan, muncul di sini.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((row) => (
              <li
                key={row._id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5",
                  row.read_at === undefined && "bg-primary/10",
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-xs font-black text-primary">
                  {row.actor_name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">
                    <span className="font-bold">{row.actor_name}</span>{" "}
                    <span className="text-muted-foreground">
                      {row.message}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {row.label}
                    {row.detail ? ` · ${row.detail}` : ""} ·{" "}
                    {waktuLalu(row.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <DropdownMenuSeparator className="my-0" />
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => navigate("/dashboard/riwayat")}
          >
            <History className="size-3.5" />
            Buka Riwayat buat lihat semua
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
