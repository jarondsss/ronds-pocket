import { cn } from "@/lib/utils";
import { Link } from "react-router";

/** Clay coin mark + wordmark for Buku Kas. */
export function Brand({
  to = "/",
  compact = false,
  className,
}: {
  to?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("group flex items-center gap-3", className)}
      aria-label="Buku Kas"
    >
      <span className="clay-primary clay-press grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-extrabold">
        Rp
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Buku Kas
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Catatan keuangan bersama
          </span>
        </span>
      )}
    </Link>
  );
}
