import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** Jeda antar gumpalan supaya pantulannya berurutan, bukan serempak. */
const DELAYS = [0, 0.13, 0.26];

/**
 * Loader bertema clay: tiga gumpalan yang memantul lalu mengempis saat
 * mendarat. Dipakai untuk halaman penuh (`ClayPageLoader`) maupun untuk satu
 * bagian yang masih menunggu data.
 *
 * Geraknya digerakkan Framer Motion, bukan keyframe CSS, karena blok
 * `prefers-reduced-motion` di index.css membekukan semua animasi CSS — di
 * preview/embedded webviewanimasi seperti itu ikut mati, padahal indikator
 * memuat tetap perlu terlihat bergerak.
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
        {DELAYS.map((delay) => (
          <motion.span
            key={delay}
            animate={{ y: [0, -8, 0, 0], scaleX: [1, 0.94, 1.14, 1] }}
            transition={{
              duration: 1.15,
              delay,
              ease: EASE,
              repeat: Infinity,
              times: [0, 0.22, 0.4, 1],
            }}
          />
        ))}
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
