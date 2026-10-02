import { useAuth } from "@/hooks/use-auth";
import { initialOf } from "@/lib/avatars";

/**
 * Data profil untuk UI: nama tampilan (pilihan user dulu, baru nama akun, baru
 * email), maskot avatar, dan status akun tamu.
 */
export function useProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const email = user?.email ?? null;
  const name =
    user?.display_name ??
    user?.name ??
    (email ? email.split("@")[0] : "Pengguna");

  return {
    isLoading,
    isAuthenticated,
    email,
    name,
    initial: initialOf(name),
    avatar: user?.avatar ?? null,
    isAnonymous: user?.isAnonymous === true,
  };
}
