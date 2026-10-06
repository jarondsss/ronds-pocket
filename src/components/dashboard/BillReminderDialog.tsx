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
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { CategoryCombobox } from "@/components/dashboard/CategoryCombobox";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRupiah, fromDateInput, toDateInput } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import type { CategoryRow, WalletRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

interface BillReminder {
  _id: Id<"bill_reminders">;
  title: string;
  amount: number;
  category: string;
  due_date: number;
  remind_days_before: number;
  enabled: boolean;
  wallet_id?: Id<"wallets">;
}

export interface BillReminderSession {
  key: number;
  mode: "new" | "edit";
  today: string;
  reminder: BillReminder | null;
}

const EMPTY_SESSION: BillReminderSession = {
  key: 0,
  mode: "new",
  today: "",
  reminder: null,
};

const QUICK_DAYS_BEFORE = [1, 3, 7, 14];

interface BillReminderFormProps {
  session: BillReminderSession;
  bookId: Id<"books">;
  wallets: WalletRow[];
  categories: CategoryRow[];
  onOpenChange: (open: boolean) => void;
}

function BillReminderForm({
  session,
  bookId,
  wallets,
  categories,
  onOpenChange,
}: BillReminderFormProps) {
  const editing = session.reminder;
  const isEdit = session.mode === "edit" && editing !== null;

  const createReminder = useMutation(api.billReminders.create);
  const updateReminder = useMutation(api.billReminders.update);
  const toggleReminder = useMutation(api.billReminders.toggle);
  const removeReminder = useMutation(api.billReminders.remove);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [category, setCategory] = useState(editing?.category ?? "");
  const [walletId, setWalletId] = useState<string>(
    editing?.wallet_id ?? wallets[0]?._id ?? "none"
  );
  const [dueDate, setDueDate] = useState(
    editing ? toDateInput(editing.due_date) : session.today
  );
  const [remindDaysBefore, setRemindDaysBefore] = useState(
    editing?.remind_days_before ?? 3
  );
  const [saving, setSaving] = useState(false);
  const [enabledValue, setEnabledValue] = useState(editing?.enabled ?? true);

  const confirm = useConfirm();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Judul reminder tidak boleh kosong.");
      return;
    }
    if (amount <= 0) {
      toast.error("Nominal harus lebih dari 0.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim().slice(0, 100),
        amount: Math.floor(amount),
        category: category.trim().slice(0, 40),
        due_date: fromDateInput(dueDate),
        remind_days_before: remindDaysBefore,
      };
      if (isEdit && editing) {
        await updateReminder({ id: editing._id, ...payload });
        toast.success("Pengingat tagihan diperbarui.");
      } else {
        await createReminder({ bookId, ...payload });
        toast.success("Pengingat tagihan ditambahkan.");
      }
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Gagal menyimpan pengingat tagihan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await confirm({
      title: "Hapus pengingat tagihan ini?",
      description:
        "Data tagihan yang sudah ada tidak akan terhapus.",
      confirmLabel: "Ya, hapus",
      tone: "destructive",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await removeReminder({ id: editing._id });
      toast.success("Pengingat tagihan dihapus.");
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
          {isEdit ? "Ubah pengingat tagihan" : "Pengingat tagihan"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui detail pengingat tagihan ini."
            : "Tambahkan tagihan yang perlu diingatkan sebelumnya."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="br-title">Judul / Nama tagihan</Label>
          <Input
            id="br-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Listrik PLN, Internet, Sewa, dll."
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="br-amount">Nominal (Rp)</Label>
          <RupiahInput id="br-amount" value={amount} onChange={setAmount} size="lg" />
          {amount > 0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              {formatRupiah(amount)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="br-category">Kategori (opsional)</Label>
          <CategoryCombobox
            id="br-category"
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={categories
              .filter((item) => item.type === "expense")
              .map((item) => item.name)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="br-wallet">Dompet (opsional)</Label>
          <select
            id="br-wallet"
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="clay-sm h-11 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-ring/50"
          >
            <option value="none">Tanpa dompet</option>
            {wallets.map((wallet) => (
              <option key={wallet._id} value={wallet._id}>
                {wallet.icon && <span className="mr-1.5">{wallet.icon}</span>}
                {wallet.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="br-due">Tanggal jatuh tempo</Label>
          <DatePicker id="br-due" label="Tanggal jatuh tempo" value={dueDate} onChange={setDueDate} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Ingatkan berapa hari sebelum jatuh tempo?</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_DAYS_BEFORE.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRemindDaysBefore(days)}
                className={`clay-sm clay-press px-3 py-1.5 text-xs font-bold ${
                  remindDaysBefore === days
                    ? "clay-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {days === 1 ? "1 hari lagi" : `${days} hari lagi`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRemindDaysBefore(0)}
              className={`clay-sm clay-press px-3 py-1.5 text-xs font-bold ${
                remindDaysBefore === 0
                  ? "clay-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Tepat hari jatuh tempo
            </button>
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="br-enabled">Aktif</Label>
              <button
                id="br-enabled"
                type="button"
                role="switch"
                aria-checked={enabledValue}
                onClick={() => {
                  if (!editing) return;
                  setSaving(true);
                  toggleReminder({ id: editing._id })
                    .then(() => {
                      setEnabledValue(!enabledValue);
                      toast.success(
                        enabledValue ? "Pengingat dinonaktifkan." : "Pengingat diaktifkan."
                      );
                    })
                    .catch(() => toast.error("Gagal mengubah status."))
                    .finally(() => setSaving(false));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  enabledValue ? "bg-primary" : "bg-muted"
                }`}
                disabled={saving}
              >
                <span
                  className={`pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    enabledValue ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
              </Button>
            </div>
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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

export function BillReminderDialog({
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
  session: BillReminderSession | null;
}) {
  const active = session ?? EMPTY_SESSION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent>
        <BillReminderForm
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
