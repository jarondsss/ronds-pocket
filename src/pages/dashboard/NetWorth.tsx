import {
  AppPageHeader,
  AppSummaryCard,
} from "@/components/dashboard/AppPageHeader";
import {
  LiabilityDialog,
  type LiabilitySession,
} from "@/components/dashboard/LiabilityDialog";
import { ClayLoader } from "@/components/ClayLoader";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useConfirm } from "@/components/ConfirmDialog";
import { useBooks } from "@/lib/book-context";
import { formatRupiah, formatShortDate } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { LiabilityRow, NetWorthSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Landmark,
  Loader2,
  PencilLine,
  PiggyBank,
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
          {isUtang ? (
            <Scale className="size-5" />
          ) : (
            <Landmark className="size-5" />
          )}
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
          aria-label={
            settled ? `Buka lagi ${row.name}` : `Tandai lunas ${row.name}`
          }
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
      <AppPageHeader
        title="Kekayaan bersih"
        subtitle="Semua aset, dikurangi kewajiban."
      />

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Menghitung kekayaan bersih..." />
        </div>
      ) : (
        <>
          <AppSummaryCard
            label="Kekayaan bersih"
            value={formatRupiah(summary?.netWorth ?? 0)}
            detail="Dari dompet, tabungan, tujuan, dan utang."
          />

          <h2 className="font-display text-base font-extrabold">Rinciannya</h2>
          <div className="overflow-hidden rounded-[1.5rem] bg-card px-5 shadow-[0_14px_30px_-24px_var(--clay-dark)]">
            {BREAKDOWN.map((item) => {
              const Icon = item.icon;
              const value = summary?.[item.key] ?? 0;
              return (
                <div
                  key={item.key}
                  className="flex min-h-14 items-center justify-between gap-3 border-b border-border/70 py-3 last:border-b-0"
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </p>
                  <p className="max-w-[45%] break-all text-right text-sm text-muted-foreground">
                    {item.positive ? "" : "−"}
                    {formatRupiah(value)}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={() => startForm(null)}
            className="min-h-12 w-full rounded-2xl"
          >
            Catat utang atau piutang
          </Button>
          <p className="text-xs text-muted-foreground">
            Perubahan nilai aset mengikuti angka yang kamu catat, bukan harga
            pasar otomatis.
          </p>

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
                  <LiabilityRowCard
                    key={row._id}
                    row={row}
                    onEdit={startForm}
                  />
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
                  <LiabilityRowCard
                    key={row._id}
                    row={row}
                    onEdit={startForm}
                  />
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
                  <LiabilityRowCard
                    key={row._id}
                    row={row}
                    onEdit={startForm}
                  />
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
