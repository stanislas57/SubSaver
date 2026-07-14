import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestOnlyRoute, PremiumOnlyRoute } from "@/routes/ProtectedRoute";
import { AdminRouteGuard } from "@/routes/AdminRouteGuard";
import { PageSpinner } from "@/components/ui/spinner";

// Les layouts authentifiés (AppLayout embarque framer-motion, AdminLayout
// est réservé au back-office) ne servent jamais un visiteur anonyme sur "/" :
// les charger à la demande les sort du bundle initial.
const AuthLayout = lazy(() =>
  import("@/layouts/AuthLayout").then((m) => ({ default: m.AuthLayout }))
);
const AppLayout = lazy(() => import("@/layouts/AppLayout").then((m) => ({ default: m.AppLayout })));
const AdminLayout = lazy(() =>
  import("@/layouts/AdminLayout").then((m) => ({ default: m.AdminLayout }))
);

// La landing page reste en import statique : c'est la route "/" servie aux
// visiteurs non connectés (SEO, LCP) - elle doit être prête dans le bundle
// initial sans aller-retour réseau supplémentaire.
import { LandingPage } from "@/pages/LandingPage";

// Toutes les autres pages sont chargées à la demande : chacune ne pèse sur
// le téléchargement qu'au moment où l'utilisateur navigue réellement vers sa
// route, ce qui réduit fortement le JS inutilisé au premier chargement.
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const OverviewPage = lazy(() =>
  import("@/pages/OverviewPage").then((m) => ({ default: m.OverviewPage }))
);
const BankConnectPage = lazy(() =>
  import("@/pages/BankConnectPage").then((m) => ({ default: m.BankConnectPage }))
);
const SubscriptionsPage = lazy(() =>
  import("@/pages/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage }))
);
const SubscriptionAddPage = lazy(() =>
  import("@/pages/SubscriptionAddPage").then((m) => ({ default: m.SubscriptionAddPage }))
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);
const PremiumPage = lazy(() =>
  import("@/pages/PremiumPage").then((m) => ({ default: m.PremiumPage }))
);
const LabComparatorPage = lazy(() =>
  import("@/pages/LabComparatorPage").then((m) => ({ default: m.LabComparatorPage }))
);
const LabCancellationPage = lazy(() =>
  import("@/pages/LabCancellationPage").then((m) => ({ default: m.LabCancellationPage }))
);
const VatRecoveryPage = lazy(() =>
  import("@/pages/VatRecoveryPage").then((m) => ({ default: m.VatRecoveryPage }))
);
const BankFeesPage = lazy(() =>
  import("@/pages/BankFeesPage").then((m) => ({ default: m.BankFeesPage }))
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const SuccessPage = lazy(() =>
  import("@/pages/SuccessPage").then((m) => ({ default: m.SuccessPage }))
);
const SharedSubscriptionPage = lazy(() =>
  import("@/pages/SharedSubscriptionPage").then((m) => ({ default: m.SharedSubscriptionPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage }))
);
const AdminAnalyticsPage = lazy(() =>
  import("@/pages/admin/AdminAnalyticsPage").then((m) => ({ default: m.AdminAnalyticsPage }))
);
const PrivacyPage = lazy(() =>
  import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))
);
const MentionsLegalesPage = lazy(() =>
  import("@/pages/MentionsLegalesPage").then((m) => ({ default: m.MentionsLegalesPage }))
);
// Article de contenu public (SEO) : chargé à la demande comme le reste, mais
// route top-level hors ProtectedRoute -- cf. son commentaire de tête.
const GuideAbonnementsPage = lazy(() =>
  import("@/pages/GuideAbonnementsPage").then((m) => ({ default: m.GuideAbonnementsPage }))
);

// Chargée à la demande : recharts pèse lourd, le code-splitting évite de
// l'embarquer dans le bundle initial (gain net sur le premier chargement).
const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);

/** "/" sert la landing page publique aux visiteurs, et redirige les
 * utilisateurs déjà connectés vers "/overview" -- avant cette page, la racine
 * redirigeait systématiquement vers /overview, ce qui laissait tout visiteur
 * non authentifié atterrir directement sur l'écran de connexion. */
function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner label="Chargement…" />;
  if (isAuthenticated) return <Navigate to={`/overview${location.search}`} replace />;

  return <LandingPage />;
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageSpinner label="Chargement…" />}>
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
                {/* /dashboard était une seconde page d'accueil, redondante avec
                 * /overview (mêmes métriques, présentation marketing en plus) et
                 * jamais reliée depuis la navigation -- fusionnée dans /overview,
                 * cette route ne sert plus qu'à ne pas casser d'anciens liens. */}
                <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
                <Route path="/bank-connect" element={<BankConnectPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/subscriptions/add" element={<SubscriptionAddPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Routes Premium-only (Espace Particulier Premium + BtoB) */}
                <Route element={<PremiumOnlyRoute />}>
                  <Route path="/lab" element={<Navigate to="/lab/comparator" replace />} />
                  <Route path="/lab/comparator" element={<LabComparatorPage />} />
                  <Route path="/lab/shared" element={<SharedSubscriptionPage />} />
                  <Route path="/lab/cancellation" element={<LabCancellationPage />} />
                  <Route path="/pro/vat-recovery" element={<VatRecoveryPage />} />
                  <Route path="/pro/bank-fees" element={<BankFeesPage />} />
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

            <Route path="/" element={<RootPage />} />
            <Route path="/guide-abonnements" element={<GuideAbonnementsPage />} />
            {/* Publique (hors ProtectedRoute) : une politique de confidentialité doit
             * rester consultable sans compte, pour Google comme pour un visiteur. */}
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* Publique (hors ProtectedRoute) : la LCEN exige un accès direct et
             * permanent aux mentions légales, sans compte ni connexion. */}
            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
