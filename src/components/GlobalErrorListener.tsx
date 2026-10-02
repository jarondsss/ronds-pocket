import { toast } from "sonner";
import { useEffect } from "react";

/**
 * Menangkap error yang lolos dari semua `catch`: rejected promise tanpa
 * penanganan, dan exception di dalam event handler. Tanpa ini, error seperti
 * ini cuma diam di console dan user mengira tombolnya tidak berfungsi.
 */
export function GlobalErrorListener() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      toast.error("Ada yang gagal di belakang layar. Coba ulangi aksinya ya.");
      console.error("[Ronds Pocket] Unhandled rejection:", event.reason);
    };

    const onError = (event: ErrorEvent) => {
      toast.error("Terjadi kesalahan di halaman ini. Coba lagi ya.");
      console.error("[Ronds Pocket] Window error:", event.error ?? event.message);
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}

export default GlobalErrorListener;