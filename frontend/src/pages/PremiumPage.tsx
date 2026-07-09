import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Receipt,
  FileSpreadsheet,
  Landmark,
  Download,
  Lock,
} from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useExportSubscriptionsCsv, useSubscriptions } from "@/hooks/useSubscriptions";
import { STRIPE_BILLING_URL, STRIPE_CUSTOMER_PORTAL_URL } from "@/api/config";
import { cn } from "@/lib/utils";
import { PARTICULIER_TOOLS } from "@/lib/premiumTools";

const PRO_TOOLS = [
  {
    icon: FileSpreadsheet,
    title: "Extraction comptable",
    description: "Exporte tes dépenses récurrentes au format compatible avec ton logiciel comptable.",
  },
  {
    icon: Receipt,
    title: "Récupération de TVA",
    description: "Identifie automatiquement la TVA récupérable sur tes abonnements professionnels.",
  },
  {
    icon: Landmark,
    title: "Détection des frais bancaires",
    description: "Repère les frais et commissions bancaires cachés dans tes relevés.",
  },
];

export function PremiumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = !!user?.is_premium;
  const subscriptionsQuery = useSubscriptions();
  const exportCsv = useExportSubscriptionsCsv();
  const [showExportConfirm, setShowExportConfirm] = React.useState(false);

  /** Ouvre la modale de confirmation d'export CSV. Non-Premium -> Stripe. */
  function handleExportCsvClick() {
    if (!isPremium) {
      window.location.href = STRIPE_BILLING_URL;
      return;
    }
    setShowExportConfirm(true);
  }

  /** Confirme l'export et le déclenche réellement. */
  function confirmExportCsv() {
    setShowExportConfirm(false);
    exportCsv.mutate();
  }

  /** Redirige vers Stripe Billing/Portal selon le statut Premium. Pour
   * non-Premium: page d'achat. Pour Premium: portail client (gestion
   * facturation, annulation). */
  function handleManageSubscriptionClick() {
    if (isPremium) {
      window.location.href = STRIPE_CUSTOMER_PORTAL_URL;
    } else {
      window.location.href = STRIPE_BILLING_URL;
    }
  }

  /** Les 3 modules "Espace Particulier" ont désormais de vraies pages :
   * Premium -> navigation directe ; non-Premium -> redirection Stripe
   * (le cadenas les distingue visuellement avant même le clic). */
  function handleParticulierClick(path: string) {
    if (!isPremium) {
      window.location.href = STRIPE_BILLING_URL;
      return;
    }
    navigate(path);
  }

  return (
    <div className="w-full px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-gold-soft text-luxury-gold-deep">
          {isPremium ? <ShieldCheck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </div>

        {isPremium && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-luxury-night px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Statut : Membre Premium
          </span>
        )}

        <RevealText as="h1" className="break-words text-3xl font-black tracking-tight text-luxury-text sm:text-5xl lg:text-6xl">
          {isPremium ? "Tu es membre Premium" : "Passe au Premium"}
        </RevealText>
        <RevealText className="mx-auto mt-4 max-w-xl text-lg text-luxury-text-light">
          {isPremium
            ? "Profite du comparateur, de l'abonnement partagé illimité et des exports avancés."
            : "Débloque tous les outils pour réduire tes dépenses récurrentes, seul ou en entreprise."}
        </RevealText>
        <div className="mt-8 flex justify-center">
          <CTALink variant="solid" onClick={handleManageSubscriptionClick}>
            {isPremium ? "Gérer mon abonnement" : "Passer Premium"}
          </CTALink>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl">
        <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text">
          Espace Particulier
        </RevealText>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PARTICULIER_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile
                key={tool.title}
                onClick={() => handleParticulierClick(tool.path)}
                role="button"
                tabIndex={0}
                className={cn("relative cursor-pointer", !isPremium && "opacity-70")}
              >
                <AnimatePresence>
                  {!isPremium && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.4, rotate: -20 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-luxury-text">{tool.title}</h3>
                <p className="mt-1 text-sm text-luxury-text-light">{tool.description}</p>
              </BentoTile>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl">
        <div className="flex items-center gap-3">
          <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text">
            Espace Pro / BtoB
          </RevealText>
          <Building2 className="mb-1 h-6 w-6 text-luxury-text-light" />
        </div>
        <p className="mt-2 text-sm text-luxury-text-light">Pensé pour les indépendants et les entreprises.</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Export CSV : seul outil Pro réellement fonctionnel. Verrouillé tant que
           * non-Premium (clic -> Stripe), débloqué instantanément une fois Premium. */}
          <BentoTile
            onClick={handleExportCsvClick}
            role="button"
            tabIndex={0}
            className={cn(
              "relative",
              !isPremium
                ? "cursor-pointer opacity-70"
                : subscriptionsQuery.data?.length
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60"
            )}
          >
            <AnimatePresence>
              {!isPremium && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, rotate: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
                >
                  <Lock className="h-3.5 w-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-luxury-text">
              {exportCsv.isPending ? "Export en cours…" : "Export CSV"}
            </h3>
            <p className="mt-1 text-sm text-luxury-text-light">
              {isPremium ? "Exporte tous tes abonnements au format CSV." : "Fonctionnalité Premium — clique pour débloquer."}
            </p>
          </BentoTile>

          {/* Extraction comptable / TVA / Frais bancaires : en développement,
           * pas encore connectées à un backend -- indisponibles pour tout le
           * monde, y compris les membres Premium. Pas de cadenas : ce badge
           * viendrait laisser croire que Premium suffirait à les débloquer. */}
          {PRO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile key={tool.title} className="relative opacity-70">
                <div className="absolute right-6 top-6">
                  <span className="rounded-full border border-slate-900/10 bg-white shadow-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-luxury-text-light">
                    En développement
                  </span>
                </div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-luxury-text">{tool.title}</h3>
                <p className="mt-1 text-sm text-luxury-text-light">{tool.description}</p>
              </BentoTile>
            );
          })}
        </div>
      </div>

      {/* Modale de confirmation : Export CSV */}
      <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer et télécharger vos abonnements</DialogTitle>
            <DialogDescription>
              Voulez-vous générer et télécharger l'historique de vos abonnements au format CSV ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={confirmExportCsv} loading={exportCsv.isPending}>
              <Download className="h-4 w-4" /> Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
