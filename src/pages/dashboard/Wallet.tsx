import {
  AppPageHeader,
  AppSummaryCard,
} from "@/components/dashboard/AppPageHeader";
import {
  WalletFormDialog,
  type WalletFormSession,
} from "@/components/dashboard/WalletFormDialog";
import {
  WalletMoveDialog,
  type MoveMode,
  type MoveSession,
} from "@/components/dashboard/WalletMoveDialog";
import { ClayLoader } from "@/components/ClayLoader";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import { formatDay, formatRupiah, toDateInput } from "@/lib/format";
import { walletTypeOf } from "@/lib/palette";
import type { TransferRow, WalletRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Wallet as WalletIcon } from "@/components/icons";
import { useRef, useState } from "react";

export default function Wallet() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;

  const data = useQuery(api.wallets.list, bookId ? { bookId } : "skip");
  const transfers = useQuery(
    api.wallets.transfers,
    bookId ? { bookId } : "skip",
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState<WalletFormSession | null>(
    null,
  );
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const sessionKey = useRef(0);

  if (!activeBook || !bookId) return null;

  const wallets = data?.wallets ?? [];

  // Sesi dibuat di event handler: tanggal hari ini dihitung di sini, dan
  // `key` yang naik bikin form di dialog ter-remount dengan nilai awal segar.
  const startForm = (wallet: WalletRow | null) => {
    sessionKey.current += 1;
    setFormSession({ key: sessionKey.current, wallet });
    setFormOpen(true);
  };

  const startMove = (mode: MoveMode) => {
    sessionKey.current += 1;
    setMoveSession({
      key: sessionKey.current,
      mode,
      from: wallets[0]?._id ?? null,
      to: (wallets[1] ?? wallets[0])?._id ?? null,
      today: toDateInput(Date.now()),
    });
    setMoveOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader title="Dompet" subtitle="Saldo di setiap tempat." />

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Memuat dompet..." />
        </div>
      ) : (
        <>
          <AppSummaryCard
            label="Total saldo"
            value={formatRupiah(data.total)}
            detail={`${wallets.length} dompet aktif`}
          />

          {wallets.length === 0 ? (
            <div className="clay p-8 text-center">
              <p className="font-display text-lg font-extrabold">
                Belum ada dompet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tambahkan dompet pertamamu supaya saldo bisa dihitung.
              </p>
              <button
                type="button"
                onClick={() => startForm(null)}
                className="clay-primary clay-press mt-4 rounded-full px-5 py-2.5 text-sm font-bold"
              >
                Dompet baru
              </button>
            </div>
          ) : (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold">
                  Dompet kamu
                </h2>
                <button
                  type="button"
                  onClick={() => startForm(null)}
                  className="min-h-11 px-2 text-xs font-bold text-primary"
                >
                  Tambah
                </button>
              </div>
              <div className="overflow-hidden rounded-[1.5rem] bg-card px-5 shadow-[0_14px_30px_-24px_var(--clay-dark)]">
                {wallets.map((wallet, index) => (
                  <motion.button
                    key={wallet._id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => startForm(wallet)}
                    className="flex min-h-[72px] w-full items-center gap-3 border-b border-border py-3 text-left last:border-0"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                      <WalletIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {wallet.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {walletTypeOf(wallet.type).label}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold",
                        wallet.balance < 0 && "text-expense",
                      )}
                    >
                      {formatRupiah(wallet.balance)}
                    </span>
                  </motion.button>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => startMove("transfer")}
                className="h-12 w-full rounded-2xl"
              >
                Pindahkan saldo
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Perpindahan antar dompet tidak dihitung sebagai pemasukan atau
                pengeluaran.
              </p>
            </section>
          )}

          <section className="clay p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-extrabold">
                Perpindahan terakhir
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => startMove("transfer")}
              >
                Pindah uang
              </Button>
            </div>

            {(transfers ?? []).length === 0 ? (
              <p className="clay-sunken mt-4 rounded-2xl px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada perpindahan atau penyesuaian saldo.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {(transfers as TransferRow[]).map((move) => (
                  <li
                    key={move._id}
                    className="clay-sunken flex items-center gap-3 rounded-2xl px-3 py-3"
                  >
                    <span className="text-lg">
                      {move.from && move.to ? "🔁" : move.to ? "⬇️" : "⬆️"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {move.from && move.to
                          ? `${move.from.name} → ${move.to.name}`
                          : move.to
                            ? `Masuk ke ${move.to.name}`
                            : `Keluar dari ${move.from?.name ?? "dompet"}`}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {move.note || "Tanpa catatan"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-display text-sm font-extrabold">
                        {formatRupiah(move.amount)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {formatDay(move.occurred_at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <WalletFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bookId={bookId}
        session={formSession ?? { key: 0, wallet: null }}
      />
      <WalletMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        bookId={bookId}
        wallets={wallets}
        session={
          moveSession ?? {
            key: 0,
            mode: "transfer",
            from: null,
            to: null,
            today: "",
          }
        }
      />
    </div>
  );
}
