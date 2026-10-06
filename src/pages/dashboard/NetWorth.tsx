import { LiabilityDialog, type LiabilitySession } from "@/components/dashboard/LiabilityDialog";
import { ClayLoader } from "@/components/ClayLoader";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConfirm } from "@/components/ConfirmDialog";
import { useBooks } from "@/lib/book-context";
import {
  formatRupiah,
  formatShortDate,
} from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { LiabilityRow, NetWorthSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Landmark,
  Loader2,
  PencilLine,
  PiggyBank,
  Plus,
  RotateCcw,
  Scale,
  Target,
  Trash2,
  Wallet,
} from "@/components/icons";
import { useRef, useState } from "react";
import { toast } from "sonner";

const BREAKDOWN: {
  key: keyof Pick<
    NetWorthSummary,
    "wallets" | "savings" | "goals" | "utang" | "piutang"
  >;
  label: string;
  icon: typeof Wallet;
  positive: boolean;
}[] = [
  { key: "wallets", label: "Dompet", icon: Wallet, positive: true },
  { key: "savings", label: "Tabungan", icon: PiggyBank, positive: true },
  { key: "goals", label: "Dana tujuan", icon: Target, positive: true },
  { key: "utang", label: "Utang", icon: Scale, positive: false },
  { key: "piutang", label: "Piutang", icon: Landmark, positive: true },
];

function LiabilityRowCard({
  row,
  onEdit,
}: {
  row: LiabilityRow;
  onEdit: (row: LiabilityRow) => void;
}) {
  const update = useMutation(api.netWorth.update);
  const remove = useMutation(api.netWorth.remove);
  const save = useSaveTracker();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const isUtang = row.kind === "utang";
  const settled = row.settled_at !== undefined;

  const toggleSettled = async () => {
    setBusy(true);
    try {
      await save(() => update({ id: row._id, settled: !settled }));
      toast.success(settled ? "Catatannya dibuka lagi." : "Lunas! 🎉");
    } catch (error) {
      toastError(error, "Catatannya gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Hapus ${row.name}?`,
      description: "Catatan ini langsung hilang dari hitungan kekayaan bersih.",
      confirmLabel: "Ya, hapus",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await save(() => remove({ id: row._id }));
      toast.success("Catatannya sudah dihapus.");
    } catch (error) {
      toastError(error, "Catatannya gagal dihapus.");
    }
  };

  return (
    <li
      className={cn(
        "clay flex flex-col gap-3 p-4 sm:flex-row sm:items-center",
        settled && "opacity-60",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            isUtang ? "bg-expense/12 text-expense" : "bg-income/12 text-income",
          )}
        >
          {isUtang ? <Scale className="size-5" /> : <Landmark className="size-5" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{row.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {isUtang ? "Ke " : "Dari "}
            {row.counterparty}
            {row.due_date !== undefined &&
              ` · tempo ${formatShortDate(row.due_date)}`}
            {row.note && ` · ${row.note}`}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-sm font-extrabold",
            isUtang ? "text-expense" : "text-income",
          )}
        >
          {isUtang ? "−" : "+"}
          {formatRupiah(row.balance)}
        </span>
        <button
          type="button"
          aria-label={settled ? `Buka lagi ${row.name}` : `Tandai lunas ${row.name}`}
          onClick={() => void toggleSettled()}
          disabled={busy}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : settled ? (
            <RotateCcw className="size-4" />
          ) : (
            <Check className="size-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={`Ubah ${row.name}`}
          onClick={() => onEdit(row)}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-primary"
        >
          <PencilLine className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Hapus ${row.name}`}
          onClick={() => void handleDelete()}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </span>
    </li>
  );
}

export default function NetWorth() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;

  const data = useQuery(api.netWorth.list, bookId ? { bookId } : "skip");

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState<LiabilitySession | null>(null);
  const sessionKey = useRef(0);

  if (!activeBook || !bookId) return null;

  const startForm = (liability: LiabilityRow | null) => {
    sessionKey.current += 1;
    setFormSession({ key: sessionKey.current, liability, today: "" });
    setFormOpen(true);
  };

  const summary: NetWorthSummary | undefined = data?.summary;
  const liabilities: LiabilityRow[] = data?.liabilities ?? [];
  const openRows = liabilities.filter((row) => row.settled_at === undefined);
  const utangRows = openRows.filter((row) => row.kind === "utang");
  const piutangRows = openRows.filter((row) => row.kind === "piutang");
  const settledRows = liabilities.filter((row) => row.settled_at !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Net Worth
          </h1>
          <p className="text-sm text-muted-foreground">
            Dompet, tabungan, tujuan, utang, dan piutang dalam satu angka.
          </p>
        </div>
        <Button type="button" onClick={() => startForm(null)}>
          <Plus className="size-4" />
          Catat utang / piutang
        </Button>
      </header>

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Menghitung kekayaan bersih..." />
        </div>
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="clay-primary p-6 text-center sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Kekayaan bersih
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">
              {formatRupiah(summary?.netWorth ?? 0)}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-white/85">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-income" />
                Aset{" "}
                {formatRupiah(
                  (summary?.wallets ?? 0) +
                    (summary?.savings ?? 0) +
                    (summary?.goals ?? 0) +
                    (summary?.piutang ?? 0),
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-expense" />
                Utang {formatRupiah(summary?.utang ?? 0)}
              </span>
            </div>
          </motion.section>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {BREAKDOWN.map((item) => {
              const Icon = item.icon;
              const value = summary?.[item.key] ?? 0;
              return (
                <div key={item.key} className="clay-sm p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Icon
                      className={cn(
                        "size-3.5",
                        item.positive ? "text-income" : "text-expense",
                      )}
                    />
                    {item.label}
                  </p>
                  <p className="mt-1 font-display text-sm font-extrabold">
                    {formatRupiah(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="font-display text-base font-extrabold">
              Utang berjalan
              {utangRows.length > 0 && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {utangRows.length} catatan
                </span>
              )}
            </h3>
            {utangRows.length === 0 ? (
              <p className="clay rounded-3xl px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada utang. Kekayaan bersihmu aman dari bunga. 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {utangRows.map((row) => (
                  <LiabilityRowCard key={row._id} row={row} onEdit={startForm} />
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-display text-base font-extrabold">
              Piutang berjalan
              {piutangRows.length > 0 && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {piutangRows.length} catatan
                </span>
              )}
            </h3>
            {piutangRows.length === 0 ? (
              <p className="clay rounded-3xl px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada uang di luar yang menunggu balik.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {piutangRows.map((row) => (
                  <LiabilityRowCard key={row._id} row={row} onEdit={startForm} />
                ))}
              </ul>
            )}
          </section>

          {settledRows.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-display text-base font-extrabold">
                Sudah lunas
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {settledRows.length} catatan
                </span>
              </h3>
              <ul className="flex flex-col gap-3">
                {settledRows.map((row) => (
                  <LiabilityRowCard key={row._id} row={row} onEdit={startForm} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <LiabilityDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bookId={bookId}
        session={formSession}
      />
    </div>
  );
}
