import { useAuth } from "@/hooks/use-auth";
import { useConvexConnectionState } from "convex/react";
import { useEffect, useState } from "react";

/**
 * Kalau browser tidak pernah berhasil membuka websocket ke deployment Convex,
 * layar cuma menampilkan loader selamanya tanpa penjelasan. Banner ini muncul
 * setelah beberapa detik tanpa koneksi supaya penyebabnya kelihatan: deployment
 * yang dijeda (paused) atau jaringan yang mati.
 *
 * `hasEverConnected` dipakai sebagai gerbang supaya banner tidak muncul lagi
 * saat koneksi sempat hidup lalu putus sebentar.
 */
export function ConnectionBanner() {
  const { isLoading } = useAuth();
  const { isWebSocketConnected, hasEverConnected } = useConvexConnectionState();
  const stalled = !isWebSocketConnected && !hasEverConnected;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!stalled) return;
    const timer = window.setTimeout(() => setShow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [stalled]);

  if (!show || !stalled) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md"
    >
      <div className="clay-sm flex items-start gap-3 bg-card p-4">
        <span
          aria-hidden
          className="mt-0.5 size-2.5 shrink-0 rounded-full bg-destructive"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {isLoading
              ? "Masih menyambung ke server"
              : "Server tidak terjangkau"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isLoading
              ? "Kalau layar ini tidak berubah, URL database di tab Keys kemungkinan menunjuk ke deployment yang sedang dijeda (paused)."
              : "Periksa koneksi internetmu, lalu coba lagi."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  );
}