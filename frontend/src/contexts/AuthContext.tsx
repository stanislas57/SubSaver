import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { axiosClient, getErrorMessage } from "@/api/axiosClient";
import { TOKEN_STORAGE_KEY } from "@/api/config";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  isLoggingIn: boolean;
  loginError: string | null;
  register: (email: string, password: string, firstName: string) => Promise<void>;
  isRegistering: boolean;
  registerError: string | null;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = React.useState(() => !!localStorage.getItem(TOKEN_STORAGE_KEY));

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    enabled: hasToken,
    retry: false,
  });

  // Si le token est invalide (401), l'intercepteur axios le supprime déjà ;
  // on synchronise l'état local pour renvoyer vers /login proprement.
  React.useEffect(() => {
    if (meQuery.isError) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setHasToken(false);
    }
  }, [meQuery.isError]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      queryClient.setQueryData(["me"], data.user);
      setHasToken(true);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, firstName }: { email: string; password: string; firstName: string }) =>
      authService.register(email, password, firstName),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      queryClient.setQueryData(["me"], data.user);
      setHasToken(true);
    },
  });

  async function login(email: string, password: string) {
    await loginMutation.mutateAsync({ email, password });
  }

  async function register(email: string, password: string, firstName: string) {
    await registerMutation.mutateAsync({ email, password, firstName });
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setHasToken(false);
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.clear();
    delete axiosClient.defaults.headers.common.Authorization;
  }

  const value: AuthContextValue = {
    user: meQuery.data,
    isAuthenticated: hasToken && !!meQuery.data,
    isLoading: hasToken && meQuery.isPending,
    login,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.isError ? getErrorMessage(loginMutation.error, "Identifiants invalides.") : null,
    register,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.isError ? getErrorMessage(registerMutation.error, "Impossible de créer le compte.") : null,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>.");
  return ctx;
}
