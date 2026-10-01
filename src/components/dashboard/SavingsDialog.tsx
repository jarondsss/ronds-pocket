import { ChoiceChips } from "@/components/dashboard/ChoiceChips";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput, toDateInput } from "@/lib/format";
import { SAVING_KINDS } from "@/lib/palette";
import { useSaveTracker } from "@/lib/save-status";
import type { SavingsRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const KIND_OPTIONS = SAVING_KINDS.map((kind) => ({
  value: kind.key,
  label: kind.label,
  icon: kind.icon,
}));

/**
 * Satu sesi membuat/mengubah tabungan, dibuat di event handler supaya tanggal
 * hari ini dihitung tanpa fungsi impure saat render.
 */
export interface SavingsSession {
  key: number;
  account: SavingsRow | null;
  /** `YYYY-MM-DD` untuk tabungan baru. */
  today: string;
}

function SavingsForm({
  session,
  bookId,
  onOpenChange,
}: {
  session: SavingsSession;
  bookId: Id<"books">;
  onOpenChange: (open: boolean) => void;
}) {
  const account = session.account;
  const isEdit = account !== null;
  const createSavings = useMutation(api.savings.create);
  const updateSavings = useMutation(api.savings.update);
  const save = useSaveTracker();

  const [name, setName] = useState(account?.name ?? "");
  const [kind, setKind] = useState(account?.kind ?? "umum");
  const [principal, setPrincipal] = useState(account?.principal ?? 0);
  const [rate, setRate] = useState(account ? `${account.interest_rate}` : "0");
  const [started, setStarted] = useState(() =>
    account ? toDateInput(account.started_at) : session.today,
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama tabungannya dulu ya.");
      return;
    }
    const interest = Number(rate.replace(",", "."));
    if (!Number.isFinite(interest) || interest < 0 || interest > 100) {
      toast.error("Bunganya diisi antara 0 sampai 100 persen ya.");
      return;
    }
    setSaving(true);
    try {
      if (account) {
        await save(() =>
          updateSavings({
            id: account._id,
            name: clean,
            kind,
            principal,
            interest_rate: interest,
            started_at: fromDateInput(started),
          }),
        );
        toast.success("Tabungannya sudah diperbarui.");
      } else {
        await save(() =>
          createSavings({
            bookId,
            name: clean,
            kind,
            principal,
            interest_rate: interest,
            started_at: fromDateInput(started),
          }),
        );
        toast.success("Tabungan barunya sudah dibuat.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Tabungannya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit ? "Ubah tabungan" : "Tabungan baru"}
        </DialogTitle>
        <DialogDescription>
          Deposito, reksa dana, emas, atau tabungan biasa — catat semuanya di
          satu tempat.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="savings-name">Nama tabungan</Label>
          <Input
            id="savings-name"
            value={name}
            maxLength={60}
            placeholder="Deposito BCA"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Jenis</Label>
          <ChoiceChips options={KIND_OPTIONS} value={kind} onChange={setKind} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="savings-principal">Saldo awal</Label>
          <RupiahInput
            id="savings-principal"
            value={principal}
            onChange={setPrincipal}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="savings-rate">Bunga per tahun (%)</Label>
          <Input
            id="savings-rate"
            inputMode="decimal"
            value={rate}
            placeholder="4.5"
            onChange={(event) =>
              setRate(event.target.value.replace(/[^\d.,]/g, ""))
            }
          />
          <p className="text-xs text-muted-foreground">
            Isi 0 kalau tabungannya tidak berbunga.
          </p>
        </div>

        <DatePicker
          id="savings-start"
          label="Mulai sejak"
          value={started}
          onChange={setStarted}
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

export function SavingsDialog({
  open,
  onOpenChange,
  bookId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  session: SavingsSession;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <SavingsForm
          key={session.key}
          session={session}
          bookId={bookId}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
