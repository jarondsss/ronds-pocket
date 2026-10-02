import { ChoiceChips } from "@/components/dashboard/ChoiceChips";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { TonePicker } from "@/components/dashboard/TonePicker";
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
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WALLET_TYPES, walletTypeOf } from "@/lib/palette";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { WalletRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TYPE_OPTIONS = WALLET_TYPES.map((option) => ({
  value: option.key,
  label: option.label,
  icon: option.icon,
}));

const ICON_OPTIONS = WALLET_TYPES.map((option) => ({
  value: option.icon,
  label: option.label,
  icon: option.icon,
}));

/**
 * Satu sesi membuat/mengubah dompet. Dibuat di event handler dan di-remount
 * lewat `key`, jadi tidak perlu effect reset.
 */
export interface WalletFormSession {
  key: number;
  wallet: WalletRow | null;
}

function WalletForm({
  session,
  bookId,
  onOpenChange,
}: {
  session: WalletFormSession;
  bookId: Id<"books">;
  onOpenChange: (open: boolean) => void;
}) {
  const wallet = session.wallet;
  const isEdit = wallet !== null;
  const createWallet = useMutation(api.wallets.create);
  const updateWallet = useMutation(api.wallets.update);
  const removeWallet = useMutation(api.wallets.remove);
  const save = useSaveTracker();

  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState(wallet?.type ?? "cash");
  const [icon, setIcon] = useState(wallet?.icon ?? walletTypeOf("cash").icon);
  const [color, setColor] = useState(wallet?.color ?? "mint");
  const [opening, setOpening] = useState(wallet?.opening_balance ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      toastError(error, "Dompetnya gagal disimpan.");
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
      toastError(error, "Dompetnya gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
          <ChoiceChips
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleType}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Ikon</Label>
          <ChoiceChips
            options={ICON_OPTIONS}
            value={icon}
            onChange={setIcon}
            iconOnly
          />
          <p className="text-xs text-muted-foreground">
            Ganti tipe biasanya mengganti ikonnya juga, tapi ikon bebas kamu
            ubah lagi di sini.
          </p>
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

export function WalletFormDialog({
  open,
  onOpenChange,
  bookId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  session: WalletFormSession;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <WalletForm
          key={session.key}
          session={session}
          bookId={bookId}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
