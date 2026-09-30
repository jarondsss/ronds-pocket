import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

/**
 * Baris chip pilihan (bisa berisi ikon). Dipakai untuk daftar pilihan yang
 * muat dalam satu/dua baris, mis. tipe dompet atau jenis tabungan.
 * Nilai terpilih ditandai dengan warna primary, sama seperti pilihan lain.
 */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  iconOnly = false,
  className,
}: {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Tampilkan cuma ikonnya, dalam kotak persegi (mis. pemilih ikon dompet). */
  iconOnly?: boolean;
  className?: string;
}) {
  if (iconOnly) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              title={option.label}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "clay-sm clay-press grid size-10 place-items-center rounded-2xl text-lg transition-colors",
                active
                  ? "ring-2 ring-primary/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.icon}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "clay-sm clay-press flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.icon && <span className="text-sm">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type ChipTone = "primary" | "income" | "expense";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Warna saat terpilih: primary (violet), income (mint), expense (peach). */
  tone?: ChipTone;
}

/**
 * Toggle bersegmen di dalam cekungan clay: Pengeluaran/Pemasukan, Setor/Tarik,
 * filter Semua/Keluar/Masuk, dan semacamnya. Lebar tiap segmen sama.
 */
export function SegmentedChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("clay-sunken grid gap-2 p-2", className)}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        const tone = option.tone ?? "primary";
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl px-2 py-2.5 text-xs font-bold leading-tight transition-colors sm:text-sm",
              active
                ? tone === "expense"
                  ? "bg-expense text-white"
                  : tone === "income"
                    ? "bg-income text-white"
                    : "clay-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
