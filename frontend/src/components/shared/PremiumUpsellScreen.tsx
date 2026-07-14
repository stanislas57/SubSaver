import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { CTALink } from "@/components/shared/CTALink";
import { PARTICULIER_TOOLS, BTOB_TOOLS } from "@/lib/premiumTools";
import { STRIPE_BILLING_URL } from "@/api/config";

/** Paywall contextuel : affiché à la place d'un outil Premium plutôt que de
 * rediriger instantanément et silencieusement vers Stripe (ancien comportement
 * de PremiumOnlyRoute). L'utilisateur voit ce qu'il débloquerait -- avec le
 * contenu réel de l'outil qu'il vient de cliquer, pas un message générique --
 * et ne part vers le paiement qu'en cliquant explicitement "Passer Premium".
 * Cherche dans PARTICULIER_TOOLS puis BTOB_TOOLS (les deux familles de routes
 * derrière PremiumOnlyRoute) : couvre aussi bien /lab/* que /pro/*. */
export function PremiumUpsellScreen() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tool =
    PARTICULIER_TOOLS.find((t) => pathname.startsWith(t.path)) ??
    BTOB_TOOLS.find((t) => "path" in t && pathname.startsWith(t.path));
  const Icon = tool?.icon ?? ShieldCheck;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
        <Icon className="h-6 w-6" />
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-luxury-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-luxury-gold-deep">
        Fonctionnalité Premium
      </span>
      <h1 className="mt-4 max-w-md text-2xl font-black tracking-tight text-luxury-text sm:text-3xl">
        {tool?.title ?? "Cet outil fait partie du Premium"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-luxury-text-light">
        {tool?.description ?? "Débloque tous les outils pour réduire tes dépenses récurrentes."}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <CTALink variant="solid" onClick={() => (window.location.href = STRIPE_BILLING_URL)}>
          Passer Premium
        </CTALink>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-luxury-text-light transition-colors hover:text-luxury-text"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
      </div>
    </div>
  );
}
