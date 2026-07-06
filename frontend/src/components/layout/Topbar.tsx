import { useEffect, useRef } from "react";
import gsap from "gsap";
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
  "/premium": "Premium",
  "/profile": "Profil",
};

export function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = TITLES[pathname] ?? "SubServer";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
  }, []);

  return (
    <header
      ref={ref}
      className="flex h-20 shrink-0 items-center justify-between rounded-3xl border border-border/60 bg-surface/60 px-8 shadow-md backdrop-blur-xl"
    >
      <h1 className="font-display text-lg font-bold text-text-main">{title}</h1>
      <div className="flex items-center gap-3.5">
        <LanguageSwitcher />
        <NotificationCenter />
        <ThemeToggle />
        <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-display text-sm font-bold text-primary shadow-sm">
          {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
