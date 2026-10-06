import { EASE } from "@/lib/motion";
import { formatRupiah, formatShortDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { CalendarClock, Plus } from "@/components/icons";
import { useMemo } from "react";

function daysLabel(dueDate: number) {
  const now = Date.now();
  const diffDays = Math.round((dueDate - now) / 86400000);
  if (diffDays < 0) return "Lewat";
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return `${diffDays} hari lagi`;
}

function daysSeverity(dueDate: number) {
  const now = Date.now();
  const diffDays = Math.round((dueDate - now) / 86400000);
  if (diffDays < 0) return "destructive";
  if (diffDays <= 3) return "warning";
  return "default";
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
    bookId ? { bookId } : "skip"
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
    return reminders.filter(
      (r) => r.enabled && r.due_date < now
    ).length;
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
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg font-extrabold flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Tagihan akan datang
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs">
                {overdueCount} lewat
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Tambah
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: EASE, delay: idx * 0.04 }}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-card/80 p-3 cursor-pointer hover:bg-primary/[2%]"
            onClick={() => onEdit(item)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{formatShortDate(item.due_date)}</span>
                {item.category && <span>· {item.category}</span>}
              </div>
            </div>
            <div className="shrink-0 ml-3 text-right">
              <p className="text-sm font-extrabold text-expense">
                {formatRupiah(item.amount)}
              </p>
              <p
                className={`text-xs font-bold ${
                  daysSeverity(item.due_date) === "destructive"
                    ? "text-destructive"
                    : daysSeverity(item.due_date) === "warning"
                      ? "text-amber-500"
                      : "text-muted-foreground"
                }`}
              >
                {daysLabel(item.due_date)}
              </p>
            </div>
          </motion.div>
        ))}

        {items.length === 0 && overdueCount > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            Semua tagihan yang diingatkan sudah lewat.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
