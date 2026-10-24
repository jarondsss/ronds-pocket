import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useConvexAuth } from "convex/react";

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
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
