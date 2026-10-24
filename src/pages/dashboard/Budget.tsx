import {
  AppPageHeader,
  AppSummaryCard,
} from "@/components/dashboard/AppPageHeader";
import {
  CategoryDialog,
  type CategorySession,
} from "@/components/dashboard/CategoryDialog";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { RupiahInput } from "@/components/RupiahInput";
import { ClayLoader } from "@/components/ClayLoader";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import { WRITE_DEBOUNCE_MS, useDebouncedCallback } from "@/lib/debounce";
import { toastError } from "@/lib/error-message";
import {
  formatRupiah,
  monthKeyLabel,
  monthRange,
  toMonthKey,
} from "@/lib/format";
import { toneValue } from "@/lib/palette";
import { useSaveTracker } from "@/lib/save-status";
import type { CategoryRow } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { EASE } from "@/lib/motion";
import { motion } from "framer-motion";
import {
  ChartPie,
  PencilLine,
  Plus,
  ShieldAlert,
  Trash2,
  TriangleAlert,
} from "@/components/icons";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function BudgetRow({
  bookId,
  category,
  amount,
  budgetId,
  spent,
}: {
  bookId: Id<"books">;
  category: string;
  amount: number;
  budgetId: Id<"budgets"> | null;
  spent: number;
}) {
  const setAmount = useMutation(api.budgets.setAmount);
  const removeBudget = useMutation(api.budgets.remove);
  const save = useSaveTracker();
  const [value, setValue] = useState(amount);
  const [syncedAmount, setSyncedAmount] = useState(amount);
  const [editing, setEditing] = useState(false);

  // Ikuti perubahan anggaran dari server tanpa effect (pola "adjust state
  // saat render" dari React: set state hanya kalau props-nya memang berubah).
  if (syncedAmount !== amount) {
    setSyncedAmount(amount);
    setValue(amount);
  }

  // Tulis ke server 600 ms setelah berhenti mengetik.
  const commit = useDebouncedCallback((next: number) => {
    if (next <= 0) return;
    void save(() => setAmount({ bookId, category, amount: next })).catch(
      (error: unknown) => {
        toastError(error, "Anggarannya gagal disimpan.");
      },
    );
  }, WRITE_DEBOUNCE_MS);

  const handleChange = (next: number) => {
    setValue(next);
    commit(next);
  };

  const target = value > 0 ? value : amount;
  const percent = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
  const over = target > 0 && spent > target;

  return (
    <li className="border-b border-border/70 p-4 last:border-b-0 sm:p-5">
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        aria-expanded={editing}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="truncate text-sm font-bold">{category}</span>
        <span
          className={
            over
              ? "text-sm font-bold text-destructive"
              : "text-sm font-bold text-primary"
          }
        >
          {Math.round(percent)}%
        </span>
      </button>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, target > 0 ? 3 : 0)}%` }}
          transition={{ duration: 0.4, ease: EASE }}
          className="h-full rounded-full"
          style={{
            backgroundColor: over ? "var(--destructive)" : "var(--primary)",
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatRupiah(spent)} dari{" "}
        {target > 0 ? formatRupiah(target) : "belum diatur"}
      </p>
      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <RupiahInput
            value={value}
            onChange={handleChange}
            placeholder="Belum diatur"
            className="h-10"
          />
          {budgetId && (
            <button
              type="button"
              aria-label={`Hapus anggaran ${category}`}
              onClick={() => {
                void save(() => removeBudget({ id: budgetId }))
                  .then(() => toast.success("Anggarannya sudah dihapus."))
                  .catch(() => toast.error("Anggarannya gagal dihapus."));
              }}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}

      {over && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-destructive">
          <ShieldAlert className="size-3.5" />
          Lewat {formatRupiah(spent - target)} dari anggaran
        </p>
      )}
    </li>
  );
}

function CategoryShelf({
  bookId,
  categories,
  budgets,
}: {
  bookId: Id<"books">;
  categories: CategoryRow[];
  budgets: { category: string; amount: number }[];
}) {
  const removeCategory = useMutation(api.categories.remove);
  const save = useSaveTracker();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<CategorySession | null>(null);
  const sessionKey = useRef(0);
  const budgetByCategory = useMemo(
    () => new Map(budgets.map((row) => [row.category, row.amount])),
    [budgets],
  );

  // Sesi dibuat di event handler supaya form selalu mulai bersih tiap dibuka.
  const startCategorySession = (category: CategoryRow | null) => {
    sessionKey.current += 1;
    setSession({
      key: sessionKey.current,
      category,
      defaultType: category?.type ?? "expense",
      budget: category ? (budgetByCategory.get(category.name) ?? 0) : 0,
    });
    setDialogOpen(true);
  };

  const groups = useMemo(
    () => [
      {
        type: "expense" as const,
        label: "Pengeluaran",
        items: categories.filter((item) => item.type === "expense"),
      },
      {
        type: "income" as const,
        label: "Pemasukan",
        items: categories.filter((item) => item.type === "income"),
      },
    ],
    [categories],
  );

  return (
    <section id="atur-anggaran" className="clay p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <ChartPie className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-extrabold">
              Kategori kamu
            </h3>
            <p className="text-xs text-muted-foreground">
              Tambah kategori, atur warna dan anggarannya sekaligus.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => startCategorySession(null)}
        >
          <Plus className="size-4" />
          Kategori baru
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.type}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.items.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Belum ada kategori.
                </span>
              ) : (
                group.items.map((item) => (
                  <span
                    key={item._id}
                    className="clay-sm flex items-center gap-1.5 py-1.5 pr-2 pl-2.5 text-xs font-semibold"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: toneValue(item.color) }}
                    />
                    {item.name}
                    {item.type === "expense" &&
                      (budgetByCategory.get(item.name) ?? 0) > 0 && (
                        <span className="rounded-full bg-income/15 px-1.5 py-0.5 text-[10px] font-bold text-income">
                          {formatRupiah(budgetByCategory.get(item.name) ?? 0)}
                        </span>
                      )}
                    <button
                      type="button"
                      aria-label={`Ubah ${item.name}`}
                      onClick={() => startCategorySession(item)}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <PencilLine className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${item.name}`}
                      onClick={() => {
                        void save(() => removeCategory({ id: item._id }))
                          .then(() =>
                            toast.success("Kategorinya sudah dihapus."),
                          )
                          .catch(() =>
                            toast.error("Kategorinya gagal dihapus."),
                          );
                      }}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookId={bookId}
        session={
          session ?? {
            key: 0,
            category: null,
            defaultType: "expense",
            budget: 0,
          }
        }
      />
    </section>
  );
}

