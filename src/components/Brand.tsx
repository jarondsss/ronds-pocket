import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

/** Logo + wordmark for Ronds Pocket. */
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
      aria-label="Ronds Pocket"
    >
      <span className="clay-primary grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl">
        <img
          src={logo}
          alt=""
          width={44}
          height={44}
          className="size-11"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Ronds Pocket
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Kantong kecil buat uangmu
          </span>
        </span>
      )}
    </Link>
  );
}
