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
  verifyEmail: (email: string, code: string) => Promise<void>;
  isVerifyingEmail: boolean;
  verifyEmailError: string | null;
  resendCode: (email: string) => Promise<void>;
  isResendingCode: boolean;
  forgotPassword: (email: string) => Promise<void>;
  isSendingResetCode: boolean;
  forgotPasswordError: string | null;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  isResettingPassword: boolean;
  resetPasswordError: string | null;
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

  function applyAuthResponse(data: { access_token: string; user: User }) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    queryClient.setQueryData(["me"], data.user);
    setHasToken(true);
  }

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password),
    onSuccess: applyAuthResponse,
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, firstName }: { email: string; password: string; firstName: string }) =>
      authService.register(email, password, firstName),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => authService.verifyEmail(email, code),
    onSuccess: applyAuthResponse,
  });

  const resendCodeMutation = useMutation({
    mutationFn: (email: string) => authService.resendCode(email),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, code, newPassword }: { email: string; code: string; newPassword: string }) =>
      authService.resetPassword(email, code, newPassword),
  });

  async function login(email: string, password: string) {
    await loginMutation.mutateAsync({ email, password });
  }

  async function register(email: string, password: string, firstName: string) {
    await registerMutation.mutateAsync({ email, password, firstName });
  }

  async function verifyEmail(email: string, code: string) {
    await verifyEmailMutation.mutateAsync({ email, code });
  }

  async function resendCode(email: string) {
    await resendCodeMutation.mutateAsync(email);
  }

  async function forgotPassword(email: string) {
    await forgotPasswordMutation.mutateAsync(email);
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    await resetPasswordMutation.mutateAsync({ email, code, newPassword });
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
    verifyEmail,
    isVerifyingEmail: verifyEmailMutation.isPending,
    verifyEmailError: verifyEmailMutation.isError ? getErrorMessage(verifyEmailMutation.error, "Code invalide.") : null,
    resendCode,
    isResendingCode: resendCodeMutation.isPending,
    forgotPassword,
    isSendingResetCode: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.isError ? getErrorMessage(forgotPasswordMutation.error) : null,
    resetPassword,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.isError ? getErrorMessage(resetPasswordMutation.error, "Code invalide.") : null,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>.");
  return ctx;
}
