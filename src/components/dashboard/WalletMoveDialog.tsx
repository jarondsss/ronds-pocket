import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput, toDateInput } from "@/lib/format";
import { useSaveTracker } from "@/lib/save-status";
import type { WalletRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type MoveMode = "transfer" | "add" | "subtract";

const MODES: { key: MoveMode; label: string; hint: string }[] = [
  {
    key: "transfer",
    label: "Pindah dompet",
    hint: "Memindahkan uang dari satu dompet ke dompet lain.",
  },
  {
    key: "add",
    label: "Tambah saldo",
    hint: "Menambah uang dari luar, misalnya temuan atau utang dibayar.",
  },
  {
    key: "subtract",
    label: "Kurangi saldo",
    hint: "Mengurangi saldo tanpa masuk catatan pengeluaran.",
  },
];

export function WalletMoveDialog({
  open,
  onOpenChange,
  bookId,
  wallets,
  initialMode = "transfer",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  wallets: WalletRow[];
  initialMode?: MoveMode;
}) {
  const transfer = useMutation(api.wallets.transfer);
  const save = useSaveTracker();

  const [mode, setMode] = useState<MoveMode>(initialMode);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [dateValue, setDateValue] = useState(toDateInput(Date.now()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setAmount(0);
    setNote("");
    setDateValue(toDateInput(Date.now()));
    setFrom(wallets[0]?._id ?? "");
    setTo(wallets[1]?._id ?? wallets[0]?._id ?? "");
  }, [open, initialMode, wallets]);

  const activeMode = MODES.find((item) => item.key === mode) ?? MODES[0];

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Isi nominalnya dulu ya.");
      return;
    }
    if (mode === "transfer" && (!from || !to)) {
      toast.error("Pilih dompet asal dan tujuannya dulu ya.");
      return;
    }
    if (mode === "transfer" && from === to) {
      toast.error("Dompet asal dan tujuannya tidak boleh sama.");
      return;
    }

    setSaving(true);
    try {
      await save(() =>
        transfer({
          bookId,
          from_wallet_id:
            mode === "add" ? undefined : (from as Id<"wallets">) || undefined,
          to_wallet_id:
            mode === "subtract" ? undefined : (to as Id<"wallets">) || undefined,
          amount,
          note,
          occurred_at: fromDateInput(dateValue),
        }),
      );
      toast.success(
        mode === "transfer"
          ? "Uangnya sudah pindah dompet."
          : mode === "add"
            ? "Saldo dompetnya sudah ditambah."
            : "Saldo dompetnya sudah dikurangi.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Perubahannya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Atur saldo dompet
          </DialogTitle>
          <DialogDescription>{activeMode.hint}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="clay-sunken grid grid-cols-3 gap-1.5 p-1.5">
            {MODES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
                className={cn(
                  "rounded-2xl px-2 py-2 text-[11px] font-bold transition-colors sm:text-xs",
                  mode === item.key
                    ? "clay-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode !== "add" && (
            <div className="flex flex-col gap-2">
              <Label>Dari dompet</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet._id} value={wallet._id}>
                      <span className="mr-1.5">{wallet.icon}</span>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode !== "subtract" && (
            <div className="flex flex-col gap-2">
              <Label>Ke dompet</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet._id} value={wallet._id}>
                      <span className="mr-1.5">{wallet.icon}</span>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="move-amount">Nominal</Label>
            <RupiahInput
              id="move-amount"
              value={amount}
              onChange={setAmount}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="move-note">Catatan</Label>
            <Input
              id="move-note"
              value={note}
              maxLength={120}
              placeholder="mis. tarik tunai di ATM"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="move-date">Tanggal</Label>
            <Input
              id="move-date"
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </SlideUpDialogContent>
    </Dialog>
  );
}
