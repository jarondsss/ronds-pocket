import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { Download } from "@/components/icons";
import { useState } from "react";

/**
 * Gambar QRIS disimpan sebagai file statis di `public/`. Beberapa nama dicoba
 * berurutan supaya cukup menaruh filenya di `public/` tanpa menyamakan nama
 * persis: kalau yang pertama tidak ada, otomatis pindah ke kandidat berikutnya.
 */
const QRIS_CANDIDATES = [
  "/qris-ronds-pocket.png",
  "/qris-ronds-pocket.jpg",
  "/qris-ronds-pocket.jpeg",
  "/qris-ronds-pocket.webp",
  "/assets/qris-ronds-pocket.png",
  "/assets/qris-ronds-pocket.jpg",
];

/**
 * Donasi lewat QRIS: satu gambar QR untuk semua bank/e-wallet, jadi tidak perlu
 * memilih metode. Kalau gambarnya belum ada di `public/`, dialog tetap terbuka
 * dengan keterangan singkat supaya tombolnya tidak jadi jalan buntu.
 */
export function DonateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const src = QRIS_CANDIDATES[srcIndex];
  const imageBroken = src === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Dukung Ronds Pocket
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block font-bold text-foreground">
              Berapapun kontribusimu akan membuat Ronds Pocket ada selamanya.
            </span>
            <span className="block">Semoga makin banyak rejeki ya kak ❤️</span>
          </DialogDescription>
        </DialogHeader>

        <div className="clay-sunken flex flex-col items-center gap-3 p-3">
          {imageBroken ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="text-3xl">🧾</span>
              <p className="text-sm font-bold">Gambar QRIS belum siap</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Coba buka lagi sebentar ya. Kalau masih kosong, kabari kami
                lewat tombol Masukan.
              </p>
            </div>
          ) : (
            <img
              src={src}
              alt="Kode QRIS Ronds Pocket, Digital & Kreatif untuk donasi"
              onError={() => setSrcIndex((index) => index + 1)}
              className="max-h-64 w-auto max-w-full rounded-2xl bg-white object-contain"
            />
          )}

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Scan pakai aplikasi bank atau e-wallet apa saja. Merchant: RONDS
            POCKET, DIGITAL & KREATIF.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {imageBroken ? (
            <span />
          ) : (
            <a
              href={src}
              download="qris-ronds-pocket.png"
              className="clay-sm clay-press flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <Download className="size-4" />
              Simpan QRIS
            </a>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </SlideUpDialogContent>
    </Dialog>
  );
}
