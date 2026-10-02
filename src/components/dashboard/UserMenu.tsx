import { ChevronRight, UserRound } from "@/components/icons";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

/**
 * Wajah user: maskot hewan kalau sudah dipilih di halaman Profil, kalau belum
 * pakai inisial nama.
 */
function Avatar({
  emoji,
  initial,
  className,
}: {
  emoji: string | null;
  initial: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-accent leading-none text-accent-foreground",
        className,
      )}
    >
      {emoji ? (
        emoji
      ) : (
        <span className="font-black">{initial}</span>
      )}
    </span>
  );
}

/**
 * Pintu masuk ke halaman Profil. Sebelumnya ini dropdown berisi pintasan yang
 * sudah ada di sidebar; sekarang satu klik langsung ke halaman profil, tempat
 * maskot, nama tampilan, dan tombol keluar tinggal.
 */
export function UserMenu({
  variant = "card",
}: {
  variant?: "card" | "compact";
}) {
  const profile = useProfile();

  if (variant === "compact") {
    return (
      <Link
        to="/dashboard/profil"
        aria-label="Profil kamu"
        className="clay-sm clay-press grid size-8 place-items-center"
      >
        <Avatar
          emoji={profile.avatar}
          initial={profile.initial}
          className="size-6 rounded-lg text-sm"
        />
      </Link>
    );
  }

  return (
    <Link
      to="/dashboard/profil"
      className="clay-sm clay-press flex w-full items-center gap-3 p-3 text-left"
    >
      <Avatar
        emoji={profile.avatar}
        initial={profile.initial}
        className="size-9 text-lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{profile.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {profile.email ?? "Masuk sebagai tamu"}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default UserMenu;

/** Ditampilkan kalau data user belum datang, biar sidebar tidak "melompat". */
export function UserMenuSkeleton() {
  return (
    <div className="clay-sm flex items-center gap-3 p-3">
      <span className="grid size-9 shrink-0 animate-pulse rounded-xl bg-muted" />
      <span className="min-w-0 flex-1 space-y-2">
        <span className="block h-3 w-24 animate-pulse rounded-full bg-muted" />
        <span className="block h-2.5 w-32 animate-pulse rounded-full bg-muted" />
      </span>
      <UserRound className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
