import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { ClayPageLoader } from "@/components/ClayLoader";
import { GlobalErrorListener } from "@/components/GlobalErrorListener";
import { GuestOnly } from "@/components/GuestOnly";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { ThemeProvider } from "next-themes";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { registerServiceWorker } from "@/lib/service-worker";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: (m as any).Dashboard ?? (m as any).default })));
const Ledger = lazy(() => import("./pages/dashboard/Ledger.tsx"));
const Transactions = lazy(() => import("./pages/dashboard/Transactions.tsx"));
const Reports = lazy(() => import("./pages/dashboard/Reports.tsx"));
const Partner = lazy(() => import("./pages/dashboard/Partner.tsx"));
const Activity = lazy(() => import("./pages/dashboard/Activity.tsx"));
const Profile = lazy(() => import("./pages/dashboard/Profile.tsx"));
const Wallet = lazy(() => import("./pages/dashboard/Wallet.tsx"));
const Budget = lazy(() => import("./pages/dashboard/Budget.tsx"));
const Goals = lazy(() => import("./pages/dashboard/Goals.tsx"));
const Savings = lazy(() => import("./pages/dashboard/Savings.tsx"));
const NetWorth = lazy(() => import("./pages/dashboard/NetWorth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminPage = lazy(() => import("./pages/admin.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return <ClayPageLoader label="Menyiapkan halaman..." />;
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <RouteSyncer />
          <GlobalErrorListener />
          <ConnectionBanner />
          <ConfirmProvider>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <GuestOnly redirectTo="/dashboard">
                      <Landing />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/auth"
                  element={<AuthPage redirectAfterAuth="/dashboard" />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth
                      title="Masuk untuk membuka kantongmu"
                      description="Catatan uangmu tersimpan rapi di dalam. Cukup masuk sebentar, lalu lanjut mencatat."
                    >
                      <Dashboard />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Ledger />} />
                  <Route path="dompet" element={<Wallet />} />
                  <Route path="anggaran" element={<Budget />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="tabungan" element={<Savings />} />
                  <Route path="net-worth" element={<NetWorth />} />
                  <Route path="rekap" element={<Reports />} />
                  <Route path="riwayat" element={<Transactions />} />
                  <Route path="riwayat/aktivitas" element={<Activity />} />
                  <Route path="partner" element={<Partner />} />
                  <Route path="profil" element={<Profile />} />
                </Route>
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<RouteLoading />}>
                      <AdminPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ConfirmProvider>
        </BrowserRouter>
        <Toaster />
        </ThemeProvider>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

// Register service worker for offline support
registerServiceWorker();
