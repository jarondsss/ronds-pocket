import {
  CategoryDialog,
  type CategorySession,
} from "@/components/dashboard/CategoryDialog";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { RupiahInput } from "@/components/RupiahInput";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import {
  categoryEmoji,
  categoryTone,
  toneBackground,
} from "@/lib/categories";
import { WRITE_DEBOUNCE_MS, useDebouncedCallback } from "@/lib/debounce";
import { formatRupiah, monthRange, toMonthKey } from "@/lib/format";
import { toneValue } from "@/lib/palette";
import { useSaveTracker } from "@/lib/save-status";
import type { CategoryRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ChartPie,
  Loader2,
  PencilLine,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function BudgetRow({
  bookId,
  category,
  color,
  amount,
  budgetId,
  spent,
}: {
  bookId: Id<"books">;
  category: string;
  color: string;
  amount: number;
  budgetId: Id<"budgets"> | null;
  spent: number;
}) {
  const setAmount = useMutation(api.budgets.setAmount);
  const removeBudget = useMutation(api.budgets.remove);
  const save = useSaveTracker();
  const [value, setValue] = useState(amount);
  const [syncedAmount, setSyncedAmount] = useState(amount);

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
        toast.error(
          error instanceof Error
            ? error.message
            : "Anggarannya gagal disimpan.",
        );
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
    <li className="clay p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-2xl text-lg"
            style={{ backgroundColor: toneBackground(color) }}
          >
            {categoryEmoji(category)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{category}</span>
            <span className="block text-xs text-muted-foreground">
              Terpakai {formatRupiah(spent)}
              {target > 0 && ` dari ${formatRupiah(target)}`}
            </span>
          </span>
        </span>
        <div className="flex items-center gap-2 sm:w-44">
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
      </div>

      <div className="clay-sunken mt-3 h-2.5 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, target > 0 ? 3 : 0)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            backgroundColor: over
              ? "var(--destructive)"
              : toneValue(color),
          }}
        />
      </div>

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
}: {
  bookId: Id<"books">;
  categories: CategoryRow[];
}) {
  const removeCategory = useMutation(api.categories.remove);
  const save = useSaveTracker();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<CategorySession | null>(null);
  const sessionKey = useRef(0);

  // Sesi dibuat di event handler supaya form selalu mulai bersih tiap dibuka.
  const startCategorySession = (category: CategoryRow | null) => {
    sessionKey.current += 1;
    setSession({
      key: sessionKey.current,
      category,
      defaultType: category?.type ?? "expense",
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
    <section className="clay p-4 sm:p-5">
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
              Tambah atau ubah warna kategorinya kapan saja.
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
        session={session ?? { key: 0, category: null, defaultType: "expense" }}
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
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Anggaran
        </h1>
        <p className="text-sm text-muted-foreground">
          Pasang batas per kategori, biar uangnya tidak bocor diam-diam.
        </p>
      </header>

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="clay-sm p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total anggaran
              </p>
              <p className="mt-1 font-display text-lg font-extrabold">
                {formatRupiah(data.totalBudget)}
              </p>
            </div>
            <div className="clay-sm p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Terpakai
              </p>
              <p className="mt-1 font-display text-lg font-extrabold text-expense">
                {formatRupiah(data.totalSpent)}
              </p>
            </div>
            <div className="clay-sm col-span-2 p-4 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sisa
              </p>
              <p
                className={cn(
                  "mt-1 font-display text-lg font-extrabold",
                  remaining < 0 ? "text-destructive" : "text-income",
                )}
              >
                {formatRupiah(remaining)}
              </p>
            </div>
          </div>

          {data.overspent > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <ShieldAlert className="size-4 shrink-0" />
              {data.overspent} kategori sudah lewat anggaran bulan ini.
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="font-display text-base font-extrabold">
              Anggaran per kategori
            </h3>
            {rows.length === 0 ? (
              <p className="clay rounded-3xl px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada anggaran. Isi nominalnya di daftar bawah untuk mulai.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {rows.map((row) => (
                  <BudgetRow
                    key={row._id}
                    bookId={bookId}
                    category={row.category}
                    color={row.color}
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
                    color={row.color ?? categoryTone(row.category)}
                    amount={0}
                    budgetId={null}
                    spent={row.spent}
                  />
                ))}
              </ul>
            </section>
          )}

          <CategoryShelf bookId={bookId} categories={categoryRows} />
        </>
      )}
    </div>
  );
}
