import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Partner() {
  const { activeBook, isOwner, setActiveBookId } = useBooks();
  const bookId = activeBook?._id;

  const members = useQuery(
    api.books.members,
    bookId ? { bookId } : "skip",
  );
  const invites = useQuery(
    api.books.invites,
    bookId && isOwner ? { bookId } : "skip",
  );
  const createInvite = useMutation(api.books.createInvite);
  const removeMember = useMutation(api.books.removeMember);
  const redeemInvite = useMutation(api.books.redeemInvite);

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{
    userId: Id<"users">;
    name: string;
  } | null>(null);

  if (!activeBook || !bookId) return null;

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.info(`Kode undangan: ${value}`);
    }
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const generated = await createInvite({ bookId });
      await copyCode(generated);
      toast.success(`Kode ${generated} siap dibagikan.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat kode undangan.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRedeem = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Masukkan kode undangan dulu ya.");
      return;
    }
    setJoining(true);
    try {
      const joinedId = await redeemInvite({ code: clean });
      setActiveBookId(joinedId);
      setCode("");
      toast.success("Berhasil bergabung sebagai partner!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kode tidak valid.");
    } finally {
      setJoining(false);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await removeMember({ bookId, userId: removing.userId });
      toast.success(`${removing.name} dihapus dari buku kas.`);
      setRemoving(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus anggota.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Partner buku kas
        </h1>
        <p className="text-sm text-muted-foreground">
          Bagikan catatan keuangan ini dengan orang yang kamu percaya.
        </p>
      </header>

      <section className="clay p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <Users className="size-4" />
          </span>
          <h3 className="font-display text-base font-extrabold">
            Anggota ({members?.length ?? 0})
          </h3>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {(members ?? []).map((member) => (
            <motion.li
              key={member.userId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="clay-sunken flex items-center gap-3 rounded-2xl px-3 py-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-sm font-black text-primary">
                {member.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {member.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {member.email ?? "Tidak ada email"}
                </span>
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  member.role === "owner"
                    ? "bg-primary/15 text-primary"
                    : "bg-income/15 text-income",
                )}
              >
                {member.role === "owner" ? (
                  <Crown className="size-3" />
                ) : (
                  <Users className="size-3" />
                )}
                {member.role === "owner" ? "Pemilik" : "Partner"}
              </span>
              {isOwner && member.role === "partner" && (
                <button
                  type="button"
                  aria-label={`Hapus ${member.name}`}
                  onClick={() =>
                    setRemoving({ userId: member.userId, name: member.name })
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                >
                  <UserMinus className="size-4" />
                </button>
              )}
            </motion.li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="clay p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/50 text-accent-foreground">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h3 className="font-display text-base font-extrabold">
                  Undang partner
                </h3>
                <p className="text-xs text-muted-foreground">
                  Buat kode, lalu kirim ke pasanganmu.
                </p>
              </div>
            </div>
            <Button type="button" onClick={handleCreateInvite} disabled={creating}>
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Buat kode
            </Button>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {(invites ?? []).length === 0 ? (
              <li className="clay-sunken rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada kode aktif.
              </li>
            ) : (
              (invites ?? []).map((invite) => (
                <li
                  key={invite._id}
                  className="clay-sunken flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <span className="font-display flex-1 text-lg font-extrabold tracking-[0.35em]">
                    {invite.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(invite.code)}
                    className="clay-sm clay-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
                  >
                    {copied === invite.code ? (
                      <>
                        <Check className="size-3.5" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Salin
                      </>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      <section className="clay p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-income/15 text-income">
            <UserPlus className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-extrabold">
              Gabung buku kas lain
            </h3>
            <p className="text-xs text-muted-foreground">
              Pakai kode undangan dari pasanganmu.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="invite-code" className="sr-only">
              Kode undangan
            </Label>
            <Input
              id="invite-code"
              value={code}
              maxLength={6}
              placeholder="ABC123"
              onChange={(event) =>
                setCode(event.target.value.toUpperCase().replace(/\s/g, ""))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleRedeem();
              }}
              className="text-center font-display text-lg font-extrabold tracking-[0.3em] uppercase"
            />
          </div>
          <Button type="button" onClick={handleRedeem} disabled={joining}>
            {joining ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Gabung"
            )}
          </Button>
        </div>
      </section>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {removing?.name} dari buku ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Partner ini tidak akan bisa lagi melihat atau mencatat transaksi
              di buku kas ini. Catatan yang sudah ada tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
