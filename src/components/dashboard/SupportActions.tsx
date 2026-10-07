import { DonateDialog } from "@/components/dashboard/DonateDialog";
import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { Heart, MessageCircle } from "@/components/icons";
import { useState } from "react";

/**
 * Dua tombol pendamping notifikasi di top bar: masukan (biar kami tahu apa yang
 * perlu diperbaiki) dan donasi (biaya server bulanan). Sengaja dipisah dari
 * Dashboard supaya state dialog tidak menumpuk di shell.
 */
export function SupportActions() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Kirim masukan"
        onClick={() => setFeedbackOpen(true)}
        className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
      >
        <MessageCircle className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Dukung Ronds Pocket"
        onClick={() => setDonateOpen(true)}
        className="clay-sm clay-press grid size-8 place-items-center text-muted-foreground hover:text-primary"
      >
        <Heart className="size-4" />
      </button>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <DonateDialog open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  );
}
