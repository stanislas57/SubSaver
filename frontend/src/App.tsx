import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestOnlyRoute, PremiumOnlyRoute } from "@/routes/ProtectedRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";

import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { BankConnectPage } from "@/pages/BankConnectPage";
import { SubscriptionsPage } from "@/pages/SubscriptionsPage";
import { SubscriptionAddPage } from "@/pages/SubscriptionAddPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { PremiumPage } from "@/pages/PremiumPage";
import { LabComparatorPage } from "@/pages/LabComparatorPage";
import { LabCancellationPage } from "@/pages/LabCancellationPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/bank-connect" element={<BankConnectPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/subscriptions/add" element={<SubscriptionAddPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Routes Premium-only (BtoB) */}
                <Route element={<PremiumOnlyRoute />}>
                  <Route path="/lab" element={<Navigate to="/lab/comparator" replace />} />
                  <Route path="/lab/comparator" element={<LabComparatorPage />} />
                  <Route path="/lab/cancellation" element={<LabCancellationPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
