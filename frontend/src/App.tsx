import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestOnlyRoute, PremiumOnlyRoute } from "@/routes/ProtectedRoute";
import { AdminRouteGuard } from "@/routes/AdminRouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageSpinner } from "@/components/ui/spinner";

import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { BankConnectPage } from "@/pages/BankConnectPage";
import { SubscriptionsPage } from "@/pages/SubscriptionsPage";
import { SubscriptionAddPage } from "@/pages/SubscriptionAddPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { PremiumPage } from "@/pages/PremiumPage";
import { LabComparatorPage } from "@/pages/LabComparatorPage";
import { LabCancellationPage } from "@/pages/LabCancellationPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SuccessPage } from "@/pages/SuccessPage";
import { SharedSubscriptionPage } from "@/pages/SharedSubscriptionPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";

// Chargée à la demande : recharts pèse lourd, le code-splitting évite de
// l'embarquer dans le bundle initial (gain net sur le premier chargement).
const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);

/** Redirige "/" vers "/overview" en conservant la query string (ex: si
 * Stripe redirige vers la racine du site avec ?premium=true, le paramètre
 * ne doit pas être perdu avant même que la page ne se charge). */
function RootRedirect() {
  const location = useLocation();
  return <Navigate to={`/overview${location.search}`} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Les données restent "fraîches" 1 min : évite les refetch redondants
      // à chaque navigation entre pages (source de latence perçue).
      staleTime: 60_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              {/* /login et /register ont chacun leur propre écran plein-page
                  (fond immersif Bleu Nuit pour /login, carte Luxe Lumineux
                  pour /register) : ni l'un ni l'autre ne passe par AuthLayout,
                  qui fournirait un logo/carte redondants avec les leurs. */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<AuthLayout />}>
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              {/* /success n'est qu'une cible de redirection pour Stripe, cf. SuccessPage.tsx */}
              <Route path="/success" element={<SuccessPage />} />

              <Route element={<AppLayout />}>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/bank-connect" element={<BankConnectPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/subscriptions/add" element={<SubscriptionAddPage />} />
                <Route
                  path="/analytics"
                  element={
                    <Suspense fallback={<PageSpinner label="Chargement de l'analytique…" />}>
                      <AnalyticsPage />
                    </Suspense>
                  }
                />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Routes Premium-only (Espace Particulier Premium + BtoB) */}
                <Route element={<PremiumOnlyRoute />}>
                  <Route path="/lab" element={<Navigate to="/lab/comparator" replace />} />
                  <Route path="/lab/comparator" element={<LabComparatorPage />} />
                  <Route path="/lab/shared" element={<SharedSubscriptionPage />} />
                  <Route path="/lab/cancellation" element={<LabCancellationPage />} />
                </Route>
              </Route>
            </Route>

            {/* Back-Office Super Admin : layout et garde totalement isolés du site public */}
            <Route element={<AdminRouteGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