export default function Budget() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const data = useQuery(
    api.budgets.list,
    bookId ? { bookId, ...range } : "skip",
  );
  const categories = useQuery(
    api.categories.list,
    bookId ? { bookId } : "skip",
  );

  if (!activeBook || !bookId) return null;

  const categoryRows: CategoryRow[] = categories ?? [];
  const rows = data?.budgets ?? [];
  const unbudgeted = data?.unbudgeted ?? [];
  const remaining = (data?.totalBudget ?? 0) - (data?.totalSpent ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader title="Anggaran" subtitle={monthKeyLabel(monthKey)} />

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Memuat anggaran..." />
        </div>
      ) : (
        <>
          <AppSummaryCard
            label="Sisa anggaran"
            value={
              <span className={remaining < 0 ? "text-destructive" : undefined}>
                {formatRupiah(remaining)}
              </span>
            }
            detail={`Terpakai ${formatRupiah(data.totalSpent)} dari ${formatRupiah(data.totalBudget)}`}
          >
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${data.totalBudget > 0 ? Math.min((data.totalSpent / data.totalBudget) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </AppSummaryCard>

          {data.overspent > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <ShieldAlert className="size-4 shrink-0" />
              {data.overspent} kategori sudah lewat anggaran bulan ini.
            </p>
          )}

          {data.nearLimit > 0 && data.overspent === 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <TriangleAlert className="size-4 shrink-0" />
              {data.nearLimit} kategori sudah mentok 80% anggarannya. Rem
              sedikit biar nggak kelewat.
            </p>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold">
                Jatah per kategori
              </h3>
              <a
                href="#atur-anggaran"
                className="min-h-11 px-2 text-sm font-bold text-primary"
              >
                Atur
              </a>
            </div>
            {rows.length === 0 ? (
              <p className="clay rounded-3xl px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada anggaran. Isi nominalnya di daftar bawah untuk mulai.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-[1.5rem] bg-card shadow-[0_14px_30px_-24px_var(--clay-dark)]">
                {rows.map((row) => (
                  <BudgetRow
                    key={row._id}
                    bookId={bookId}
                    category={row.category}
                    amount={row.amount}
                    budgetId={row._id}
                    spent={row.spent}
                  />
                ))}
              </ul>
            )}
          </section>

          {unbudgeted.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-display text-base font-extrabold">
                Belum dianggarkan
              </h3>
              <p className="text-xs text-muted-foreground">
                Kategori ini sudah kamu pakai bulan ini. Isi nominalnya kalau
                mau dibatasi.
              </p>
              <ul className="flex flex-col gap-3">
                {unbudgeted.map((row) => (
                  <BudgetRow
                    key={row.category}
                    bookId={bookId}
                    category={row.category}
                    amount={0}
                    budgetId={null}
                    spent={row.spent}
                  />
                ))}
              </ul>
            </section>
          )}

          <CategoryShelf
            bookId={bookId}
            categories={categoryRows}
            budgets={rows}
          />
        </>
      )}
    </div>
  );
}
