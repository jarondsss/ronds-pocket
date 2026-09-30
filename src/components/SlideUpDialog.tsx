import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Modal yang muncul meluncur dari bawah di HP (bottom sheet) dan tetap jadi
 * dialog tengah di layar lebar. Aturan animasinya ada di index.css.
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
