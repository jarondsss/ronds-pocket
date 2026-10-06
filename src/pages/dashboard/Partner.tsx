import { BackToHome } from "@/components/BackToHome";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import { toastError } from "@/lib/error-message";
import { useSaveTracker } from "@/lib/save-status";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";

export default function Partner() {
  const { activeBook, isOwner, setActiveBookId } = useBooks();
  const confirm = useConfirm();
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
  const revokeInvite = useMutation(api.books.revokeInvite);
  const removeMember = useMutation(api.books.removeMember);
  const redeemInvite = useMutation(api.books.redeemInvite);
  const leaveBook = useMutation(api.books.leaveBook);
  const save = useSaveTracker();

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

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
      const generated = await save(() => createInvite({ bookId }));
      await copyCode(generated);
      toast.success(`Kode ${generated} siap dibagikan.`);
    } catch (error) {
      toastError(error, "Kodenya gagal dibuat. Coba lagi ya.");
    } finally {
      setCreating(false);
    }
  };

  const handleRedeem = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Isi kode undangannya dulu ya.");
      return;
    }
    setJoining(true);
    try {
      const joinedId = await save(() => redeemInvite({ code: clean }));
      setActiveBookId(joinedId);
      setCode("");
      toast.success("Berhasil bergabung! Kantongnya sudah muncul di daftarmu.");
    } catch (error) {
      toastError(error, "Kodenya sepertinya salah.");
    } finally {
      setJoining(false);
    }
  };

  const handleRevoke = async (inviteId: Id<"invites">, code: string) => {
    const ok = await confirm({
      title: `Cabut kode ${code}?`,
      description:
        "Kodenya langsung tidak berlaku dan tidak bisa dipakai siapa pun lagi.",
      confirmLabel: "Ya, cabut",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await save(() => revokeInvite({ bookId, inviteId }));
      toast.success("Kodenya dicabut, nggak bisa dipakai lagi.");
    } catch (error) {
      toastError(error, "Gagal mencabut kode ini.");
    }
  };

  const handleLeave = async () => {
    const ok = await confirm({
      title: "Keluar dari Pocket ini?",
      description:
        "Kamu nggak bisa buka lagi sampai diundang ulang. Catatan yang sudah ada tetap milik pemilik.",
      confirmLabel: "Ya, keluar",
      tone: "destructive",
    });
    if (!ok) return;
    setLeaving(true);
    try {
      await save(() => leaveBook({ bookId }));
      setLeaving(false);
      toast.success("Kamu sudah keluar dari kantong ini.");
    } catch (error) {
      setLeaving(false);
      toastError(error, "Gagal keluar dari sini.");
    }
  };

  const handleRemove = async (userId: Id<"users">, name: string) => {
    const ok = await confirm({
      title: `Keluarkan ${name} dari kantong ini?`,
      description:
        "Setelah dikeluarkan, dia tidak bisa lagi melihat atau menambah catatan di sini. Catatan yang sudah ada tetap aman.",
      confirmLabel: "Ya, keluarkan",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await save(() => removeMember({ bookId, userId }));
      toast.success(`${name} sudah dikeluarkan dari Pocket ini.`);
    } catch (error) {
      toastError(error, "Gagal mengeluarkan orang ini.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-3">
          <BackToHome />
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Bagikan kantongmu
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Opsional banget. Kalau nanti mau mencatat bareng orang lain, undang
          mereka ke kantong ini. Teman boleh menambah catatan sendiri, tapi yang
          bukan miliknya cuma bisa disentuh pemiliknya.
        </p>
      </header>

      <section className="clay p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <Users className="size-4" />
          </span>
          <h3 className="font-display text-base font-extrabold">
            Siapa saja di kantong ini ({members?.length ?? 0})
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
                  {member.email ?? (isOwner ? "Tidak ada email" : "Temanmu")}
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
                {member.role === "owner" ? "Pemilik" : "Teman"}
              </span>
              {isOwner && member.role === "partner" && (
                <button
                  type="button"
                  aria-label={`Keluarkan ${member.name}`}
                  onClick={() =>
                    void handleRemove(member.userId, member.name)
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                >
                  <UserMinus className="size-4" />
                </button>
              )}
            </motion.li>
          ))}
        </ul>

        {!isOwner && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Kamu masuk sebagai teman di pocket ini. Mau berhenti catatan
              bareng? Keluar saja, catatan yang sudah ada tetap milik
              pemilik.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLeave()}
              disabled={leaving}
            >
              {leaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Keluar dari Pocket            </Button>
          </div>
        )}
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
                  Bikin kode undangan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Buat kode, lalu kirim ke orang yang mau kamu ajak.
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
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "font-display block text-lg font-extrabold tracking-[0.35em]",
                        invite.expired && "text-muted-foreground line-through",
                      )}
                    >
                      {invite.code}
                    </span>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      {invite.expired
                        ? "Kedaluwarsa, buat kode baru ya"
                        : `Berlaku sampai ${new Date(
                            invite.expires_at ?? invite.created_at,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(invite.code)}
                    disabled={invite.expired}
                    className="clay-sm clay-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary disabled:opacity-50"
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
                  <button
                    type="button"
                    aria-label={`Cabut kode ${invite.code}`}
                    onClick={() => void handleRevoke(invite._id, invite.code)}
                    className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-4" />
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
          <div>                <h3 className="font-display text-base font-extrabold">
                  Gabung ke kantong orang lain
                </h3>
                <p className="text-xs text-muted-foreground">
                  Punya kode undangan? Tempel di sini.
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
              maxLength={8}
              placeholder="ABCDEFGH"
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

      </div>
  );
}
