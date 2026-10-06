import { ChoiceChips } from "@/components/dashboard/ChoiceChips";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { Loader2 } from "@/components/icons";
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
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { LiabilityRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

const KIND_OPTIONS = [
  { value: "utang", label: "Utang", icon: "📉" },
  { value: "piutang", label: "Piutang", icon: "📈" },
] as const;

/**
 * Satu sesi membuat/mengubah utang atau piutang. Seperti dialog lain, sesinya
 * dibuat di event handler supaya tanggal hari ini dihitung di tempat yang aman.
 */
export interface LiabilitySession {
  key: number;
  liability: LiabilityRow | null;
  /** `YYYY-MM-DD` untuk catatan baru. */
  today: string;
}

function LiabilityForm({
  session,
  bookId,
  onOpenChange,
}: {
  session: LiabilitySession;
  bookId: Id<"books">;
  onOpenChange: (open: boolean) => void;
}) {
  const liability = session.liability;
  const isEdit = liability !== null;
  const createLiability = useMutation(api.netWorth.create);
  const updateLiability = useMutation(api.netWorth.update);
  const save = useSaveTracker();

  const [kind, setKind] = useState<"utang" | "piutang">(
    liability?.kind ?? "utang",
  );
  const [name, setName] = useState(liability?.name ?? "");
  const [counterparty, setCounterparty] = useState(
    liability?.counterparty ?? "",
  );
  const [balance, setBalance] = useState(liability?.balance ?? 0);
  const [dueDate, setDueDate] = useState(() =>
    liability?.due_date ? toDateInput(liability.due_date) : "",
  );
  const [note, setNote] = useState(liability?.note ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Beri nama catatannya dulu ya.");
      return;
    }
    const cleanCounterparty = counterparty.trim();
    if (!cleanCounterparty) {
      toast.error(
        kind === "utang"
          ? "Isi dulu ke siapa utangnya."
          : "Isi dulu siapa yang berhutang ke kamu.",
      );
      return;
    }
    if (balance <= 0) {
      toast.error("Nominalnya harus lebih dari 0 ya.");
      return;
    }
    setSaving(true);
    try {
      const due = dueDate ? fromDateInput(dueDate) : undefined;
      if (liability) {
        await save(() =>
          updateLiability({
            id: liability._id,
            name: cleanName,
            counterparty: cleanCounterparty,
            balance,
            dueDate: due,
            note,
          }),
        );
        toast.success("Catatannya sudah diperbarui.");
      } else {
        await save(() =>
          createLiability({
            bookId,
            kind,
            name: cleanName,
            counterparty: cleanCounterparty,
            balance,
            dueDate: due,
            note,
          }),
        );
        toast.success(
          kind === "utang"
            ? "Utang barunya sudah dicatat."
            : "Piutang barunya sudah dicatat.",
        );
      }
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Catatannya gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit
            ? "Ubah catatan"
            : kind === "utang"
              ? "Catat utang"
              : "Catat piutang"}
        </DialogTitle>
        <DialogDescription>
          Utang menurunkan kekayaan bersihmu, piutang menaikkannya. Keduanya
          sama-sama kelihatan di satu halaman.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <Label>Jenis catatan</Label>
            <ChoiceChips
              options={KIND_OPTIONS}
              value={kind}
              onChange={setKind}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="liability-name">Namanya</Label>
          <Input
            id="liability-name"
            value={name}
            maxLength={60}
            placeholder={
              kind === "utang" ? "Cicilan laptop" : "Nabung bareng Rani"
            }
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="liability-party">
            {kind === "utang" ? "Ke siapa" : "Siapa yang berhutang"}
          </Label>
          <Input
            id="liability-party"
            value={counterparty}
            maxLength={60}
            placeholder={kind === "utang" ? "Toko Bangunan Jaya" : "Rani"}
            onChange={(event) => setCounterparty(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="liability-balance">Nominalnya</Label>
          <RupiahInput
            id="liability-balance"
            value={balance}
            onChange={setBalance}
          />
        </div>

        <DatePicker
          id="liability-due"
          label="Jatuh tempo (opsional)"
          value={dueDate}
          onChange={setDueDate}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="liability-note">Catatan (opsional)</Label>
          <Input
            id="liability-note"
            value={note}
            maxLength={120}
            placeholder="Cicilan ke-3 dari 12"
            onChange={(event) => setNote(event.target.value)}
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
    </>
  );
}

export function LiabilityDialog({
  open,
  onOpenChange,
  bookId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  session: LiabilitySession | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        {session && (
          <LiabilityForm
            key={session.key}
            session={session}
            bookId={bookId}
            onOpenChange={onOpenChange}
          />
        )}
      </SlideUpDialogContent>
    </Dialog>
  );
}
