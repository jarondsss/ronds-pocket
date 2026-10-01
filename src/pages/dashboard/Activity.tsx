import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import type { ActivityAction } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  History,
  PencilLine,
  Plus,
  Share2,
  Trash2,
  type LucideIcon,
} from "lucide-react";

const ACTION_STYLE: Record<
  ActivityAction,
  { icon: LucideIcon; chip: string; label: string }
> = {
  create: {
    icon: Plus,
    chip: "bg-income/15 text-income",
    label: "Tambah",
  },
  update: {
    icon: PencilLine,
    chip: "bg-primary/15 text-primary",
    label: "Ubah",
  },
  delete: {
    icon: Trash2,
    chip: "bg-destructive/15 text-destructive",
    label: "Hapus",
  },
  share: {
    icon: Share2,
    chip: "bg-accent/50 text-accent-foreground",
    label: "Bagikan",
  },
};

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
  if (same(date, today)) return "Hari ini";
  if (same(date, yesterday)) return "Kemarin";
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Activity() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;
  const rows = useQuery(api.books.activity, bookId ? { bookId } : "skip");

  if (!activeBook || !bookId) return null;

  const groups: { key: string; items: NonNullable<typeof rows> }[] = [];
  for (const row of rows ?? []) {
    const key = dayKey(row.created_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, items: [row] });
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Riwayat perubahan
        </h1>
        <p className="text-sm text-muted-foreground">
          Jejak siapa ngapain di-pocket ini. Termasuk yang sudah dihapus, jadi
          kalau ada yang bingung angka berubah, cek di sini dulu.
        </p>
      </header>

      {groups.length === 0 ? (
        <section className="clay flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
            <History className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold">
              Belum ada jejak
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Begitu ada yang ditambah, diubah, atau dihapus, jejaknya muncul
              di halaman ini.
            </p>
          </div>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="clay p-4 sm:p-5">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
              {group.key}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {group.items.map((row, index) => {
                const style = ACTION_STYLE[row.action];
                const Icon = style.icon;
                return (
                  <motion.li
                    key={row._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                    className="clay-sunken flex items-start gap-3 rounded-2xl px-3 py-3"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        style.chip,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug">
                        <span className="font-bold">{row.actor_name}</span>{" "}
                        <span className="text-muted-foreground">
                          {style.label.toLowerCase()}
                        </span>{" "}
                        <span className="font-semibold">{row.label}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {row.target}
                        {row.detail ? ` · ${row.detail}` : ""} ·{" "}
                        {timeLabel(row.created_at)}
                      </span>
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <p className="text-center text-xs text-muted-foreground">
        Menampilkan 50 perubahan terakhir.
      </p>
    </div>
  );
}
