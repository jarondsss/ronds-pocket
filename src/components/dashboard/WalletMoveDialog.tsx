import {
  SegmentedChips,
  type SegmentedOption,
} from "@/components/dashboard/ChoiceChips";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { WalletRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

export type MoveMode = "transfer" | "add" | "subtract";

const MODES: (SegmentedOption<MoveMode> & { hint: string })[] = [
  {
    value: "transfer",
    label: "Pindah dompet",
    hint: "Memindahkan uang dari satu dompet ke dompet lain.",
  },
  {
    value: "add",
    label: "Tambah saldo",
    tone: "income",
    hint: "Menambah uang dari luar, misalnya temuan atau utang dibayar.",
  },
  {
    value: "subtract",
    label: "Kurangi saldo",
    tone: "expense",
    hint: "Mengurangi saldo tanpa masuk catatan pengeluaran.",
  },
];

/**
 * Satu sesi atur saldo. Dibuat di event handler (dengan dompet awal yang
 * sudah disiapkan) supaya tidak perlu effect reset saat dialog dibuka.
 */
export interface MoveSession {
  key: number;
  mode: MoveMode;
  /** Dompet terpilih saat sesi dibuka; `null` kalau belum ada dompet. */
  from: Id<"wallets"> | null;
  to: Id<"wallets"> | null;
  today: string;
}

function MoveForm({
  session,
  bookId,
  wallets,
  onOpenChange,
}: {
  session: MoveSession;
  bookId: Id<"books">;
  wallets: WalletRow[];
  onOpenChange: (open: boolean) => void;
}) {
  const transfer = useMutation(api.wallets.transfer);
  const save = useSaveTracker();

  const [mode, setMode] = useState<MoveMode>(session.mode);
  const [from, setFrom] = useState(session.from ?? "");
  const [to, setTo] = useState(session.to ?? session.from ?? "");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [dateValue, setDateValue] = useState(session.today);
  const [saving, setSaving] = useState(false);

  const activeMode = MODES.find((item) => item.value === mode) ?? MODES[0];

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
            mode === "subtract"
              ? undefined
              : (to as Id<"wallets">) || undefined,
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
      toastError(error, "Perubahannya gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          Atur saldo dompet
        </DialogTitle>
        <DialogDescription>{activeMode.hint}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <SegmentedChips
          options={MODES.map(({ value, label, tone }) => ({
            value,
            label,
            tone,
          }))}
          value={mode}
          onChange={setMode}
        />

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

        <DatePicker
          id="move-date"
          label="Tanggal"
          value={dateValue}
          onChange={setDateValue}
        />
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
    </>
  );
}

export function WalletMoveDialog({
  open,
  onOpenChange,
  bookId,
  wallets,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  wallets: WalletRow[];
  session: MoveSession;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <MoveForm
          key={session.key}
          session={session}
          bookId={bookId}
          wallets={wallets}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
