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
import { toneValue, walletTypeOf } from "@/lib/palette";
import type { TransferRow, WalletRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { EASE } from "@/lib/motion";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  PencilLine,
  Plus,
  Wallet as WalletIcon,
} from "@/components/icons";
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dompet
          </h1>
          <p className="text-sm text-muted-foreground">
            Semua tempat uangmu disimpan, dalam satu pandangan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => startMove("transfer")}
          >
            <ArrowLeftRight className="size-4" />
            Atur saldo
          </Button>
          <Button type="button" onClick={() => startForm(null)}>
            <Plus className="size-4" />
            Dompet baru
          </Button>
        </div>
      </header>

      {data === undefined ? (
        <div className="grid min-h-[30vh] place-items-center">
          <ClayLoader label="Memuat dompet..." />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="clay-primary relative overflow-hidden p-5 sm:p-6"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-white/20 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                  Total saldo semua dompet
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold leading-none sm:text-4xl">
                  {formatRupiah(data.total)}
                </p>
                <p className="mt-3 text-xs font-medium text-white/80">
                  {wallets.length} dompet aktif
                </p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
                <WalletIcon className="size-6" />
              </span>
            </div>
          </motion.div>

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
                className="clay-primary clay-press mt-4 px-5 py-2.5 text-sm font-bold"
              >
                Dompet baru
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {wallets.map((wallet, index) => (
                <motion.button
                  key={wallet._id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => startForm(wallet)}
                  className="clay clay-press flex flex-col gap-3 p-4 text-left sm:p-5"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${toneValue(
                          wallet.color,
                        )} 22%, transparent)`,
                      }}
                    >
                      {wallet.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-extrabold">
                        {wallet.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {walletTypeOf(wallet.type).label}
                      </span>
                    </span>
                    <PencilLine className="size-4 shrink-0 text-muted-foreground" />
                  </span>
                  <span
                    className={cn(
                      "font-display text-xl font-extrabold",
                      wallet.balance < 0 && "text-expense",
                    )}
                  >
                    {formatRupiah(wallet.balance)}
                  </span>
                  {wallet.opening_balance !== 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Saldo awal {formatRupiah(wallet.opening_balance)}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
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
                      {move.from && move.to
                        ? "🔁"
                        : move.to
                          ? "⬇️"
                          : "⬆️"}
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
