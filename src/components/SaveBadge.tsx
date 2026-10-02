import { useSaveStatus } from "@/lib/save-status";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "@/components/icons";

/** Muncul sebentar setiap kali ada perubahan yang sedang dikirim ke server. */
export function SaveBadge() {
  const { pending } = useSaveStatus();

  return (
    <AnimatePresence initial={false}>
      {pending > 0 && (
        <motion.span
          initial={{ opacity: 0, y: -6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.94 }}
          transition={{ duration: 0.18 }}
          className="clay-sm inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-3.5 animate-spin text-primary" />
          Menyimpan...
        </motion.span>
      )}
    </AnimatePresence>
  );
}
