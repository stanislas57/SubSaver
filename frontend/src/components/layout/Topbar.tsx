import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";

const TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/subscriptions": "Abonnements",
  "/analytics": "Analytique",
  "/calendar": "Calendrier",
  "/lab": "Laboratoire",
  "/premium": "Premium",
  "/profile": "Profil",
};

export function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = TITLES[pathname] ?? "SubServer";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-display text-lg font-bold text-text-main">{title}</h1>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <NotificationCenter />
        <ThemeToggle />
        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-light font-display text-sm font-bold text-primary">
          {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
