import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, userService } from "@/services";
import { getErrorMessage } from "@/api/axiosClient";
import { TOKEN_STORAGE_KEY } from "@/api/config";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginError: string | null;
  registerError: string | null;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isVerifyingOtp: boolean;
  otpError: string | null;
  otpPhoneMasked: string | null;
  otpAttemptsRemaining: number;
  isOtpStep: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, phone: string) => Promise<void>;
  verifyOtp: (email: string, phone: string, otpCode: string) => Promise<void>;
  clearOtpState: () => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = React.useState(() => !!localStorage.getItem(TOKEN_STORAGE_KEY));
  const [otpPhoneMasked, setOtpPhoneMasked] = React.useState<string | null>(null);
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = React.useState(3);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      queryClient.setQueryData(["me"], data.user);
      setHasToken(true);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, firstName, phone }: { email: string; password: string; firstName: string; phone: string }) =>
      authService.register(email, password, firstName, phone),
    onSuccess: (data) => {
      setOtpPhoneMasked(data.phone_masked);
      setOtpAttemptsRemaining(data.attempts_remaining);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, phone, otpCode }: { email: string; phone: string; otpCode: string }) =>
      authService.verifyOtp(email, phone, otpCode),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      queryClient.setQueryData(["me"], data.user);
      setHasToken(true);
      setOtpPhoneMasked(null);
    },
  });

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setHasToken(false);
    queryClient.setQueryData(["me"], null);
    queryClient.clear();
  }, [queryClient]);

  const clearOtpState = React.useCallback(() => {
    setOtpPhoneMasked(null);
    setOtpAttemptsRemaining(3);
    registerMutation.reset();
    verifyOtpMutation.reset();
  }, [registerMutation, verifyOtpMutation]);

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isLoading: hasToken && meQuery.isPending,
    isAuthenticated: hasToken && !!meQuery.data,
    loginError: loginMutation.error ? getErrorMessage(loginMutation.error, "Identifiants incorrects.") : null,
    registerError: registerMutation.error
      ? getErrorMessage(registerMutation.error, "Impossible de créer le compte.")
      : null,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    otpError: verifyOtpMutation.error
      ? getErrorMessage(verifyOtpMutation.error, "Code OTP invalide ou expiré.")
      : null,
    otpPhoneMasked,
    otpAttemptsRemaining,
    isOtpStep: !!otpPhoneMasked,
    login: async (email, password) => {
      await loginMutation.mutateAsync({ email, password });
    },
    register: async (email, password, firstName, phone) => {
      await registerMutation.mutateAsync({ email, password, firstName, phone });
    },
    verifyOtp: async (email, phone, otpCode) => {
      await verifyOtpMutation.mutateAsync({ email, phone, otpCode });
    },
    clearOtpState,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthProvider");
  return ctx;
}
