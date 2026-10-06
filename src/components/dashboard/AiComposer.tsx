import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { AiDraft } from "@/convex/ai";
import type { Id } from "@/convex/_generated/dataModel";
import { toDateInput } from "@/lib/format";
import { formatRupiah } from "@/lib/format";
import { useAction } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Send, Sparkles, X } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Satu gelembung obrolan: dari pengguna atau dari asisten. */
interface ChatBubble {
  id: number;
  from: "user" | "bot";
  /** Teks pesan utama. */
  text: string;
  /** Ringkasan draf yang bisa dikonfirmasi, hanya ada di balasan bot. */
  draft?: AiDraft;
}

const SUGGESTIONS = [
  "Kopi 25rb",
  "Gaji 5jt dari kantor",
  "Bensin 50rb pakai GoPay",
  "Belanja mingguan 215rb",
];

/** Waktu sekarang untuk prompt AI. Cuma dipanggil dari event handler,
 * karena Date.now() boleh dipakai di situ, bukan saat render. */
function chatClock() {
  return {
    todayIso: toDateInput(Date.now()),
    tzOffsetMinutes: new Date().getTimezoneOffset(),
  };
}

/** Satu balasan asisten yang menampilkan draf siap simpan. */
function BotDraftBubble({
  draft,
  onDraft,
}: {
  draft: AiDraft;
  onDraft: (draft: AiDraft) => void;
}) {
  return (
    <div className="clay-sunken p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {draft.type === "income" ? "Pemasukan" : "Pengeluaran"}
      </p>
      <p
        className={
          draft.type === "income"
            ? "mt-0.5 font-display text-lg font-extrabold text-income"
            : "mt-0.5 font-display text-lg font-extrabold text-expense"
        }
      >
        {draft.type === "income" ? "+" : "−"}
        {formatRupiah(draft.amount)}
        {draft.wallet_id === null && (
          <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            tanpa dompet
          </span>
        )}
      </p>
      <p className="mt-0.5 text-xs font-semibold">{draft.category}</p>
      {draft.note && (
        <p className="text-xs text-muted-foreground">{draft.note}</p>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Cek dulu, nanti dikonfirmasi di form transaksi ya.
      </p>
      <Button
        type="button"
        size="sm"
        className="mt-2 h-8"
        onClick={() => onDraft(draft)}
      >
        Buka form transaksi
      </Button>
    </div>
  );
}

/**
 * "Catat dari chat": pengalaman seperti chat pelanggan, tanpa WhatsApp.
 * Pengguna menulis bebas, asisten membalas dengan draf transaksi yang
 * dibuka di dialog transaksi untuk dikonfirmasi sebelum disimpan.
 */
export function AiComposer({
  bookId,
  onDraft,
  onClose,
}: {
  bookId: Id<"books">;
  onDraft: (draft: AiDraft) => void;
  /** Kalau diisi, tampil tombol tutup di header (mode panel melayang). */
  onClose?: () => void;
}) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([
    {
      id: 0,
      from: "bot",
      text: "Hai! Cerita saja pengeluaran atau pemasukanmu di sini, nanti kubuatkan catatannya.",
    },
  ]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const parseTransaction = useAction(api.ai.parseTransaction);

  // Selalu ikuti pesan terbaru, seperti aplikasi chat pada umumnya.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [bubbles.length, thinking]);

  const submit = async (raw?: string) => {
    const value = (raw ?? text).trim();
    if (value.length < 2) {
      toast.error("Tulis dulu ya, minimal dua huruf.");
      return;
    }
    setBubbles((prev) => [
      ...prev,
      { id: nextId.current++, from: "user", text: value },
    ]);
    setText("");
    setThinking(true);
    try {
      const draft = await parseTransaction({
        bookId,
        text: value,
        ...chatClock(),
      });
      setBubbles((prev) => [
        ...prev,
        {
          id: nextId.current++,
          from: "bot",
          text: "Sudah kubuatkan drafnya:",
          draft,
        },
      ]);
      onDraft(draft);
    } catch {
      setBubbles((prev) => [
        ...prev,
        {
          id: nextId.current++,
          from: "bot",
          text: "Aduh, aku gagal membaca catatanmu. Coba tulis dengan format yang lebih jelas ya.",
        },
      ],
      );
    } finally {
      setThinking(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="clay flex flex-col p-4 sm:p-5"
    >
      {/* Kepala obrolan, seperti header chat pelanggan. */}
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
        <span className="clay-primary relative grid size-9 shrink-0 place-items-center">
          <Sparkles className="size-4" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-income" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold leading-tight">
            Catat dari chat
          </h2>
          <p className="text-xs text-muted-foreground">
            {thinking ? "Asisten sedang mengetik..." : "Online · siap mencatat"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Tutup chat"
            onClick={onClose}
            className="clay-sm clay-press grid size-8 shrink-0 place-items-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Daftar pesan, gelembung kiri bot kanan pengguna. */}
      <div className="flex max-h-72 min-h-36 flex-col gap-2.5 overflow-y-auto py-3 pr-1">
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={
              bubble.from === "user"
                ? "clay-primary ml-auto max-w-[85%] px-3.5 py-2.5 text-sm font-semibold text-white"
                : "clay-sunken mr-auto max-w-[85%] p-3.5 text-sm"
            }
          >
            {bubble.text}
            {bubble.draft && (
              <div className="mt-2">
                <BotDraftBubble draft={bubble.draft} onDraft={onDraft} />
              </div>
            )}
        </motion.div>
        ))}
        {thinking && (
          <div className="clay-sunken mr-auto flex w-20 items-center justify-center gap-1 rounded-2xl px-3 py-3">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: dot * 0.2,
                }}
                className="size-1.5 rounded-full bg-foreground/70"
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chip saran, muncul hanya sebelum pesan pertama dikirim. */}
      {bubbles.length <= 1 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void submit(suggestion)}
              disabled={thinking}
              className="clay-sm clay-press px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Baris input ala aplikasi chat. */}
      <div className="flex items-end gap-2 border-t border-border/60 pt-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={500}
          rows={1}
          disabled={thinking}
          placeholder="Tulis aja: kopi 25rb pakai GoPay"
          className="max-h-28 min-h-10 flex-1 resize-none"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void submit()}
          disabled={thinking || text.trim().length < 2}
          aria-label="Kirim"
          className="size-10 shrink-0"
        >
          {thinking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </motion.section>
  );
}
