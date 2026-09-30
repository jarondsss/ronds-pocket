import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { TonePicker } from "@/components/dashboard/TonePicker";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSaveTracker } from "@/lib/save-status";
import type { WalletRow } from "@/lib/types";
import { WALLET_TYPES, walletTypeOf } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function WalletFormDialog({
  open,
  onOpenChange,
  bookId,
  wallet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  wallet?: WalletRow | null;
}) {
  const isEdit = Boolean(wallet);
  const createWallet = useMutation(api.wallets.create);
  const updateWallet = useMutation(api.wallets.update);
  const removeWallet = useMutation(api.wallets.remove);
  const save = useSaveTracker();

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [icon, setIcon] = useState(walletTypeOf("cash").icon);
  const [color, setColor] = useState("mint");
  const [opening, setOpening] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setIcon(wallet.icon);
      setColor(wallet.color);
      setOpening(wallet.opening_balance);
    } else {
      setName("");
      setType("cash");
      setIcon(walletTypeOf("cash").icon);
      setColor("mint");
      setOpening(0);
    }
  }, [open, wallet]);

  const handleType = (next: string) => {
    setType(next);
    setIcon(walletTypeOf(next).icon);
  };

  const handleSubmit = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama dompetnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      if (wallet) {
        await save(() =>
          updateWallet({
            id: wallet._id,
            name: clean,
            type,
            icon,
            color,
            opening_balance: opening,
          }),
        );
        toast.success("Dompetnya sudah diperbarui.");
      } else {
        await save(() =>
          createWallet({
            bookId,
            name: clean,
            type,
            icon,
            color,
            opening_balance: opening,
          }),
        );
        toast.success("Dompet barunya sudah siap.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Dompetnya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!wallet) return;
    setSaving(true);
    try {
      await save(() => removeWallet({ id: wallet._id }));
      toast.success("Dompetnya sudah dihapus.");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Dompetnya gagal dihapus.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <SlideUpDialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {isEdit ? "Ubah dompet" : "Dompet baru"}
            </DialogTitle>
            <DialogDescription>
              Tempat uangmu disimpan, misalnya Tunai atau rekening bank.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wallet-name">Nama dompet</Label>
              <Input
                id="wallet-name"
                value={name}
                maxLength={40}
                placeholder="BCA"
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tipe dompet</Label>
              <div className="flex flex-wrap gap-2">
                {WALLET_TYPES.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleType(option.key)}
                    className={cn(
                      "clay-sm clay-press flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors",
                      type === option.key
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="text-sm">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Ikon</Label>
              <div className="flex flex-wrap gap-2">
                {WALLET_TYPES.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-label={option.label}
                    onClick={() => setIcon(option.icon)}
                    className={cn(
                      "clay-sm clay-press grid size-10 place-items-center rounded-2xl text-lg",
                      icon === option.icon && "ring-2 ring-primary/60",
                    )}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Warna</Label>
              <TonePicker value={color} onChange={setColor} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="wallet-opening">Saldo awal</Label>
              <RupiahInput
                id="wallet-opening"
                value={opening}
                onChange={setOpening}
              />
              <p className="text-xs text-muted-foreground">
                Isi kalau dompet ini sudah ada isinya. Boleh dikosongkan.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </SlideUpDialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dompet ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan transaksi yang pernah masuk ke dompet ini tetap ada, tapi
              saldonya tidak lagi ikut dihitung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={saving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
