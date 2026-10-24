import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarDays,
  CalendarClock,
  Plus,
} from "@/components/icons";
import { useMemo } from "react";

function daysLabel(dueDate: number) {
  const now = Date.now();
  const diffDays = Math.round((dueDate - now) / 86400000);
  if (diffDays < 0) return "Lewat";
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return `${diffDays} hari lagi`;
}

interface UpcomingBillRemindersCardProps {
  bookId: Id<"books">;
  onAdd: () => void;
  onEdit: (reminder: {
    _id: Id<"bill_reminders">;
    title: string;
    amount: number;
    category: string;
    due_date: number;
    remind_days_before: number;
    enabled: boolean;
    wallet_id?: Id<"wallets">;
  }) => void;
}

export function UpcomingBillRemindersCard({
  bookId,
  onAdd,
  onEdit,
}: UpcomingBillRemindersCardProps) {
  const reminders = useQuery(
    api.billReminders.list,
    bookId ? { bookId } : "skip",
  );

  const items = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (!reminders) return [];
    return reminders
      .filter((r) => r.enabled && r.due_date >= now)
      .sort((a, b) => a.due_date - b.due_date)
      .slice(0, 5);
  }, [reminders]);

  const overdueCount = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (!reminders) return 0;
    return reminders.filter((r) => r.enabled && r.due_date < now).length;
  }, [reminders]);

  if (items.length === 0 && overdueCount === 0) {
    return (
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg font-extrabold flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Tagihan akan datang
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Belum ada tagihan yang diingatkan. Tambahkan satu biar nggak lupa.
          </p>
          <Button type="button" onClick={onAdd} className="w-full gap-2">
            <Plus className="size-4" />
            Tambah pengingat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-label="Pengingat tagihan" className="space-y-2">
      {items.map((item) => (
        <button
          key={item._id}
          type="button"
          onClick={() => onEdit(item)}
          className="flex min-h-[70px] w-full items-center gap-3 rounded-[1.3rem] bg-accent px-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">
              {item.title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {daysLabel(item.due_date)} · {formatRupiah(item.amount)}
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </button>
      ))}
      {overdueCount > 0 && (
        <p className="px-2 text-xs font-semibold text-destructive">
          {overdueCount} pengingat sudah lewat
        </p>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="px-2 py-1 text-xs font-bold text-primary"
      >
        + Tambah pengingat
      </button>
    </section>
  );
}
