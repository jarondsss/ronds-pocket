import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Modal form untuk semua halaman: selalu di tengah layar (desktop maupun HP),
 * di HP hanya dibatasi tinggi agar form panjang bisa di-scroll. Aturan
 * animasinya ada di index.css.
 */
export function SlideUpDialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent className={cn("sheet-up", className)} {...props}>
      {children}
    </DialogContent>
  );
}
