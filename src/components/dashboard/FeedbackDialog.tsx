import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import {
  ChoiceChips,
  type ChipOption,
} from "@/components/dashboard/ChoiceChips";
import { api } from "@/convex/_generated/api";
import { toastError } from "@/lib/error-message";
import { useMutation } from "convex/react";
import { Loader2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

type Mood = "senang" | "lumayan" | "masalah";

/** Nada masukan, biar kami tahu mana yang sudah enak dan mana yang bikin bingung. */
const MOODS: readonly ChipOption<Mood>[] = [
  { value: "senang", label: "Suka", icon: "😍" },
  { value: "lumayan", label: "Lumayan", icon: "🙂" },
  { value: "masalah", label: "Ada masalah", icon: "😕" },
];

function FeedbackForm({ onSent }: { onSent: () => void }) {
  const submit = useMutation(api.feedback.submit);
  const [mood, setMood] = useState<Mood>("senang");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 4) {
      toast.error("Tulis masukanmu sedikit lebih panjang ya.");
      return;
    }
    setSaving(true);
    try {
      await submit({
        message: message.trim(),
        mood,
        contact: contact.trim() || undefined,
      });
      toast.success("Masukanmu sudah masuk. Terima kasih banyak!");
      onSent();
    } catch (error) {
      toastError(error, "Gagal mengirim masukan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Masukan untuk kami</DialogTitle>
        <DialogDescription>
          Ceritakan yang bikin bingung, yang salah hitung, atau yang sudah enak
          dipakai. Semua masukan dibaca langsung oleh pembuat Ronds Pocket.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Secara keseluruhan, Ronds Pocket bagaimana?</Label>
          <ChoiceChips options={MOODS} value={mood} onChange={setMood} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fb-message">Masukan kamu</Label>
          <textarea
            id="fb-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="mis. laporan bulanan enaknya bisa diunduh jadi Excel"
            className="clay-sunken min-h-24 w-full resize-y rounded-2xl px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring/50"
          />
          <p className="text-right text-[11px] font-semibold text-muted-foreground">
            {message.length}/2000
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fb-contact">Kontak (opsional)</Label>
          <Input
            id="fb-contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={120}
            placeholder="Email atau nomor WhatsApp, kalau mau dibalas"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onSent} disabled={saving}>
          Nanti saja
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Kirim masukan"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent>
        {/* Isi dialog di-mount ulang setiap kali dibuka, jadi draft lama tidak
            tertinggal di kotak masukan. */}
        <FeedbackForm onSent={() => onOpenChange(false)} />
      </SlideUpDialogContent>
    </Dialog>
  );
}
