import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import {
  formatRupiah,
  monthRange,
  monthShortLabel,
  shiftMonthKey,
  toMonthKey,
} from "@/lib/format";
import { useQuery } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INCOME_COLOR = "oklch(0.62 0.15 168)";
const EXPENSE_COLOR = "oklch(0.66 0.17 42)";

export default function Reports() {
  const { activeBook } = useBooks();
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const bookId = activeBook?._id;
  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const summary = useQuery(
    api.transactions.summary,
    bookId ? { bookId, ...range } : "skip",
  );
  const all = useQuery(
    api.transactions.list,
    bookId ? { bookId } : "skip",
  );

  const trend = useMemo(() => {
    const rows = all ?? [];
    const currentKey = toMonthKey(Date.now());
    return Array.from({ length: 6 }, (_, index) =>
      shiftMonthKey(currentKey, index - 5),
    ).map((key) => {
      const { from, to } = monthRange(key);
      let income = 0;
      let expense = 0;
      for (const row of rows) {
        if (row.occurred_at < from || row.occurred_at >= to) continue;
        if (row.type === "income") income += row.amount;
        else expense += row.amount;
      }
      return { label: monthShortLabel(key), income, expense };
    });
  }, [all]);

  const highlight = useMemo(() => {
    const rows = (all ?? []).filter(
      (row) => row.occurred_at >= range.from && row.occurred_at < range.to,
    );
    const biggest = rows.reduce<null | (typeof rows)[number]>(
      (max, row) =>
        row.type === "expense" && (!max || row.amount > max.amount) ? row : max,
      null,
    );
    const average = rows.length
      ? Math.round(
          rows
            .filter((row) => row.type === "expense")
            .reduce((sum, row) => sum + row.amount, 0) /
            Math.max(
              1,
              new Set(
                rows
                  .filter((row) => row.type === "expense")
                  .map((row) => new Date(row.occurred_at).getDate()),
              ).size,
            ),
        )
      : 0;
    return { biggest, average, count: rows.length };
  }, [all, range.from, range.to]);

  if (!activeBook || !bookId) return null;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Rekap uangmu
        </h1>
        <p className="text-sm text-muted-foreground">
          Lihat ke mana uangmu pergi bulan ini.
        </p>
      </header>

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      {summary === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="clay p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-extrabold">
                  Tren enam bulan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Masuk dan keluar, dari bulan ke bulan
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: INCOME_COLOR }}
                  />
                  Masuk
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: EXPENSE_COLOR }}
                  />
                  Keluar
                </span>
              </div>
            </div>
            <div className="mt-3 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} barGap={4}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 8"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)", radius: 12 }}
                    formatter={(value) => formatRupiah(Number(value))}
                    contentStyle={{
                      borderRadius: 16,
                      border: "none",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      boxShadow: "0 10px 24px rgba(94, 71, 168, 0.25)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill={INCOME_COLOR}
                    radius={[8, 8, 8, 8]}
                    maxBarSize={16}
                  />
                  <Bar
                    dataKey="expense"
                    fill={EXPENSE_COLOR}
                    radius={[8, 8, 8, 8]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <CategoryChart
            title="Pengeluaran per kategori"
            subtitle="Bulan yang dipilih"
            slices={summary.expenseByCategory}
            emptyLabel="Belum ada pengeluaran bulan ini. Mantap! 🎉"
          />

          <CategoryChart
            title="Pemasukan per kategori"
            subtitle="Bulan yang dipilih"
            slices={summary.incomeByCategory}
            emptyLabel="Belum ada pemasukan tercatat bulan ini."
          />

          <section className="clay p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/40 text-accent-foreground">
                <Sparkles className="size-4" />
              </span>
              <h3 className="font-display text-base font-extrabold">
                Sorotan bulan ini
              </h3>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="clay-sunken rounded-2xl px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jumlah catatan
                </dt>
                <dd className="mt-1 font-display text-lg font-extrabold">
                  {highlight.count}
                </dd>
              </div>
              <div className="clay-sunken rounded-2xl px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Rata-rata harian
                </dt>
                <dd className="mt-1 font-display text-lg font-extrabold">
                  {formatRupiah(highlight.average)}
                </dd>
              </div>
              <div className="clay-sunken rounded-2xl px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pengeluaran terbesar
                </dt>
                <dd className="mt-1 truncate font-display text-lg font-extrabold">
                  {highlight.biggest
                    ? formatRupiah(highlight.biggest.amount)
                    : "—"}
                </dd>
                {highlight.biggest && (
                  <p className="truncate text-xs text-muted-foreground">
                    {highlight.biggest.category || "Tanpa kategori"}
                  </p>
                )}
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
