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
import type { AiDraft } from "@/convex/ai";
import type { Id } from "@/convex/_generated/dataModel";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { formatRupiah, fromDateInput, toDateInput } from "@/lib/format";
import { useSaveTracker } from "@/lib/save-status";
import type { CategoryRow, WalletRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface EditableTransaction {
  _id: Id<"transactions">;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_at: number;
  wallet_id: Id<"wallets"> | null;
}

/**
 * Satu sesi mencatat/mengubah. Dibuat di event handler (bukan saat render)
 * supaya tanggal hari ini bisa dihitung tanpa memanggil fungsi impure saat
 * render. `key` naik tiap sesi baru sehingga form di bawah bisa me-remount
 * dengan nilai awal yang segar — tanpa perlu effect reset.
 */
export interface EditorSession {
  key: number;
  mode: "new" | "edit";
  /** `YYYY-MM-DD` untuk transaksi baru tanpa draf. */
  today: string;
  transaction: EditableTransaction | null;
  draft: AiDraft | null;
}

type TxType = "income" | "expense";

const QUICK_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];
const NO_WALLET = "none";

const EMPTY_SESSION: EditorSession = {
  key: 0,
  mode: "new",
  today: "",
  transaction: null,
  draft: null,
};

function TransactionForm({
  session,
  bookId,
  wallets,
  categories,
  onOpenChange,
}: {
  session: EditorSession;
  bookId: Id<"books">;
  wallets: WalletRow[];
  categories: CategoryRow[];
  onOpenChange: (open: boolean) => void;
}) {
  const editing = session.transaction;
  const isEdit = session.mode === "edit" && editing !== null;
  const initial = editing ?? session.draft;

  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);
  const save = useSaveTracker();

  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [walletId, setWalletId] = useState<string>(
    initial?.wallet_id ?? wallets[0]?._id ?? NO_WALLET,
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [dateValue, setDateValue] = useState(
    initial ? toDateInput(initial.occurred_at) : session.today,
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const suggestions = categories
    .filter((item) => item.type === type)
    .map((item) => item.name);
  const datalist = suggestions.length
    ? suggestions
    : [...(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)];

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
        occurred_at: fromDateInput(dateValue),
        wallet_id:
          walletId === NO_WALLET ? undefined : (walletId as Id<"wallets">),
      };
      if (editing) {
        await save(() => updateTransaction({ id: editing._id, ...payload }));
        toast.success("Catatanmu sudah diperbarui.");
      } else {
        await save(() => createTransaction({ bookId, ...payload }));
        toast.success("Tersimpan! Catatanmu sudah masuk.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Catatannya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await save(() => removeTransaction({ id: editing._id }));
      toast.success("Catatan sudah dihapus.");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Catatannya gagal dihapus.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit ? "Ubah catatan" : "Catat uang"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui detail catatan ini."
            : session.draft
              ? "AI sudah mengisi drafnya. Cek dulu, baru simpan ya."
              : "Isi nominalnya dulu, sisanya bisa menyusul."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="clay-sunken grid grid-cols-2 gap-2 p-2">
          {(
            [
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={cn(
                "rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                type === option.value
                  ? option.value === "expense"
                    ? "bg-expense text-white"
                    : "bg-income text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-amount">Nominal (Rp)</Label>
          <RupiahInput
            id="tx-amount"
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-category">Kategori</Label>
          <Input
            id="tx-category"
            list="tx-category-options"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Pilih atau tulis kategori"
            maxLength={40}
          />
          <datalist id="tx-category-options">
            {datalist.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-note">Catatan</Label>
          <Input
            id="tx-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="mis. kopi pagi di warung"
            maxLength={200}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-date">Tanggal</Label>
          <Input
            id="tx-date"
            type="date"
            value={dateValue}
            onChange={(event) => setDateValue(event.target.value)}
          />
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
            <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan ini akan hilang dan tidak bisa dikembalikan lagi.
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

/**
 * Selalu ter-mount (walau tertutup) supaya animasi keluar bottom sheet tetap
 * jalan. Tiap sesi baru me-remount `TransactionForm` lewat `key`, jadi nilai
 * awalnya selalu segar tanpa effect reset.
 */
export function TransactionDialog({
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
  session: EditorSession | null;
}) {
  const active = session ?? EMPTY_SESSION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent>
        <TransactionForm
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
