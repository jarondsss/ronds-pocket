import { useConfirm } from "@/components/ConfirmDialog";
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
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { CategoryCombobox } from "@/components/dashboard/CategoryCombobox";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { SegmentedChips } from "@/components/dashboard/ChoiceChips";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRupiah, fromDateInput, toDateInput } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import type { CategoryRow, WalletRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

type TxType = "income" | "expense";
type Frequency = "daily" | "weekly" | "monthly" | "yearly";

const NO_WALLET = "none";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

const QUICK_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];

export interface EditableRecurring {
  _id: Id<"recurring_transactions">;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  frequency: Frequency;
  next_due: number;
  enabled: boolean;
  wallet_id: Id<"wallets"> | undefined | null;
}

export interface RecurringEditorSession {
  key: number;
  mode: "new" | "edit";
  today: string;
  recurring: EditableRecurring | null;
}

const EMPTY_SESSION: RecurringEditorSession = {
  key: 0,
  mode: "new",
  today: "",
  recurring: null,
};

function RecurringForm({
  session,
  bookId,
  wallets,
  categories,
  onOpenChange,
}: {
  session: RecurringEditorSession;
  bookId: Id<"books">;
  wallets: WalletRow[];
  categories: CategoryRow[];
  onOpenChange: (open: boolean) => void;
}) {
  const editing = session.recurring;
  const isEdit = session.mode === "edit" && editing !== null;

  const createRecurring = useMutation(api.recurring.create);
  const updateRecurring = useMutation(api.recurring.update);
  const removeRecurring = useMutation(api.recurring.remove);

  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [category, setCategory] = useState(editing?.category ?? "");
  const [walletId, setWalletId] = useState<string>(
    editing?.wallet_id ?? wallets[0]?._id ?? NO_WALLET,
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [frequency, setFrequency] = useState<Frequency>(
    editing?.frequency ?? "monthly",
  );
  const [dateValue, setDateValue] = useState(
    editing ? toDateInput(editing.next_due) : session.today,
  );
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const confirm = useConfirm();

  const options = categories
    .filter((item) => item.type === type)
    .map((item) => item.name);

  const handleTypeChange = (next: TxType) => {
    if (next === type) return;
    setType(next);
    setCategory("");
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Nominalnya harus lebih dari 0 ya.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        amount,
        category: category.trim(),
        note: note.trim(),
        frequency,
        next_due: fromDateInput(dateValue),
        wallet_id:
          walletId === NO_WALLET ? undefined : (walletId as Id<"wallets">),
      };
      if (editing) {
        await updateRecurring({ id: editing._id, ...payload, enabled });
        toast.success("Transaksi berulang diperbarui.");
      } else {
        await createRecurring({ bookId, ...payload });
        toast.success("Transaksi berulang ditambahkan.");
      }
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Gagal menyimpan transaksi berulang.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await confirm({
      title: "Hapus transaksi berulang ini?",
      description:
        "Transaksi yang sudah dibuat sebelumnya tidak akan terhapus.",
      confirmLabel: "Ya, hapus",
      tone: "destructive",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await removeRecurring({ id: editing._id });
      toast.success("Transaksi berulang dihapus.");
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Gagal menghapus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit ? "Ubah berulang" : "Transaksi berulang"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui detail transaksi berulang ini."
            : "Buat template yang otomatis tercatat sesuai jadwal."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <SegmentedChips
          options={[
            { value: "expense", label: "Pengeluaran", tone: "expense" },
            { value: "income", label: "Pemasukan", tone: "income" },
          ]}
          value={type}
          onChange={handleTypeChange}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-amount">Nominal (Rp)</Label>
          <RupiahInput
            id="rec-amount"
            value={amount}
            onChange={setAmount}
            size="lg"
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(amount + value)}
                className="clay-sm clay-press px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
              >
                +{value / 1000}rb
              </button>
            ))}
            {amount > 0 && (
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="px-2 py-1.5 text-xs font-bold text-muted-foreground underline decoration-dotted hover:text-destructive"
              >
                kosongkan
              </button>
            )}
          </div>
          {amount > 0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              {formatRupiah(amount)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Frekuensi</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Dompet</Label>
          <Select value={walletId} onValueChange={setWalletId}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Pilih dompet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_WALLET}>Tanpa dompet</SelectItem>
              {wallets.map((wallet) => (
                <SelectItem key={wallet._id} value={wallet._id}>
                  <span className="mr-1.5">{wallet.icon}</span>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CategoryCombobox
          id="rec-category"
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={options}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-note">Catatan</Label>
          <Input
            id="rec-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="mis. bayar listrik bulanan"
            maxLength={200}
          />
        </div>

        <DatePicker
          id="rec-start"
          label="Mulai tanggal"
          value={dateValue}
          onChange={setDateValue}
        />

        {isEdit && (
          <div className="flex items-center justify-between">
            <Label htmlFor="rec-enabled">Aktif</Label>
            <button
              id="rec-enabled"
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {isEdit ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleDelete()}
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
    </>
  );
}

export function RecurringDialog({
  open,
  onOpenChange,
  bookId,
  wallets,
  categories,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  wallets: WalletRow[];
  categories: CategoryRow[];
  session: RecurringEditorSession | null;
}) {
  const active = session ?? EMPTY_SESSION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="max-h-[88dvh] overflow-y-auto">
        <RecurringForm
          key={active.key}
          session={active}
          bookId={bookId}
          wallets={wallets}
          categories={categories}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
