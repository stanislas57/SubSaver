import * as React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/shared/NotificationCenter";

const NAV_LINKS: { to: string; label: string }[] = [
  { to: "/overview", label: "Vue d'ensemble" },
  { to: "/subscriptions", label: "Abonnements" },
  { to: "/analytics", label: "Analytique" },
  { to: "/calendar", label: "Calendrier" },
  { to: "/bank-connect", label: "Banque" },
  { to: "/premium", label: "Premium" },
];

/** Barre de navigation en Bleu Nuit plein : crée un contraste saisissant avec
 * le fond clair du contenu. Logo en version claire (le fond n'est plus blanc).
 *
 * En dessous de lg (1024px), les liens texte disparaissaient sans aucun
 * remplacement (bug QA) : un bouton hamburger ouvre désormais un panneau
 * déroulant thème clair ("Luxe Lumineux", fond clair/texte Bleu Nuit),
 * volontairement différent de la barre elle-même pour rester lisible et
 * cohérent avec le reste de l'app sur mobile. Le seuil est lg et non md :
 * entre 768 et 1024px, les 7 liens + logo + notifications + avatar + logout
 * ne tiennent pas sur une seule ligne (bug tablette QA), donc la tablette
 * bascule aussi sur le panneau hamburger plutôt que de casser visuellement. */
export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function goTo(to: string) {
    setMobileOpen(false);
    navigate(to);
  }

  /** Déconnexion -> retour à la landing page publique ("/"), pas à /login :
   * quitter délibérément l'app doit ramener vers l'accueil, pas vers un
   * formulaire de connexion vide. */
  function handleLogout() {
    setMobileOpen(false);
    logout();
    navigate("/", { replace: true });
  }

  return (
    <>
    <header className="fixed top-0 z-50 w-full border-b border-luxury-gold/20 bg-luxury-night/95 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button onClick={() => goTo("/overview")} className="flex items-center gap-3">
          <img src="/logo-dark-bg.svg" alt="SubSaver" width={32} height={32} className="h-8 w-auto" />
          <span className="text-sm font-bold tracking-tight text-slate-50 hidden sm:inline">SubSaver</span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "border-luxury-gold font-semibold text-luxury-gold"
                    : "border-transparent text-slate-300 hover:text-slate-50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <NotificationCenter triggerClassName="text-slate-300 hover:bg-white/10 hover:text-slate-50" />
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-luxury-gold/15 text-xs font-bold text-luxury-gold transition-colors duration-200 hover:bg-luxury-gold/25 lg:flex"
          >
            {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Déconnexion"
            className="hidden rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-slate-50 lg:flex"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Hamburger : uniquement en dessous de lg, seul point d'accès à la
           * navigation sur mobile/tablette depuis la disparition des liens texte. */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-100 transition-colors duration-200 hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>

      {/* Overlay : assombrit le contenu derrière le panneau mobile ouvert et
       * le referme au clic, comme n'importe quel menu superposé (évite
       * l'impression qu'il reste "flottant" au-dessus du contenu cliquable).
       * Rendu hors du <header> : `backdrop-blur-2xl` sur le header en ferait
       * le containing block de tout `fixed` descendant, ce qui bornerait
       * l'overlay à la hauteur du header (bug initial) au lieu de couvrir
       * tout le viewport sous la barre. */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 top-16 z-40 bg-luxury-night/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Panneau mobile : thème "Luxe Lumineux" (fond clair, texte Bleu Nuit),
       * volontairement distinct de la barre Bleu Nuit au-dessus. Positionné
       * en `fixed` (plutôt qu'en flux normal sous le header) puisqu'il est
       * maintenant un frère du header et non plus son enfant. */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-900/10 bg-luxury-bg px-4 py-4 shadow-luxury-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-luxury-gold-soft text-luxury-night"
                      : "text-luxury-text-light hover:bg-luxury-bg-soft hover:text-luxury-night"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-900/10 pt-3">
            <button
              onClick={() => goTo("/profile")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-3 py-2 text-sm font-medium text-luxury-text transition-colors hover:bg-luxury-bg-soft"
            >
              <UserIcon className="h-3.5 w-3.5" /> Profil
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
