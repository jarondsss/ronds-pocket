import { categoryEmoji, toneFor } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import { toneValue } from "@/lib/palette";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface CategorySlice {
  category: string;
  total: number;
  /** Tone key dari kategori yang dipilih pengguna, kalau ada. */
  color?: string | null;
}

function sliceColor(slice: CategorySlice) {
  return slice.color ? toneValue(slice.color) : toneFor(slice.category);
}

export function CategoryChart({
  title,
  subtitle,
  slices,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  slices: CategorySlice[];
  emptyLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <section className="clay p-4 sm:p-5">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-extrabold">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <span className="font-display text-sm font-extrabold text-muted-foreground">
          {formatRupiah(total)}
        </span>
      </header>

      {slices.length === 0 ? (
        <p className="clay-sunken mt-4 px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <>
          <div className="relative mx-auto mt-3 h-52 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="62%"
                  outerRadius="94%"
                  paddingAngle={3}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.category} fill={sliceColor(slice)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total
                </p>
                <p className="font-display text-base font-extrabold">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {slices.slice(0, 6).map((slice, index) => {
              const percent = total > 0 ? (slice.total / total) * 100 : 0;
              return (
                <motion.li
                  key={slice.category}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-base">
                    {categoryEmoji(slice.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold">
                        {slice.category || "Tanpa kategori"}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-muted-foreground">
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="clay-sunken mt-1.5 h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(percent, 4)}%`,
                          backgroundColor: sliceColor(slice),
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold">
                    {formatRupiah(slice.total)}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
