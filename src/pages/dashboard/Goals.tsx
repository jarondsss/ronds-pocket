import { GoalDialog, type GoalSession } from "@/components/dashboard/GoalDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import { toastError } from "@/lib/error-message";
import {
  describeDaysLeft,
  daysUntil,
  formatRupiah,
  formatShortDate,
} from "@/lib/format";
import { useSaveTracker } from "@/lib/save-status";
import type { GoalRow, WalletRow } from "@/lib/types";
import { ClayLoader } from "@/components/ClayLoader";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { EASE } from "@/lib/motion";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Coins,
  Loader2,
  PencilLine,
  Plus,
  Target,
  Trash2,
} from "@/components/icons";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** Satu sesi menambah/menarik dana target, dibuat di event handler. */
export interface FundSession {
  key: number;
  goal: GoalRow | null;
}

function FundDialog({
  open,
  onOpenChange,
  session,
  wallets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Satu sesi setor/tarik dana, dibuat di event handler. */
  session: FundSession;
  wallets: WalletRow[];
}) {
  const adjust = useMutation(api.goals.adjustFunds);
  const save = useSaveTracker();
  const goal = session.goal;
  const [direction, setDirection] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState("none");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!goal) return;
    if (amount <= 0) {
      toast.error("Isi nominalnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      await save(() =>
        adjust({
          id: goal._id,
          amount: direction === "add" ? amount : -amount,
          wallet_id: walletId === "none" ? undefined : (walletId as Id<"wallets">),
        }),
      );
      toast.success(
        direction === "add"
          ? "Dananya sudah masuk ke target."
          : "Dananya sudah ditarik dari target.",
      );
      onOpenChange(false);
      setAmount(0);
    } catch (error) {
      toastError(error, "Dananya gagal dipindahkan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <div key={session.key}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {goal ? goal.name : "Target"}
            </DialogTitle>
            <DialogDescription>
              Catat setoran atau penarikan dana untuk target ini.
            </DialogDescription>
          </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="clay-sunken grid grid-cols-2 gap-2 p-2">
            {(
              [
                { value: "add", label: "Setor dana" },
                { value: "withdraw", label: "Tarik dana" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDirection(option.value)}
                className={cn(
                  "rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                  direction === option.value
                    ? "clay-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fund-amount">Nominal</Label>
            <RupiahInput id="fund-amount" value={amount} onChange={setAmount} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Ambil dari dompet (opsional)</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Tanpa dompet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa dompet</SelectItem>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet._id} value={wallet._id}>
                    <span className="mr-1.5">{wallet.icon}</span>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Kalau dipilih, saldo dompetnya ikut disesuaikan.
            </p>
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
        </div>
      </SlideUpDialogContent>
    </Dialog>
  );
}

export default function Goals() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;

  const goals = useQuery(api.goals.list, bookId ? { bookId } : "skip");
  const walletData = useQuery(api.wallets.list, bookId ? { bookId } : "skip");
  const removeGoal = useMutation(api.goals.remove);
  const save = useSaveTracker();

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState<GoalSession | null>(null);
  const sessionKey = useRef(0);

  const startForm = (goal: GoalRow | null) => {
    sessionKey.current += 1;
    setFormSession({ key: sessionKey.current, goal });
    setFormOpen(true);
  };
  const [fundSession, setFundSession] = useState<FundSession | null>(null);

  const confirm = useConfirm();

  const handleDelete = async (goal: GoalRow) => {
    const ok = await confirm({
      title: `Hapus target ${goal.name}?`,
      description:
        "Progress dan catatan dananya akan hilang. Saldo dompet yang sudah terlanjur dipindahkan tidak ikut kembali.",
      confirmLabel: "Ya, hapus",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await save(() => removeGoal({ id: goal._id }));
      toast.success("Targetnya sudah dihapus.");
    } catch (error) {
      toastError(error, "Targetnya gagal dihapus.");
    }
  };

  if (!activeBook || !bookId) return null;

  const rows: GoalRow[] = goals ?? [];
  const wallets = walletData?.wallets ?? [];
  const totalTarget = rows.reduce((sum, row) => sum + row.target_amount, 0);
  const totalSaved = rows.reduce((sum, row) => sum + row.saved_amount, 0);

  // Sesi fund dibuat di event handler; `key` yang naik bikin form mulai bersih.
  const startFund = (goal: GoalRow) => {
    sessionKey.current += 1;
    setFundSession({ key: sessionKey.current, goal });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            Tulis targetnya, lalu lihat seberapa dekat kamu ke sana.
          </p>
        </div>
        <Button type="button" onClick={() => startForm(null)}>
          <Plus className="size-4" />
          Target baru
        </Button>
      </header>

      {goals === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Memuat target..." />
        </div>
      ) : rows.length === 0 ? (
        <div className="clay flex flex-col items-center gap-3 p-8 text-center">
          <span className="clay-sunken grid size-16 place-items-center rounded-3xl">
            <Target className="size-7 text-muted-foreground" />
          </span>
          <p className="font-display text-lg font-extrabold">
            Belum ada target
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Misalnya dana darurat, laptop baru, atau liburan akhir tahun. Tentukan
            nominalnya dan biarkan progress-nya jalan.
          </p>
          <button
            type="button"
            onClick={() => startForm(null)}
            className="clay-primary clay-press mt-2 rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Bikin target pertama
          </button>
        </div>
      ) : (
        <>
          <div className="clay-sm flex items-center gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
              <Coins className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Terkumpul dari semua target
              </p>
              <p className="font-display text-lg font-extrabold">
                {formatRupiah(totalSaved)}
                <span className="text-sm font-semibold text-muted-foreground">
                  {" "}
                  / {formatRupiah(totalTarget)}
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((goal, index) => {
              const percent =
                goal.target_amount > 0
                  ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
                  : 0;
              const done = goal.saved_amount >= goal.target_amount;
              const days = daysUntil(goal.deadline);
              const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);

              return (
                <motion.article
                  key={goal._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="clay flex flex-col gap-3 p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-extrabold">
                        {goal.name}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 flex items-center gap-1 text-xs font-semibold",
                          days < 0 && !done
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        <CalendarClock className="size-3.5" />
                        {formatShortDate(goal.deadline)} ·{" "}
                        {done ? "Tercapai! 🎉" : describeDaysLeft(days)}
                      </span>
                    </span>
                    {done && (
                      <span className="rounded-full bg-income/15 px-2.5 py-1 text-[11px] font-bold text-income">
                        100%
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-display text-lg font-extrabold">
                      {formatRupiah(goal.saved_amount)}
                      <span className="text-sm font-semibold text-muted-foreground">
                        {" "}
                        / {formatRupiah(goal.target_amount)}
                      </span>
                    </p>
                    <div className="clay-sunken mt-2 h-2.5 overflow-hidden rounded-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(percent, 3)}%` }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: done
                            ? "var(--income)"
                            : "var(--primary)",
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {done
                        ? "Targetnya sudah penuh. Mantap!"
                        : `Kurang ${formatRupiah(remaining)} lagi`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        startFund(goal);
                      }}
                    >
                      <Plus className="size-4" />
                      Tambah dana
                    </Button>
                    <button
                      type="button"
                      aria-label={`Ubah ${goal.name}`}
                      onClick={() => startForm(goal)}
                      className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
                    >
                      <PencilLine className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${goal.name}`}
                      onClick={() => void handleDelete(goal)}
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

      <GoalDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bookId={bookId}
        session={formSession ?? { key: 0, goal: null }}
      />
      <FundDialog
        open={fundSession !== null}
        onOpenChange={(open) => {
          if (!open) setFundSession(null);
        }}
        session={fundSession ?? { key: 0, goal: null }}
        wallets={wallets}
      />
    </div>
  );
}
