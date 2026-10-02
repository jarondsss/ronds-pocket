import { Button } from "@/components/ui/button";
import { toastError } from "@/lib/error-message";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  error: Error | null;
}

/**
 * Batas error supaya satu halaman rusak tidak membuat seluruh app kosong.
 * Sekalian memberi tahu user lewat toast, karena halaman yang tampil setelah
 * crash biasanya cuma-this saja (tidak ada lagi tombol "coba lagi" di layar).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Ronds Pocket] Terjadi kesalahan:", error, info.componentStack);
    toastError(error, "Ada yang tidak beres di halaman ini.");
  }

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <div className="clay flex flex-col items-center gap-3 p-8 text-center">
        <span className="clay-sunken grid size-14 place-items-center rounded-3xl">
          <TriangleAlert className="size-6 text-expense" />
        </span>
        <p className="font-display text-lg font-extrabold">
          {this.props.title ?? "Ada yang tidak beres di halaman ini"}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Tenang, catatanmu aman. Coba muat ulang bagian ini.
        </p>
        <pre className="max-h-32 w-full overflow-auto rounded-2xl bg-secondary/60 p-3 text-left text-[10px] leading-4 text-muted-foreground">
          {error.message}
        </pre>
        <Button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-1"
        >
          <RotateCcw className="size-4" />
          Coba lagi
        </Button>
      </div>
    );
  }
}