import { ArrowLeft } from "@/components/icons";
import { Link } from "react-router";

/**
 * Kembali ke Beranda. Sub-halaman selalu punya parent tunggal (/dashboard),
 * jadi back diarahkan ke sana, bukan navigate(-1) yang bisa keluar app
 * kalau halaman di-load langsung.
 */
export function BackToHome() {
  return (
    <Link
      to="/dashboard"
      aria-label="Kembali ke Beranda"
      className="clay-sm clay-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="size-4" />
    </Link>
  );
}