import { useConfirm } from "@/components/ConfirmDialog";
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
import { useBooks } from "@/lib/book-context";
import { toastError } from "@/lib/error-message";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export function BookManagement({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { books, activeBook, setActiveBookId } = useBooks();
  const [selectedId, setSelectedId] = useState<Id<"books"> | null>(null);
  const book = books.find((item) => item._id === selectedId) ?? activeBook;
  const members = useQuery(
    api.books.members,
    open && book ? { bookId: book._id } : "skip",
  );
  const rename = useMutation(api.books.rename);
  const remove = useMutation(api.books.remove);
  const removeMember = useMutation(api.books.removeMember);
  const leaveBook = useMutation(api.books.leaveBook);
  const confirm = useConfirm();
  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!book) return null;
  const owner = book.role === "owner";
  const saveName = async () => {
    if (!name?.trim()) return;
    setSaving(true);
    try {
      await rename({ bookId: book._id, name: name.trim() });
      setName(null);
      toast.success("Nama kantong diperbarui.");
    } catch (error) {
      toastError(error, "Nama kantong gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };
  const deleteBook = async () => {
    if (books.length <= 1) return;
    const ok = await confirm({
      title: `Hapus ${book.name}?`,
      description: `Semua catatan di kantong ini akan ikut terhapus: transaksi, dompet, anggaran, tujuan, tabungan, pengingat, dan riwayat. ${book.memberCount > 1 ? "Anggota kantong bersama juga akan kehilangan akses. " : ""}Catatan yang sudah dihapus tidak bisa dikembalikan.`,
      confirmLabel: "Hapus kantong & semua catatan",
      tone: "destructive",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await remove({ bookId: book._id });
      setSelectedId(null);
      onOpenChange(false);
      toast.success("Kantong dan semua catatannya dihapus.");
    } catch (error) {
      toastError(error, "Kantong gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };
  const kick = async (userId: Id<"users">, personName: string) => {
    const ok = await confirm({
      title: `Keluarkan ${personName}?`,
      description: `${personName} tidak bisa lagi membuka kantong ini. Catatan yang sudah dibuat tetap tersimpan.`,
      confirmLabel: "Keluarkan anggota",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await removeMember({ bookId: book._id, userId });
      toast.success(`${personName} dikeluarkan.`);
    } catch (error) {
      toastError(error, "Anggota gagal dikeluarkan.");
    }
  };
  const leave = async () => {
    const ok = await confirm({
      title: `Keluar dari ${book.name}?`,
      description:
        "Kamu tidak bisa lagi membuka kantong ini. Catatan yang sudah kamu buat tetap tersimpan untuk anggota lain.",
      confirmLabel: "Keluar dari kantong",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await leaveBook({ bookId: book._id });
      setSelectedId(null);
      onOpenChange(false);
      toast.success("Berhasil keluar dari kantong.");
    } catch (error) {
      toastError(error, "Gagal keluar dari kantong.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideUpDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Kelola kantong
          </DialogTitle>
          <DialogDescription>
            Ubah nama, lihat anggota, atau hapus kantong.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="manage-book-select">Kantong</Label>
            <select
              id="manage-book-select"
              value={book._id}
              onChange={(event) => {
                setSelectedId(event.target.value as Id<"books">);
                setName(null);
              }}
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold"
            >
              {books.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {owner && (
            <div className="space-y-2">
              <Label htmlFor="manage-book-name">Nama kantong</Label>
              <div className="flex gap-2">
                <Input
                  id="manage-book-name"
                  maxLength={60}
                  value={name ?? book.name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Button
                  type="button"
                  disabled={
                    saving || !name?.trim() || name.trim() === book.name
                  }
                  onClick={() => void saveName()}
                >
                  Simpan
                </Button>
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-bold">
              Anggota ({members?.length ?? book.memberCount})
            </h3>
            <div className="space-y-2">
              {members?.map((person) => (
                <div
                  key={person.userId}
                  className="flex items-center gap-3 rounded-xl bg-secondary p-3"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-card text-xl">
                    {person.avatar ?? person.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {person.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.role === "owner"
                        ? "Pemilik"
                        : (person.email ?? "Anggota")}
                    </span>
                  </span>
                  {owner && person.role !== "owner" && (
                    <button
                      type="button"
                      className="min-h-11 px-2 text-xs font-bold text-destructive"
                      onClick={() => void kick(person.userId, person.name)}
                    >
                      Keluarkan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {owner ? (
            <div className="border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={saving || books.length <= 1}
                onClick={() => void deleteBook()}
                className="w-full text-destructive hover:text-destructive"
              >
                Hapus kantong
              </Button>
              {books.length <= 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Kantong terakhir tidak bisa dihapus. Buat kantong lain dulu.
                </p>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive"
              onClick={() => void leave()}
            >
              Keluar dari kantong
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setActiveBookId(book._id);
              onOpenChange(false);
            }}
          >
            Pakai kantong ini
          </Button>
        </DialogFooter>
      </SlideUpDialogContent>
    </Dialog>
  );
}
