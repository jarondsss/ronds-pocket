import { cn } from "@/lib/utils";

/**
 * Loader bertema clay: tiga gumpalan yang memantul lalu mengempis saat
 * mendarat. Dipakai untuk halaman penuh (`ClayPageLoader`) maupun untuk satu
 * bagian yang masih menunggu data.
 */
export function ClayLoader({
  label,
  className,
}: {
  /** Teks pendek di bawah gumpalan. Kosongkan kalau tidak perlu. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <span className="clay-loader" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {label ? (
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}

/** Loader satu layar penuh untuk halaman yang belum siap dirender. */
export function ClayPageLoader({ label = "Sebentar ya..." }: { label?: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none fixed -left-32 -top-32 size-96 rounded-full bg-primary/18 blur-3xl"
      />
      <div className="clay relative px-8 py-7">
        <ClayLoader label={label} />
      </div>
    </main>
  );
}
