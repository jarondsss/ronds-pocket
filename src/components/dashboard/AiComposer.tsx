import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { AiDraft } from "@/convex/ai";
import type { Id } from "@/convex/_generated/dataModel";
import { toDateInput } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useAction } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Kotak "catat pakai AI": user menulis bebas, server meraciknya jadi draft,
 * lalu draft itu dibuka di dialog transaksi untuk dikonfirmasi.
 */
export function AiComposer({
  bookId,
  onDraft,
}: {
  bookId: Id<"books">;
  onDraft: (draft: AiDraft) => void;
}) {
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const parseTransaction = useAction(api.ai.parseTransaction);

  const submit = async () => {
    const value = text.trim();
    if (value.length < 2) {
      toast.error('Tulis dulu, misalnya "kopi 35rb tadi pagi".');
      return;
    }
    setThinking(true);
    try {
      const draft = await parseTransaction({
        bookId,
        text: value,
        todayIso: toDateInput(Date.now()),
        tzOffsetMinutes: new Date().getTimezoneOffset(),
      });
      onDraft(draft);
      setText("");
      toast.success("Drafnya siap. Cek dulu sebelum disimpan ya.");
    } catch (error) {
      toastError(error, "AI-nya gagal membaca catatanmu. Coba lagi ya.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="clay flex flex-col gap-3 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2.5">
        <span className="clay-primary grid size-9 shrink-0 place-items-center">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold leading-tight">
            Catat pakai AI
          </h2>
          <p className="text-xs text-muted-foreground">
            Tulis bebas, nanti kami rapikan jadi catatan.
          </p>
        </div>
      </div>

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
        rows={2}
        disabled={thinking}
        className="resize-none"
      />

      <Button
        type="button"
        onClick={submit}
        disabled={thinking}
        className="w-full sm:w-auto sm:self-end"
      >
        {thinking ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Meracik...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Racik jadi catatan
          </>
        )}
      </Button>
    </motion.section>
  );
}
