import { SavingsDialog } from "@/components/dashboard/SavingsDialog";
import { SegmentedChips } from "@/components/dashboard/ChoiceChips";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
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
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import {
  formatRupiah,
  formatShortDate,
  fromDateInput,
  toDateInput,
} from "@/lib/format";
import { savingKindOf } from "@/lib/palette";
import { useSaveTracker } from "@/lib/save-status";
import type { SavingsRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  History,
  Loader2,
  PencilLine,
  PiggyBank,
  Plus,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function MoveDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingsRow | null;
}) {
  const deposit = useMutation(api.savings.deposit);
  const withdraw = useMutation(api.savings.withdraw);
  const save = useSaveTracker();

  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(0);
  const [dateValue, setDateValue] = useState(toDateInput(Date.now()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDirection("deposit");
    setAmount(0);
    setDateValue(toDateInput(Date.now()));
  }, [open]);

  const handleSubmit = async () => {
    if (!account) return;
    if (amount <= 0) {
      toast.error("Isi nominalnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: account._id,
        amount,
        occurred_at: fromDateInput(dateValue),
      };
      await save(() =>
        direction === "deposit" ? deposit(payload) : withdraw(payload),
      );
      toast.success(
        direction === "deposit"
          ? "Setorannya sudah tercatat."
          : "Penarikannya sudah tercatat.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Catatannya gagal disimpan.",
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
            {account ? account.name : "Tabungan"}
          </DialogTitle>
          <DialogDescription>
            Saldo saat ini {account ? formatRupiah(account.balance) : "-"}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <SegmentedChips
            options={[
              { value: "deposit", label: "Setor", tone: "income" },
              { value: "withdraw", label: "Tarik", tone: "expense" },
            ]}
            value={direction}
            onChange={setDirection}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="savings-amount">Nominal</Label>
            <RupiahInput
              id="savings-amount"
              value={amount}
              onChange={setAmount}
            />
          </div>

          <DatePicker
            id="savings-date"
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
      </SlideUpDialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingsRow | null;
}) {
  const entries = useQuery(
    api.savings.entries,
    account ? { savingsId: account._id } : "skip",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Riwayat {account?.name ?? "tabungan"}
          </DialogTitle>
          <DialogDescription>
            Semua setoran dan penarikan yang pernah dicatat.
          </DialogDescription>
        </DialogHeader>

        {entries === undefined ? (
          <div className="grid min-h-[20vh] place-items-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="clay-sunken rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada setoran atau penarikan.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="clay-sunken flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-bold">
                    {entry.type === "deposit" ? "Setoran" : "Penarikan"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatShortDate(entry.occurred_at)}
                  </span>
                </span>
                <span
                  className={cn(
                    "font-display text-sm font-extrabold",
                    entry.type === "deposit" ? "text-income" : "text-expense",
                  )}
                >
                  {entry.type === "deposit" ? "+" : "−"}
                  {formatRupiah(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SlideUpDialogContent>
    </Dialog>
  );
}

export default function Savings() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;

  const data = useQuery(api.savings.list, bookId ? { bookId } : "skip");
  const removeAccount = useMutation(api.savings.remove);
  const save = useSaveTracker();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsRow | null>(null);
  const [moving, setMoving] = useState<SavingsRow | null>(null);
  const [historyFor, setHistoryFor] = useState<SavingsRow | null>(null);
  const [deleting, setDeleting] = useState<SavingsRow | null>(null);

  if (!activeBook || !bookId) return null;

  const accounts = data?.accounts ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Tabungan
          </h1>
          <p className="text-sm text-muted-foreground">
            Deposito, reksa dana, emas — catat semuanya beserta bunganya.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tabungan baru
        </Button>
      </header>

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="clay flex flex-col items-center gap-3 p-8 text-center">
          <span className="clay-sunken grid size-16 place-items-center rounded-3xl">
            <PiggyBank className="size-7 text-muted-foreground" />
          </span>
          <p className="font-display text-lg font-extrabold">
            Belum ada tabungan
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tambahkan deposito, reksa dana, atau emas. Isi bunga per tahunnya
            supaya kelihatan hasilnya setahun ke depan.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="clay-primary clay-press mt-2 px-5 py-2.5 text-sm font-bold"
          >
            Tambah tabungan
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="clay-sm p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total tabungan
              </p>
              <p className="mt-1 font-display text-xl font-extrabold">
                {formatRupiah(data.total)}
              </p>
            </div>
            <div className="clay-sm p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="size-3.5 text-income" />
                Potensi bunga setahun
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-income">
                {formatRupiah(data.potentialInterest)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((account, index) => {
              const kind = savingKindOf(account.kind);
              return (
                <motion.article
                  key={account._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="clay flex flex-col gap-3 p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-xl">
                      {kind.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-extrabold">
                        {account.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {kind.label}
                        </span>
                        {account.interest_rate > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="size-3" />
                            {account.interest_rate}% / tahun
                          </span>
                        )}
                      </span>
                    </span>
                  </div>

                  <div>
                    <p className="font-display text-xl font-extrabold">
                      {formatRupiah(account.balance)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>Saldo awal {formatRupiah(account.principal)}</span>
                      {account.deposited > 0 && (
                        <span>Setoran {formatRupiah(account.deposited)}</span>
                      )}
                      {account.withdrawn > 0 && (
                        <span>Penarikan {formatRupiah(account.withdrawn)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatShortDate(account.started_at)}
                      </span>
                    </div>
                    {account.yearlyInterest > 0 && (
                      <p className="mt-2 text-xs font-semibold text-income">
                        Setahun lagi jadi {formatRupiah(account.projected)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => setMoving(account)}
                    >
                      <Plus className="size-4" />
                      Setor / tarik
                    </Button>
                    <button
                      type="button"
                      aria-label={`Riwayat ${account.name}`}
                      onClick={() => setHistoryFor(account)}
                      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
                    >
                      <History className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Ubah ${account.name}`}
                      onClick={() => {
                        setEditing(account);
                        setFormOpen(true);
                      }}
                      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
                    >
                      <PencilLine className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${account.name}`}
                      onClick={() => setDeleting(account)}
                      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </>
      )}

      <SavingsDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bookId={bookId}
        account={editing}
      />
      <MoveDialog
        open={moving !== null}
        onOpenChange={(open) => {
          if (!open) setMoving(null);
        }}
        account={moving}
      />
      <HistoryDialog
        open={historyFor !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryFor(null);
        }}
        account={historyFor}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus tabungan {deleting?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Semua riwayat setoran dan penarikannya ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (!deleting) return;
                const target = deleting;
                setDeleting(null);
                void save(() => removeAccount({ id: target._id }))
                  .then(() => toast.success("Tabungannya sudah dihapus."))
                  .catch(() => toast.error("Tabungannya gagal dihapus."));
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
