import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/dashboard/DatePicker";
import { RupiahInput } from "@/components/RupiahInput";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromDateInput, toDateInput } from "@/lib/format";
import { useSaveTracker } from "@/lib/save-status";
import type { GoalRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function GoalDialog({
  open,
  onOpenChange,
  bookId,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  goal?: GoalRow | null;
}) {
  const isEdit = Boolean(goal);
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const save = useSaveTracker();

  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [saved, setSaved] = useState(0);
  const [deadline, setDeadline] = useState(toDateInput(Date.now()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setName(goal.name);
      setTarget(goal.target_amount);
      setSaved(goal.saved_amount);
      setDeadline(toDateInput(goal.deadline));
    } else {
      const nextYear = new Date();
      nextYear.setMonth(nextYear.getMonth() + 6);
      setName("");
      setTarget(0);
      setSaved(0);
      setDeadline(toDateInput(nextYear.getTime()));
    }
  }, [open, goal]);

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
      toast.error(
        error instanceof Error ? error.message : "Targetnya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
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
      </SlideUpDialogContent>
    </Dialog>
  );
}
