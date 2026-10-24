import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_DIGITS = 12;

/** Input nominal rupiah: cuma angka, otomatis dipisah ribuan. */
export function RupiahInput({
  id,
  value,
  onChange,
  placeholder = "0",
  size = "md",
  className,
  showPrefix = true,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  size?: "md" | "lg";
  className?: string;
  showPrefix?: boolean;
}) {
  return (
    <div className="relative">
      {showPrefix && (
        <span
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground",
            size === "lg" ? "text-base" : "text-sm",
          )}
        >
          Rp
        </span>
      )}
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value > 0 ? formatNumber(value) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(Number(digits.slice(0, MAX_DIGITS)) || 0);
        }}
        className={cn(
          showPrefix ? "pl-11 font-semibold" : "pl-4 font-semibold",
          size === "lg" && "h-14 font-display text-2xl font-extrabold",
          className,
        )}
      />
    </div>
  );
}
