import { Button } from "@/components/ui/button";
import {
  monthKeyLabel,
  shiftMonthKey,
  toMonthKey,
} from "@/lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function MonthNavigator({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (monthKey: string) => void;
}) {
  // Snapshot bulan berjalan diambil sekali saat mount (initializer useState
  // adalah tempat yang legal untuk memanggil fungsi impure seperti Date.now).
  const [currentKey] = useState(() => toMonthKey(Date.now()));
  const isCurrent = monthKey === currentKey;

  return (
    <div className="clay-sm flex items-center justify-between gap-2 p-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Bulan sebelumnya"
        onClick={() => onChange(shiftMonthKey(monthKey, -1))}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <button
        type="button"
        className="font-display text-sm font-extrabold tracking-tight text-foreground sm:text-base"
        onClick={() => onChange(currentKey)}
        title="Kembali ke bulan ini"
      >
        {monthKeyLabel(monthKey)}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        disabled={isCurrent}
        aria-label="Bulan berikutnya"
        onClick={() => onChange(shiftMonthKey(monthKey, 1))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
