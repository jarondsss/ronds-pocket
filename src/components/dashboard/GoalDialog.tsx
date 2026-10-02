import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput, toDateInput } from "@/lib/format";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import type { GoalRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2 } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Satu sesi membuat/mengubah target, dibuat di event handler (bukan render)
 * supaya "6 bulan ke depan" bisa dihitung tanpa fungsi impure saat render.
 */
export interface GoalSession {
  key: number;
  goal: GoalRow | null;
}

function GoalForm({
  session,
  bookId,
  onOpenChange,
}: {
  session: GoalSession;
  bookId: Id<"books">;
  onOpenChange: (open: boolean) => void;
}) {
  const goal = session.goal;
  const isEdit = goal !== null;
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const save = useSaveTracker();

  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target_amount ?? 0);
  const [saved, setSaved] = useState(goal?.saved_amount ?? 0);
  const [deadline, setDeadline] = useState(() => {
    if (goal) return toDateInput(goal.deadline);
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    return toDateInput(next.getTime());
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama targetnya dulu ya.");
      return;
    }
    if (target <= 0) {
      toast.error("Isi nominal targetnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      if (goal) {
        await save(() =>
          updateGoal({
            id: goal._id,
            name: clean,
            target_amount: target,
            deadline: fromDateInput(deadline),
            saved_amount: saved,
          }),
        );
        toast.success("Targetnya sudah diperbarui.");
      } else {
        await save(() =>
          createGoal({
            bookId,
            name: clean,
            target_amount: target,
            deadline: fromDateInput(deadline),
            saved_amount: saved,
          }),
        );
        toast.success("Target barunya sudah dibuat.");
      }
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Targetnya gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit ? "Ubah target" : "Target baru"}
        </DialogTitle>
        <DialogDescription>
          Tentukan nominalnya, lalu pantau seberapa dekat kamu ke sana.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="goal-name">Nama target</Label>
          <Input
            id="goal-name"
            value={name}
            maxLength={60}
            placeholder="Liburan ke Bali"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="goal-target">Nominal target</Label>
          <RupiahInput id="goal-target" value={target} onChange={setTarget} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="goal-saved">Sudah terkumpul</Label>
          <RupiahInput id="goal-saved" value={saved} onChange={setSaved} />
        </div>

        <DatePicker
          id="goal-deadline"
          label="Target tanggal"
          value={deadline}
          onChange={setDeadline}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Batal
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function GoalDialog({
  open,
  onOpenChange,
  bookId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  session: GoalSession;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <GoalForm
          key={session.key}
          session={session}
          bookId={bookId}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
