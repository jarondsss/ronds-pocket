import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  History,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
} from "@/components/icons";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

function Avatar({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-accent font-black text-accent-foreground",
        className,
      )}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Menu profil: satu tempat untuk lihat siapa yang sedang masuk dan untuk keluar.
 * Dipakai dua kali — sebagai kartu lebar di sidebar desktop, dan sebagai
 * tombol avatar bulat di header HP.
 */
export function UserMenu({
  variant = "card",
}: {
  variant?: "card" | "compact";
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  const name = user?.name ?? user?.email?.split("@")[0] ?? "Pengguna";
  const email = user?.email ?? "Masuk sebagai tamu";

  const handleSignOut = async () => {
    setIsLeaving(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setIsLeaving(false);
    }
  };

  const menuItems = (
    <>
      <DropdownMenuLabel className="font-normal">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className="block truncate text-xs font-medium text-muted-foreground">
          {email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="gap-2 font-semibold">
        <Link to="/dashboard">
          <LayoutDashboard className="size-4" />
          Transaksi
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="gap-2 font-semibold">
        <Link to="/dashboard/riwayat">
          <History className="size-4" />
          Riwayat
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="gap-2 font-semibold">
        <Link to="/dashboard/partner">
          <Users className="size-4" />
          Sharing
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        className="gap-2 font-semibold"
        onSelect={(event) => {
          event.preventDefault();
          void handleSignOut();
        }}
      >
        <LogOut className="size-4" />
        Keluar
      </DropdownMenuItem>
    </>
  );

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu profil"
            className="clay-sm clay-press grid size-8 place-items-center"
            disabled={isLeaving}
          >
            <Avatar label={name} className="size-5 text-[11px] rounded-lg" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="clay-sm clay-press flex w-full items-center gap-3 p-3 text-left"
          disabled={isLeaving}
        >
          <Avatar label={name} className="size-9 text-sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {email}
            </span>
          </span>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;

/** Ditampilkan kalau data user belum arrive, biar sidebar tidak "melompat". */
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