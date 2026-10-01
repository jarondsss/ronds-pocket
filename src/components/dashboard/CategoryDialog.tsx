import { SegmentedChips } from "@/components/dashboard/ChoiceChips";
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
import { TonePicker } from "@/components/dashboard/TonePicker";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSaveTracker } from "@/lib/save-status";
import type { CategoryRow } from "@/lib/types";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Satu sesi membuat/mengubah kategori, dibuat di event handler (bukan render)
 * supaya form selalu mulai bersih tiap dialog dibuka tanpa reset via effect.
 */
export interface CategorySession {
  key: number;
  category: CategoryRow | null;
  defaultType: "income" | "expense";
}

function CategoryForm({
  session,
  bookId,
  onOpenChange,
}: {
  session: CategorySession;
  bookId: Id<"books">;
  onOpenChange: (open: boolean) => void;
}) {
  const category = session.category;
  const isEdit = category !== null;
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const save = useSaveTracker();

  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(
    category?.type ?? session.defaultType,
  );
  const [color, setColor] = useState(category?.color ?? "violet");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama kategorinya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      if (category) {
        await save(() =>
          updateCategory({ id: category._id, name: clean, color }),
        );
        toast.success("Kategorinya sudah diperbarui.");
      } else {
        await save(() =>
          createCategory({ bookId, name: clean, type, color }),
        );
        toast.success("Kategori barunya sudah siap.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kategorinya gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          {isEdit ? "Ubah kategori" : "Kategori baru"}
        </DialogTitle>
        <DialogDescription>
          Kategori dipakai untuk merapikan catatan dan mengatur anggaran.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category-name">Nama kategori</Label>
          <Input
            id="category-name"
            value={name}
            maxLength={40}
            placeholder="Kopi & Jajan"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {!isEdit && (
          <div className="flex flex-col gap-2">
            <Label>Jenis</Label>
            <SegmentedChips
              options={[
                { value: "expense", label: "Pengeluaran", tone: "expense" },
                { value: "income", label: "Pemasukan", tone: "income" },
              ]}
              value={type}
              onChange={setType}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>Warna</Label>
          <TonePicker value={color} onChange={setColor} />
          <p className="text-xs text-muted-foreground">
            15 pilihan warna untuk membedakan kategori.
          </p>
        </div>
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

export function CategoryDialog({
  open,
  onOpenChange,
  bookId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  session: CategorySession;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
        <CategoryForm
          key={session.key}
          session={session}
          bookId={bookId}
          onOpenChange={onOpenChange}
        />
      </SlideUpDialogContent>
    </Dialog>
  );
}
