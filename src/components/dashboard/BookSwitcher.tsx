import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useBooks } from "@/lib/book-context";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Check, ChevronDown, Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BookSwitcher({ className }: { className?: string }) {
  const { books, activeBook, setActiveBookId } = useBooks();
  const createBook = useMutation(api.books.create);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama buku kasnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      const bookId = await createBook({ name: clean });
      setActiveBookId(bookId);
      toast.success(`Buku "${clean}" dibuat.`);
      setName("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat buku baru.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "clay-sm clay-press flex w-full items-center gap-2.5 px-3 py-2.5 text-left",
              className,
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-sm font-black text-primary">
              {activeBook ? activeBook.name.charAt(0).toUpperCase() : "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {activeBook?.name ?? "Memuat buku..."}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                {activeBook?.role === "owner" ? "Pemilik" : "Partner"}
                <Users className="size-3" />
                {activeBook?.memberCount ?? 1}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Buku kas kamu</DropdownMenuLabel>
          {books.map((book) => (
            <DropdownMenuItem
              key={book._id}
              onSelect={() => setActiveBookId(book._id)}
              className="gap-2"
            >
              <span className="grid size-6 place-items-center rounded-lg bg-primary/12 text-[11px] font-black text-primary">
                {book.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {book.name}
              </span>
              {book._id === activeBook?._id && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
            className="gap-2 font-semibold"
          >
            <Plus className="size-4" />
            Buku kas baru
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Buku kas baru
            </DialogTitle>
            <DialogDescription>
              Misalnya "Kas Rumah" atau "Usaha Kopi".
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="book-name">Nama buku</Label>
            <Input
              id="book-name"
              value={name}
              maxLength={60}
              placeholder="Kas Rumah"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Buat buku"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
