import { ClayLoader } from "@/components/ClayLoader";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { ANIMAL_AVATARS } from "@/lib/avatars";
import { toastError } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import { ShieldCheck, Loader2, LogOut, Moon, Sun, Trash2 } from "@/components/icons";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const NAME_MAX_LENGTH = 24;

export default function Profile() {
  const profile = useProfile();
  const { signOut } = useAuth();
  const saveProfile = useMutation(api.profile.update);
  const setPasswordAction = useAction(api.profile.setPassword);
  const deleteAccountMutation = useMutation(api.profile.deleteAccount);
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const confirm = useConfirm();

  // Draft lokal: null berarti "belum disentuh", jadi nilai dari server selalu
  // dipakai sampai user benar-benar mengubahnya. Tidak perlu effect reset.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  const name = nameDraft ?? profile.name;
  const avatar = avatarDraft ?? profile.avatar;
  const isDirty =
    name.trim() !== profile.name || (avatar ?? null) !== (profile.avatar ?? null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile({
        displayName: name,
        avatar: avatar ?? undefined,
      });
      setNameDraft(null);
      setAvatarDraft(null);
      toast.success("Profil disimpan");
    } catch (caught) {
      toastError(caught, "Profilnya belum tersimpan. Coba lagi ya.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasEmail = !profile.isAnonymous && Boolean(profile.email);
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  const handleSetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSettingPassword(true);
    try {
      await setPasswordAction({ password: pw.trim() });
      setPw("");
      setPwConfirm("");
      toast.success("Kata sandi tersimpan. Mulai sekarang bisa masuk pakai email dan kata sandi.");
    } catch (caught) {
      toastError(caught, "Kata sandinya belum tersimpan. Coba lagi ya.");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsLeaving(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (caught) {
      toastError(caught, "Gagal keluar. Coba lagi ya.");
      setIsLeaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Hapus akun secara permanen?",
      description:
        "Semua data kamu akan dihapus dan tidak bisa dikembalikan: kantong, transaksi, dompet, anggaran, goals, tabungan, dan riwayat.",
      confirmLabel: "Hapus akun",
      tone: "destructive",
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteAccountMutation();
      await signOut();
      navigate("/", { replace: true });
      toast.success("Akun berhasil dihapus.");
    } catch (caught) {
      toastError(caught, "Gagal menghapus akun. Coba lagi ya.");
      setIsDeleting(false);
    }
  };

  if (profile.isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <ClayLoader label="Memuat profil..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Profil kamu
        </h1>
        <p className="text-sm text-muted-foreground">
          Ganti maskot dan nama yang muncul saat kamu catat bareng.
        </p>
      </header>

      {/* Ringkasan: bentuk akhir dari pilihan di bawah, langsung kelihatan. */}
      <section className="clay flex items-center gap-4 p-5 sm:p-6">
        <span className="clay-primary grid size-16 shrink-0 place-items-center rounded-3xl text-3xl leading-none">
          {avatar ?? (
            <span className="font-display text-2xl font-black">
              {profile.initial}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email ?? "Masuk sebagai tamu"}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-income">
            <ShieldCheck className="size-3.5" />
            {profile.isAnonymous ? "Akun tamu" : "Akun email"}
          </span>
        </div>
      </section>

      {/* Maskot */}
      <section className="clay p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold">Maskot kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih satu hewan buat jadi wajahmu di kantong bersama.
        </p>
        <div className="clay-sunken mt-4 grid grid-cols-4 gap-2 p-3 sm:grid-cols-8">
          {ANIMAL_AVATARS.map((item) => {
            const selected = avatar === item.emoji;
            return (
              <button
                key={item.emoji}
                type="button"
                onClick={() => setAvatarDraft(item.emoji)}
                aria-pressed={selected}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "clay-press grid aspect-square place-items-center rounded-2xl text-2xl leading-none transition-colors",
                  selected
                    ? "clay-primary text-2xl"
                    : "bg-secondary/60 hover:bg-secondary",
                )}
              >
                {item.emoji}
              </button>
            );
          })}
        </div>
        {avatar && (
          <button
            type="button"
            onClick={() => setAvatarDraft("")}
            className="mt-3 text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Pakai inisial nama saja
          </button>
        )}
      </section>

      {/* Nama tampilan */}
      <section className="clay p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold">Nama tampilan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nama ini yang muncul di notifikasi dan riwayat saat kamu mencatat
          bareng orang lain.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="display-name" className="text-xs font-bold">
              Nama
            </Label>
            <Input
              id="display-name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              autoComplete="nickname"
              onChange={(event) => setNameDraft(event.target.value)}
              className="mt-2"
            />
            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
              Maksimal {NAME_MAX_LENGTH} huruf.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !isDirty}
            className="h-11 sm:w-32"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Simpan"
            )}
          </Button>
        </div>
      </section>

      {/* Tampilan */}
      <section className="clay p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold">Tampilan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih tema terang, gelap, atau ikuti pengaturan perangkat.
        </p>
        <div className="clay-sunken mt-4 grid grid-cols-3 gap-1.5 p-1.5">
          {([
            { value: "light", label: "Terang", Icon: Sun },
            { value: "dark", label: "Gelap", Icon: Moon },
            { value: "system", label: "Sistem", Icon: null },
          ] as const).map((item) => {
            const active = theme === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTheme(item.value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold transition-colors sm:text-sm",
                  active
                    ? "clay-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.Icon && <item.Icon className="size-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Akun */}
      <section className="clay p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold">Akun</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.isAnonymous
            ? "Kamu masuk sebagai tamu. Catatanmu tetap tersimpan di perangkat sesi ini."
            : "Masuk pakai email dan kode enam digit."}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-sm font-semibold">
            {profile.email ?? "Tanpa email"}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSignOut()}
            disabled={isLeaving}
            className="text-destructive hover:text-destructive sm:w-32"
          >
            {isLeaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <LogOut className="size-4" />
                Keluar
              </>
            )}
          </Button>
        </div>

        {hasEmail && (
          <form onSubmit={handleSetPassword} className="clay-mt-5 mt-5 border-t border-border pt-5">
            <h3 className="text-sm font-bold">Kata sandi</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Kalau mau, buat kata sandi supaya bisa masuk cukup pakai email
              dan kata sandi — tanpa kode.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Label htmlFor="pw" className="text-xs font-bold">
                  Kata sandi baru
                </Label>
                <Input
                  id="pw"
                  type="password"
                  autoComplete="new-password"
                  value={pw}
                  minLength={8}
                  required
                  onChange={(event) => setPw(event.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="pw-confirm" className="text-xs font-bold">
                  Ulangi kata sandi
                </Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  minLength={8}
                  required
                  onChange={(event) => setPwConfirm(event.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            {pwConfirm && pw !== pwConfirm && (
              <p className="mt-2 text-xs font-medium text-destructive">
                Kata sandinya belum sama.
              </p>
            )}
            <Button
              type="submit"
              className="mt-4"
              disabled={isSettingPassword || pw.length < 8 || pw !== pwConfirm}
            >
              {isSettingPassword ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Buat kata sandi"
              )}
            </Button>
          </form>
        )}
      </section>

      {/* Zona bahaya */}
      <section className="clay border border-destructive/20 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-destructive">
          Zona bahaya
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Menghapus akun akan menghilangkan semua data secara permanen. Tindakan
          ini tidak bisa dibatalkan.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleDeleteAccount()}
          disabled={isDeleting}
          className="mt-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="size-4" />
              Hapus akun
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
