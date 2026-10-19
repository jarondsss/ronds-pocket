import { Button } from "@/components/ui/button";
import { formatShortDate, shiftDay, startOfDay } from "@/lib/format";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { useState } from "react";

const weekdayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

export function DayNavigator({
  day,
  onChange,
}: {
  day: number;
  onChange: (day: number) => void;
}) {
  // Snapshot hari ini diambil sekali saat mount, sama seperti MonthNavigator.
  const [today] = useState(() => startOfDay(Date.now()));
  const isToday = day === today;
  const isYesterday = day === shiftDay(today, -1);

  const label = isToday
    ? "Hari ini"
    : isYesterday
      ? "Kemarin"
      : weekdayFormat.format(day);

  return (
    <div className="clay-sm flex items-center justify-between gap-2 p-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Hari sebelumnya"
        onClick={() => onChange(shiftDay(day, -1))}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <button
        type="button"
        className="min-w-0 text-center"
        onClick={() => onChange(today)}
        title="Kembali ke hari ini"
      >
        <span className="block font-display text-sm font-extrabold tracking-tight text-foreground sm:text-base">
          {label}
        </span>
        <span className="block text-[11px] font-semibold text-muted-foreground">
          {formatShortDate(day)}
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        disabled={isToday}
        aria-label="Hari berikutnya"
        onClick={() => onChange(shiftDay(day, 1))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
