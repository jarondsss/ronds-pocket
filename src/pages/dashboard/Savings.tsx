import {
  AppPageHeader,
  AppSummaryCard,
} from "@/components/dashboard/AppPageHeader";
import {
  SavingsDialog,
  type SavingsSession,
} from "@/components/dashboard/SavingsDialog";
import { SegmentedChips } from "@/components/dashboard/ChoiceChips";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { useConfirm } from "@/components/ConfirmDialog";
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
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { SavingsRow } from "@/lib/types";
import { ClayLoader } from "@/components/ClayLoader";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  History,
  Loader2,
  PencilLine,
  PiggyBank,
  Plus,
  Trash2,
} from "@/components/icons";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Satu sesi setor/tarik, dibuat di event handler supaya tanggal hari ini
 * dihitung tanpa fungsi impure saat render dan form selalu mulai bersih.
 */
interface MoveSession {
  key: number;
  direction: "deposit" | "withdraw";
  today: string;
}

function MoveDialog({
  open,
  onOpenChange,
  session,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: MoveSession;
  account: SavingsRow | null;
}) {
  const deposit = useMutation(api.savings.deposit);
  const withdraw = useMutation(api.savings.withdraw);
  const save = useSaveTracker();

  const [direction, setDirection] = useState<"deposit" | "withdraw">(
    session.direction,
  );
  const [amount, setAmount] = useState(0);
  const [dateValue, setDateValue] = useState(session.today);
  const [saving, setSaving] = useState(false);

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
      toastError(error, "Catatannya gagal disimpan.");
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
            <ClayLoader label="Memuat catatan setoran..." />
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
  const [formSession, setFormSession] = useState<SavingsSession | null>(null);
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const [moving, setMoving] = useState<SavingsRow | null>(null);
  const [historyFor, setHistoryFor] = useState<SavingsRow | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    null,
  );

  const confirm = useConfirm();

  const handleDelete = async (account: SavingsRow) => {
    const ok = await confirm({
      title: `Hapus tabungan ${account.name}?`,
      description: "Semua riwayat setoran dan penarikannya ikut terhapus.",
      confirmLabel: "Ya, hapus",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await save(() => removeAccount({ id: account._id }));
      toast.success("Tabungannya sudah dihapus.");
    } catch (error) {
      toastError(error, "Tabungannya gagal dihapus.");
    }
  };
  const sessionKey = useRef(0);

  if (!activeBook || !bookId) return null;

  const accounts = data?.accounts ?? [];

  // Sesi dibuat di event handler: `Date.now()` boleh dipanggil di sini, dan
  // `key` yang naik bikin form di dialog ter-remount dengan nilai awal segar.
  const startForm = (account: SavingsRow | null) => {
    sessionKey.current += 1;
    setFormSession({
      key: sessionKey.current,
      account,
      today: toDateInput(Date.now()),
    });
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader title="Tabungan" subtitle="Simpan untuk hari nanti." />

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Memuat tabungan..." />
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
            onClick={() => startForm(null)}
            className="clay-primary clay-press mt-2 rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Tambah tabungan
          </button>
        </div>
      ) : (
        <>
          <AppSummaryCard
            label="Total tabungan"
            value={formatRupiah(data.total)}
          >
            <p className="mt-4 text-xs text-muted-foreground">
              Potensi bunga setahun
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-income">
              +{formatRupiah(data.potentialInterest)} / tahun
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Estimasi setahun lagi{" "}
              {formatRupiah(data.total + data.potentialInterest)}
            </p>
          </AppSummaryCard>

          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold">
              Tempat menyimpan
            </h2>
            <button
              type="button"
              onClick={() => startForm(null)}
              className="min-h-11 px-2 text-sm font-bold text-primary"
            >
              Tambah
            </button>
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
                  className="flex flex-col gap-3 rounded-[1.5rem] bg-card p-5 shadow-[0_14px_30px_-24px_var(--clay-dark)]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAccountId(
                        expandedAccountId === account._id ? null : account._id,
                      )
                    }
                    aria-expanded={expandedAccountId === account._id}
                    className="flex min-h-8 items-center gap-3 text-left"
                  >
                    <PiggyBank className="size-5 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">
                      {account.name}
                    </span>
                  </button>

                  <div>
                    <p className="font-display text-[1.75rem] font-extrabold">
                      {formatRupiah(account.balance)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {kind.label}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-income">
                      {account.interest_rate}% / tahun · estimasi
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      +
                      {formatRupiah(
                        Math.max(account.projected - account.balance, 0),
                      )}{" "}
                      dalam setahun
                    </p>
                    <p className="mt-2 text-xs font-semibold">
                      Setahun lagi {formatRupiah(account.projected)}
                    </p>
                  </div>

                  {expandedAccountId === account._id && (
                    <div className="space-y-3 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        Saldo awal {formatRupiah(account.principal)} · Mulai{" "}
                        {formatShortDate(account.started_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            sessionKey.current += 1;
                            setMoveSession({
                              key: sessionKey.current,
                              direction: "deposit",
                              today: toDateInput(Date.now()),
                            });
                            setMoving(account);
                          }}
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
                          onClick={() => startForm(account)}
                          className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
                        >
                          <PencilLine className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${account.name}`}
                          onClick={() => void handleDelete(account)}
                          className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
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
        session={formSession ?? { key: 0, account: null, today: "" }}
      />
      <MoveDialog
        open={moving !== null}
        onOpenChange={(open) => {
          if (!open) setMoving(null);
        }}
        session={moveSession ?? { key: 0, direction: "deposit", today: "" }}
        account={moving}
      />
      <HistoryDialog
        open={historyFor !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryFor(null);
        }}
        account={historyFor}
      />
    </div>
  );
}
