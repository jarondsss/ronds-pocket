import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { MessageCircle } from "@/components/icons";
import { DonateDialog } from "@/components/dashboard/DonateDialog";
import { useState } from "react";

/**
 * Tombol pendamping notifikasi di top bar (feedback) + tombol Donate yang
 * ditaruh di samping logo Ronds Pocket di header. Donate pakai teks, bukan icon,
 * biar tujuan donasi langsung jelas tanpa perlu tooltip.
 */
export function SupportActions() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDonateOpen(true)}
        aria-label="Dukung Ronds Pocket"
        className="clay-sm clay-press rounded-full px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary/80"
      >
        Donate
      </button>

      <button
        type="button"
        aria-label="Kirim masukan"
        onClick={() => setFeedbackOpen(true)}
        className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
      >
        <MessageCircle className="size-4" />
      </button>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <DonateDialog open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  );
}
