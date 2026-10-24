import { useConfirm } from "@/components/ConfirmDialog";
import { AppPageHeader } from "@/components/dashboard/AppPageHeader";
import { BookManagement } from "@/components/dashboard/BookManagement";
import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { DonateDialog } from "@/components/dashboard/DonateDialog";
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
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { ANIMAL_AVATARS } from "@/lib/avatars";
import { useBooks } from "@/lib/book-context";
import { toastError } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import {
  ChevronRight,
  Heart,
  Lock,
  LogOut,
  MessageCircle,
  Moon,
  PencilLine,
  ShieldCheck,
  Sun,
  Trash2,
  Users,
} from "@/components/icons";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTheme } from "next-themes";

type Panel = "avatar" | "name" | "theme" | "password" | "help" | null;
const rowClass =
  "flex min-h-16 w-full items-center gap-3 border-b border-border/70 px-4 text-left last:border-0 hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-primary";

export default function Profile() {
  const profile = useProfile();
  const { signOut } = useAuth();
  const { activeBook } = useBooks();
  const saveProfile = useMutation(api.profile.update);
  const setPassword = useAction(api.profile.setPassword);
  const deleteAccount = useMutation(api.profile.deleteAccount);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const confirm = useConfirm();
  const [panel, setPanel] = useState<Panel>(null);
  const [managing, setManaging] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [password, setPasswordDraft] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [busy, setBusy] = useState(false);

  const update = async (kind: "name" | "avatar") => {
    setBusy(true);
    try {
      await saveProfile({
        displayName:
          kind === "name" ? name?.trim() || profile.name : profile.name,
        avatar:
          kind === "avatar"
            ? (avatar ?? profile.avatar ?? undefined)
            : (profile.avatar ?? undefined),
      });
      setPanel(null);
      setName(null);
      setAvatar(null);
      toast.success("Profil diperbarui.");
    } catch (error) {
      toastError(error, "Profil gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };
  const signOutNow = async () => {
    setBusy(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      toastError(error, "Gagal keluar.");
      setBusy(false);
    }
  };
  const deleteNow = async () => {
    const ok = await confirm({
      title: "Hapus akun secara permanen?",
      description:
        "Semua data yang kamu miliki akan dihapus dan tidak bisa dikembalikan. Kantong bersama yang masih punya anggota akan dialihkan ke anggota lain.",
      confirmLabel: "Hapus akun",
      tone: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteAccount();
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      toastError(error, "Akun gagal dihapus.");
      setBusy(false);
    }
  };
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8 || password !== passwordAgain) return;
    setBusy(true);
    try {
      await setPassword({ password });
      setPanel(null);
      setPasswordDraft("");
      setPasswordAgain("");
      toast.success("Kata sandi tersimpan.");
    } catch (error) {
      toastError(error, "Kata sandi gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };
  const row = (
    label: string,
    detail: string,
    icon: typeof Users,
    action: () => void,
    compact = false,
  ) => {
    const Icon = icon;
    return (
      <button type="button" onClick={action} className={rowClass}>
        <span className="grid size-8 shrink-0 place-items-center text-primary">
          <Icon className="size-[18px]" />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1",
            compact && "flex items-center justify-between gap-2",
          )}
        >
          <span className="block text-sm font-semibold">{label}</span>
          <span
            className={cn(
              "block truncate text-xs text-muted-foreground",
              compact && "max-w-[45%] text-right",
            )}
          >
            {detail}
          </span>
        </span>
        {!compact && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-8">
      <AppPageHeader title="Profil" subtitle="Atur akun dan tampilan." />
      <section className="flex items-center gap-4 rounded-[1.5rem] bg-card p-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-[1.3rem] bg-accent text-3xl">
          {profile.avatar ?? profile.initial}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-extrabold">
            {profile.name}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {profile.email ?? "Masuk sebagai tamu"}
          </p>
          <button
            type="button"
            onClick={() => setPanel("avatar")}
            className="mt-2 text-xs font-bold text-primary"
          >
            Ganti avatar
          </button>
        </div>
      </section>
      <h2 className="font-display text-base font-extrabold">Pengaturan</h2>
      <section
        className="overflow-hidden rounded-[1.5rem] bg-card"
        aria-label="Pengaturan profil"
      >
        {row(
          "Nama tampilan",
          profile.name,
          PencilLine,
          () => setPanel("name"),
          true,
        )}
        {row(
          "Tema",
          theme === "dark"
            ? "Gelap"
            : theme === "light"
              ? "Terang"
              : "Ikuti perangkat",
          Moon,
          () => setPanel("theme"),
          true,
        )}
        {row(
          "Kantong aktif",
          activeBook?.name ?? "-",
          Users,
          () => setManaging(true),
          true,
        )}
        {row("Bantuan", "Buka", ShieldCheck, () => setPanel("help"), true)}
      </section>
      <section>
        <h2 className="mb-2 px-1 font-display text-base font-extrabold">
          Dukungan
        </h2>
        <div className="overflow-hidden rounded-[1.5rem] bg-card">
          {row(
            "Kirim masukan",
            "Bantu kami memperbaiki Ronds Pocket",
            MessageCircle,
            () => setFeedbackOpen(true),
          )}
          {row("Donasi", "Bantu aplikasi ini terus berjalan", Heart, () =>
            setDonateOpen(true),
          )}
        </div>
      </section>
      {profile.email && (
        <section className="overflow-hidden rounded-[1.5rem] bg-card">
          {row("Kata sandi", "Masuk tanpa kode email", Lock, () =>
            setPanel("password"),
          )}
        </section>
      )}
      <section className="overflow-hidden rounded-[1.5rem] bg-card">
        {row("Keluar", "Keluar dari akun ini", LogOut, () => void signOutNow())}
        {row(
          "Hapus akun",
          "Hapus data akun secara permanen",
          Trash2,
          () => void deleteNow(),
        )}
      </section>

      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SlideUpDialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {panel === "avatar"
                ? "Pilih avatar"
                : panel === "name"
                  ? "Nama tampilan"
                  : panel === "theme"
                    ? "Tampilan"
                    : panel === "password"
                      ? "Kata sandi"
                      : "Bantuan"}
            </DialogTitle>
            <DialogDescription>
              {panel === "avatar"
                ? "Pilih hewan yang mewakili kamu di kantong bersama."
                : panel === "name"
                  ? "Nama ini terlihat oleh anggota kantong bersama."
                  : panel === "theme"
                    ? "Pilih tampilan yang nyaman dipakai."
                    : panel === "password"
                      ? "Buat kata sandi minimal 8 karakter."
                      : "Panduan singkat menggunakan Ronds Pocket."}
            </DialogDescription>
          </DialogHeader>
          {panel === "avatar" && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {ANIMAL_AVATARS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    aria-label={item.label}
                    aria-pressed={(avatar ?? profile.avatar) === item.emoji}
                    onClick={() => setAvatar(item.emoji)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-2xl bg-secondary text-2xl",
                      (avatar ?? profile.avatar) === item.emoji &&
                        "ring-2 ring-primary",
                    )}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={busy || !avatar}
                  onClick={() => void update("avatar")}
                >
                  Simpan avatar
                </Button>
              </DialogFooter>
            </>
          )}
          {panel === "name" && (
            <>
              <Label htmlFor="profile-name">Nama tampilan</Label>
              <Input
                id="profile-name"
                maxLength={24}
                value={name ?? profile.name}
                onChange={(event) => setName(event.target.value)}
              />
              <DialogFooter>
                <Button
                  type="button"
                  disabled={busy || !name?.trim()}
                  onClick={() => void update("name")}
                >
                  Simpan nama
                </Button>
              </DialogFooter>
            </>
          )}
          {panel === "theme" && (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "light", label: "Terang", icon: Sun },
                  { value: "dark", label: "Gelap", icon: Moon },
                  { value: "system", label: "Sistem", icon: ShieldCheck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={theme === item.value}
                    onClick={() => setTheme(item.value)}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary text-xs font-bold",
                      theme === item.value && "ring-2 ring-primary",
                    )}
                  >
                    <Icon className="size-5 text-primary" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          {panel === "password" && (
            <form onSubmit={savePassword} className="space-y-3">
              <Label htmlFor="profile-password">Kata sandi baru</Label>
              <Input
                id="profile-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPasswordDraft(event.target.value)}
              />
              <Label htmlFor="profile-password-again">Ulangi kata sandi</Label>
              <Input
                id="profile-password-again"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordAgain}
                onChange={(event) => setPasswordAgain(event.target.value)}
              />
              {passwordAgain && password !== passwordAgain && (
                <p className="text-xs text-destructive">
                  Kata sandinya belum sama.
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  busy || password.length < 8 || password !== passwordAgain
                }
              >
                Simpan kata sandi
              </Button>
            </form>
          )}
          {panel === "help" && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Mulai dari Beranda untuk melihat saldo dan transaksi harian. Pilih
              kantong aktif untuk mengganti kantong, mengatur anggota, atau
              membuat kantong baru. Butuh bantuan lain? Kirim feedback dari menu
              Profil.
            </p>
          )}
        </SlideUpDialogContent>
      </Dialog>
      <BookManagement open={managing} onOpenChange={setManaging} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <DonateDialog open={donateOpen} onOpenChange={setDonateOpen} />
    </div>
  );
}
