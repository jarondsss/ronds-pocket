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
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CategoryDialog({
  open,
  onOpenChange,
  bookId,
  category,
  defaultType = "expense",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: Id<"books">;
  category?: CategoryRow | null;
  defaultType?: "income" | "expense";
}) {
  const isEdit = Boolean(category);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const save = useSaveTracker();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [color, setColor] = useState("violet");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
    } else {
      setName("");
      setType(defaultType);
      setColor("violet");
    }
  }, [open, category, defaultType]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="sm:max-w-md">
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
              <div className="clay-sunken grid grid-cols-2 gap-2 p-2">
                {(
                  [
                    { value: "expense", label: "Pengeluaran" },
                    { value: "income", label: "Pemasukan" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                      type === option.value
                        ? option.value === "expense"
                          ? "bg-expense text-white"
                          : "bg-income text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
      </SlideUpDialogContent>
    </Dialog>
  );
}
