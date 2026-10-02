import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";

/**
 * Untuk halaman publik (landing). Kalau ternyata user sudah masuk, langsung
 * arahkan ke dashboard supaya tidak perlu lewat beranda dulu setiap kali
 * membuka aplikasi.
 */
export function GuestOnly({
  children,
  redirectTo = "/dashboard",
}: {
  children: ReactNode;
  /** Halaman tujuan kalau user sudah punya sesi. */
  redirectTo?: string;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}