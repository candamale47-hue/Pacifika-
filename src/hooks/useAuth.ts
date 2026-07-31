import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin";
  unionId?: string;
}

export function useAuth() {
  const utils = trpc.useUtils();

  const { data: oauthUser, isLoading: oauthLoading } = trpc.auth.me.useQuery(
    undefined,
    { retry: false, refetchOnWindowFocus: false }
  );

  const { data: localUser, isLoading: localLoading } =
    trpc.localAuth.me.useQuery(undefined, {
      retry: false,
      refetchOnWindowFocus: false,
    });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  const isLoading = oauthLoading || localLoading;

  // Prefer local auth user if available, fall back to OAuth
  const rawUser = localUser || oauthUser;

  const user: AuthUser | null = rawUser
    ? {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        avatar: (rawUser as Record<string, unknown>).avatar as string | null,
        role: rawUser.role as "user" | "admin",
      }
    : null;

  const logout = useCallback(() => {
    // Always clear local auth token
    localStorage.removeItem("local_auth_token");
    // Always call OAuth logout (clears cookie)
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        window.location.reload();
      },
    });
  }, [logoutMutation]);

  return {
    user,
    isLoading,
    logout,
    isAdmin: user?.role === "admin",
    isLoggedIn: !!user,
  };
}
