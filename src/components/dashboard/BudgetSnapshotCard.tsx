import { EASE } from "@/lib/motion";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { PencilLine } from "@/components/icons";
import { useMemo } from "react";
import { Link } from "react-router";

interface BudgetSnapshotCardProps {
  bookId: Id<"books">;
  range: { from: number; to: number };
}

function BudgetBarStub({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  return (
    <div className="w-full overflow-hidden rounded-full bg-muted/40" style={{ height: 8 }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="h-full bg-primary"
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  safe: { label: "Aman", className: "text-[#4ade80]" },
  near: { label: "Hampir", className: "text-amber-500" },
  over: { label: "Lewat", className: "text-destructive" },
};

export function BudgetSnapshotCard({ bookId, range }: BudgetSnapshotCardProps) {
  const data = useQuery(
    api.budgets.list,
    bookId ? { bookId, from: range.from, to: range.to } : "skip"
  );

  const summary = useMemo(() => {
    if (!data) return null;
    const { budgets, unbudgeted, totalBudget, totalSpent, overspent, nearLimit } = data;

    const overCategories = budgets.filter((b) => b.spent > b.amount);
    const nearCategories = budgets.filter(
      (b) => b.amount > 0 && b.spent <= b.amount && b.spent >= b.amount * 0.8
    );
    const biggest = [...budgets]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);

    const topUnbudgeted = unbudgeted.slice(0, 2);

    return {
      totalBudget,
      totalSpent,
      overCategories,
      nearCategories,
      overspent,
      nearLimit,
      biggest,
      topUnbudgeted,
      allCount: budgets.length + unbudgeted.length,
    };
  }, [data]);

  if (!summary) {
    return (
      <Card className="border-border/50 bg-card/60">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Anggaran belum ada.</p>
        </CardContent>
      </Card>
    );
  }

  const { totalBudget, totalSpent, overCategories, nearCategories, biggest, topUnbudgeted } =
    summary;

  const totalRemaining = totalBudget - totalSpent;

  const totalStatus =
    totalSpent > totalBudget
      ? "over"
      : totalSpent >= totalBudget * 0.8
        ? "near"
        : "safe";

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg font-extrabold">
            Anggaran bulan ini
          </CardTitle>
          <Link to="/dashboard/anggaran">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <PencilLine className="size-3.5" />
              Atur anggaran
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.allCount} kategori ·{" "}
          {overCategories.length > 0
            ? `${overCategories.length} sudah lewat`
            : nearCategories.length > 0
              ? `${nearCategories.length} hampir mentok`
              : "Semua masih aman"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Sudah terpakai
          </span>
          <span className="text-2xl font-display font-extrabold text-expense">
            {formatRupiah(totalSpent)}
          </span>
          <span className="text-sm text-muted-foreground">
            dari {formatRupiah(totalBudget)} jatah
          </span>
        </div>

        {totalRemaining < 0 ? (
          <div className="clay-sunken rounded-xl border-destructive/20 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-sm font-bold text-destructive">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              Kelewat {formatRupiah(Math.abs(totalRemaining))}
            </p>
          </div>
        ) : totalRemaining <= totalBudget * 0.1 ? (
          <div className="clay-sunken rounded-xl border-amber-500/20 bg-amber-500/5 p-3">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Hampir mentok — sisa {formatRupiah(totalRemaining)}
            </p>
          </div>
        ) : (
          <div className="clay-sunken rounded-xl border-border/40 bg-card p-3">
            <p className="text-sm font-medium text-muted-foreground">
              Sisa {formatRupiah(totalRemaining)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Per kategori
          </p>
          {biggest.map((item) => {
            const pct = item.amount > 0 ? Math.round((item.spent / item.amount) * 100) : 0;
            const overstated = item.spent > item.amount;
            const status = overstated
              ? "over"
              : item.spent >= item.amount * 0.8
                ? "near"
                : "safe";
            const statusInfo = STATUS_LABEL[status];
            return (
              <div key={item._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.category}</span>
                  <span className="text-muted-foreground">
                    {formatRupiah(item.spent)} / {formatRupiah(item.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-full bg-muted/40" style={{ height: 6 }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(100, pct) / 100 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={overstated ? "bg-destructive" : "bg-primary"}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${statusInfo.className}`}>
                    {statusInfo.label} {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {topUnbudgeted.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Tanpa jatah
            </p>
            <div className="space-y-1">
              {topUnbudgeted.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-amber-500">{item.category}</span>
                  <span className="text-muted-foreground">
                    {formatRupiah(item.spent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
