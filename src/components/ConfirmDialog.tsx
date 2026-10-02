import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { TriangleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  /** Label tombol utama. */
  confirmLabel?: string;
  /** Label tombol batal. */
  cancelLabel?: string;
  /** `destructive` untuk aksi yang menghapus/meninggalkan. */
  tone?: "default" | "destructive";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Dialog konfirmasi yang dipanggil dari mana saja:
 *
 * ```ts
 * const confirm = useConfirm();
 * if (await confirm({ title: "Hapus catatan?", tone: "destructive" })) { ... }
 * ```
 *
 * Mengembalikan `Promise<boolean>`, jadi penanggil cukup `await` dan tidak
 * perlu manage state `open` per dialog di tiap komponen.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((next) => {
    // Kalau ada dialog yang belum selesai, jawab yang lama dengan "batal"
    // supaya tidak ada `await` yang menggantung selamanya.
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const destructive = options?.tone === "destructive";

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <SlideUpDialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="clay-sunken mb-2 grid size-12 place-items-center rounded-2xl">
              <TriangleAlert
                className={
                  destructive
                    ? "size-5 text-destructive"
                    : "size-5 text-primary"
                }
              />
            </div>
            <DialogTitle className="font-display text-xl">
              {options?.title ?? ""}
            </DialogTitle>
            {options?.description && (
              <DialogDescription>{options.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => settle(false)}
            >
              {options?.cancelLabel ?? "Batal"}
            </Button>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? "Ya, lanjut"}
            </Button>
          </DialogFooter>
        </SlideUpDialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/** Hook pemicu dialog konfirmasi. Aman dipanggil di event handler. */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error(
      "useConfirm() harus dipakai di dalam <ConfirmProvider>.",
    );
  }
  return confirm;
}

export default ConfirmProvider;