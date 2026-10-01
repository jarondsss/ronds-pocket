import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlideUpDialogContent } from "@/components/SlideUpDialog";
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
import { useSaveTracker } from "@/lib/save-status";
import { useMutation } from "convex/react";
import { Check, ChevronDown, Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function BookItem({
  book,
  active,
  onSelect,
}: {
  book: { _id: string; name: string; memberCount: number };
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2">
      <span className="grid size-6 place-items-center rounded-lg bg-primary/12 text-[11px] font-black text-primary">
        {book.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {book.name}
      </span>
      {book.memberCount > 1 && (
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-muted-foreground">
          <Users className="size-3" />
          {book.memberCount}
        </span>
      )}
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </DropdownMenuItem>
  );
}

export function BookSwitcher({ className }: { className?: string }) {
  const { books, activeBook, setActiveBookId } = useBooks();
  const createBook = useMutation(api.books.create);
  const save = useSaveTracker();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Kantong yang sudah diundang orang lain dikelompokkan terpisah, biar jelas
  // mana yang punyamu sendiri dan mana yang dipakai bareng.
  const soloBooks = books.filter((book) => book.memberCount <= 1);
  const sharedBooks = books.filter((book) => book.memberCount > 1);

  const handleCreate = async () => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Beri nama kantongnya dulu ya.");
      return;
    }
    setSaving(true);
    try {
      const bookId = await save(() => createBook({ name: clean }));
      setActiveBookId(bookId);
      toast.success(`Kantong "${clean}" siap dipakai.`);
      setName("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kantong barunya gagal dibuat.",
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
                {activeBook?.name ?? "Memuat kantong..."}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                {activeBook && activeBook.memberCount > 1
                  ? "Kantong bersama"
                  : activeBook?.role === "owner"
                    ? "Pemilik"
                    : "Teman"}
                <Users className="size-3" />
                {activeBook?.memberCount ?? 1}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {soloBooks.length > 0 && (
            <>
              <DropdownMenuLabel>Kantong kamu</DropdownMenuLabel>
              {soloBooks.map((book) => (
                <BookItem
                  key={book._id}
                  book={book}
                  active={book._id === activeBook?._id}
                  onSelect={() => setActiveBookId(book._id)}
                />
              ))}
            </>
          )}

          {sharedBooks.length > 0 && (
            <>
              {soloBooks.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                Kantong bersama
              </DropdownMenuLabel>
              {sharedBooks.map((book) => (
                <BookItem
                  key={book._id}
                  book={book}
                  active={book._id === activeBook?._id}
                  onSelect={() => setActiveBookId(book._id)}
                />
              ))}
            </>
          )}

          {books.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Belum ada kantong.
            </p>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
            className="gap-2 font-semibold"
          >
            <Plus className="size-4" />
            Kantong baru
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <SlideUpDialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Kantong baru
            </DialogTitle>
            <DialogDescription>
              Misalnya "Uang Harian" atau "Tabungan Liburan".
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="book-name">Nama kantong</Label>
            <Input
              id="book-name"
              value={name}
              maxLength={60}
              placeholder="Uang Harian"
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
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Buat kantong"
              )}
            </Button>
          </DialogFooter>
        </SlideUpDialogContent>
      </Dialog>
    </>
  );
}
