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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import {
  formatNumber,
  formatRupiah,
  fromDateInput,
  toDateInput,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface EditableTransaction {
  _id: Id<"transactions">;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_at: number;
}

type TxType = "income" | "expense";

const QUICK_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];

function firstCategory(type: TxType) {
  return type === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0];
}

export function TransactionDialog({
  open,
  onOpenChange,
  bookId,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  transaction?: EditableTransaction | null;
}) {
  const isEdit = Boolean(transaction);
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);

  const [type, setType] = useState<TxType>("expense");
  const [digits, setDigits] = useState("");
  const [category, setCategory] = useState<string>(firstCategory("expense"));
  const [note, setNote] = useState("");
  const [dateValue, setDateValue] = useState(toDateInput(Date.now()));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setType(transaction.type);
      setDigits(`${transaction.amount}`);
      setCategory(transaction.category || firstCategory(transaction.type));
      setNote(transaction.note ?? "");
      setDateValue(toDateInput(transaction.occurred_at));
    } else {
      setType("expense");
      setDigits("");
      setCategory(firstCategory("expense"));
      setNote("");
      setDateValue(toDateInput(Date.now()));
    }
  }, [open, transaction]);

  const amount = Number(digits || "0");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (next: TxType) => {
    if (next === type) return;
    setType(next);
    setCategory(firstCategory(next));
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Nominal harus lebih dari 0.");
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
      };
      if (transaction) {
        await updateTransaction({ id: transaction._id, ...payload });
        toast.success("Transaksi diperbarui.");
      } else {
        await createTransaction({ bookId, ...payload });
        toast.success("Transaksi tersimpan.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setSaving(true);
    try {
      await removeTransaction({ id: transaction._id });
      toast.success("Transaksi dihapus.");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus transaksi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {isEdit ? "Ubah transaksi" : "Catat transaksi"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Perbarui detail catatan ini."
                : "Isi nominal, kategori, dan tanggal transaksi."}
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
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="tx-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={digits ? formatNumber(Number(digits)) : ""}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/\D/g, "");
                    setDigits(raw.replace(/^0+(?=\d)/, "").slice(0, 12));
                  }}
                  className="h-14 pl-11 font-display text-2xl font-extrabold"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setDigits(`${(Number(digits || "0") + value).toString()}`)
                    }
                    className="clay-sm clay-press px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
                  >
                    +{formatNumber(value)}
                  </button>
                ))}
                {digits && (
                  <button
                    type="button"
                    onClick={() => setDigits("")}
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
                {categories.map((item) => (
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
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <motion.span whileTap={{ scale: 0.96 }}>Simpan</motion.span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Catatan akan hilang dari buku
              kas untuk kamu dan partner.
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
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Ya, hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
