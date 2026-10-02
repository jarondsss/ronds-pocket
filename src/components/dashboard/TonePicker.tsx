import { TONES } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { Check } from "@/components/icons";

export function TonePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => {
        const active = tone.key === value;
        return (
          <button
            key={tone.key}
            type="button"
            aria-label={tone.label}
            aria-pressed={active}
            title={tone.label}
            onClick={() => onChange(tone.key)}
            style={{ backgroundColor: tone.value }}
            className={cn(
              "grid size-9 place-items-center rounded-2xl transition-transform",
              active
                ? "scale-110 ring-2 ring-foreground/40 ring-offset-2 ring-offset-card"
                : "hover:scale-105",
            )}
          >
            {active && <Check className="size-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
