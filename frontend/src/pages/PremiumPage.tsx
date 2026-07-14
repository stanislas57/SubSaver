import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, ShieldCheck, Building2, Download } from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { PremiumGate } from "@/components/shared/PremiumGate";
import { PremiumLockBadge } from "@/components/shared/PremiumLockBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useExportSubscriptionsExcel, useSubscriptions } from "@/hooks/useSubscriptions";
import { useExportAccounting } from "@/hooks/usePro";
import { getErrorMessage } from "@/api/axiosClient";
import { STRIPE_BILLING_URL, STRIPE_CUSTOMER_PORTAL_URL } from "@/api/config";
import { cn } from "@/lib/utils";
import { PARTICULIER_TOOLS, BTOB_TOOLS } from "@/lib/premiumTools";

const [ACCOUNTING_EXPORT_TOOL, VAT_RECOVERY_TOOL, BANK_FEES_TOOL] = BTOB_TOOLS;

const EXCEL_EXPORT_FEATURE = {
  title: "Export Excel",
  description: "Classeur Excel complet : abonnements, résumé par catégorie, partage et règlements.",
  benefits: [
    "4 onglets : résumé, abonnements, partage, règlements",
    "Généré à la demande, toujours à jour",
    "Compatible Excel et Google Sheets",
  ],
};

const ACCOUNTING_EXPORT_FEATURE = {
  icon: ACCOUNTING_EXPORT_TOOL.icon,
  title: ACCOUNTING_EXPORT_TOOL.title,
  description: ACCOUNTING_EXPORT_TOOL.description,
  benefits: [
    "Format français prêt pour ton comptable (TTC / HT / TVA)",
    "Un fichier, tous tes abonnements professionnels",
    "Gagne du temps à chaque clôture",
  ],
};

const VAT_RECOVERY_FEATURE = {
  icon: VAT_RECOVERY_TOOL.icon,
  title: VAT_RECOVERY_TOOL.title,
  description: VAT_RECOVERY_TOOL.description,
  benefits: [
    "Calcul automatique de la TVA récupérable",
    "Détail ligne par ligne, prêt à transmettre",
    "Taux standard français appliqué automatiquement",
  ],
};

const BANK_FEES_FEATURE = {
  icon: BANK_FEES_TOOL.icon,
  title: BANK_FEES_TOOL.title,
  description: BANK_FEES_TOOL.description,
  benefits: [
    "Repère agios, commissions et frais de rejet",
    "Analyse tout ton historique bancaire synchronisé",
    "Un seul prélèvement suspect suffit à être signalé",
  ],
};

export function PremiumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = !!user?.is_premium;
  const subscriptionsQuery = useSubscriptions();
  const exportExcel = useExportSubscriptionsExcel();
  const exportAccounting = useExportAccounting();
  const [showExportConfirm, setShowExportConfirm] = React.useState(false);

  /** Ouvre la modale de confirmation d'export Excel (Premium uniquement --
   * le paywall non-Premium est géré par PremiumGate autour de la tuile). */
  function handleExportExcelClick() {
    setShowExportConfirm(true);
  }

  /** Confirme l'export et le déclenche réellement. */
  function confirmExportExcel() {
    setShowExportConfirm(false);
    exportExcel.mutate(undefined, {
      onSuccess: () => toast.success("Classeur Excel téléchargé."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleAccountingExportClick() {
    exportAccounting.mutate(undefined, {
      onSuccess: () => toast.success("Extraction comptable téléchargée."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
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
                <PremiumLockBadge show={!isPremium} />
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
          {/* Export Excel */}
          <PremiumGate feature={EXCEL_EXPORT_FEATURE}>
            {({ isPremium: unlocked, guard }) => (
              <BentoTile
                onClick={guard(handleExportExcelClick)}
                role="button"
                tabIndex={0}
                className={cn(
                  "relative",
                  !unlocked ? "cursor-pointer opacity-70" : subscriptionsQuery.data?.length ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                )}
              >
                <PremiumLockBadge show={!unlocked} />
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-luxury-text">
                  {exportExcel.isPending ? "Export en cours…" : "Export Excel"}
                </h3>
                <p className="mt-1 text-sm text-luxury-text-light">
                  {unlocked
                    ? "Classeur Excel complet : abonnements, résumé par catégorie, partage et règlements."
                    : "Fonctionnalité Premium — clique pour débloquer."}
                </p>
              </BentoTile>
            )}
          </PremiumGate>

          {/* Extraction comptable : télécharge un CSV au format français
           * (TTC/HT/TVA) directement depuis la tuile, comme l'Export Excel. */}
          <PremiumGate feature={ACCOUNTING_EXPORT_FEATURE}>
            {({ isPremium: unlocked, guard }) => {
              const Icon = ACCOUNTING_EXPORT_TOOL.icon;
              return (
                <BentoTile
                  onClick={guard(handleAccountingExportClick)}
                  role="button"
                  tabIndex={0}
                  className={cn("relative cursor-pointer", !unlocked && "opacity-70")}
                >
                  <PremiumLockBadge show={!unlocked} />
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-luxury-text">
                    {exportAccounting.isPending ? "Génération en cours…" : ACCOUNTING_EXPORT_TOOL.title}
                  </h3>
                  <p className="mt-1 text-sm text-luxury-text-light">
                    {unlocked ? ACCOUNTING_EXPORT_TOOL.description : "Fonctionnalité Premium — clique pour débloquer."}
                  </p>
                </BentoTile>
              );
            }}
          </PremiumGate>

          {/* Récupération de TVA : ouvre le rapport dédié (/pro/vat-recovery). */}
          <PremiumGate feature={VAT_RECOVERY_FEATURE}>
            {({ isPremium: unlocked, guard }) => {
              const Icon = VAT_RECOVERY_TOOL.icon;
              return (
                <BentoTile
                  onClick={guard(() => navigate(VAT_RECOVERY_TOOL.path))}
                  role="button"
                  tabIndex={0}
                  className={cn("relative cursor-pointer", !unlocked && "opacity-70")}
                >
                  <PremiumLockBadge show={!unlocked} />
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-luxury-text">{VAT_RECOVERY_TOOL.title}</h3>
                  <p className="mt-1 text-sm text-luxury-text-light">
                    {unlocked ? VAT_RECOVERY_TOOL.description : "Fonctionnalité Premium — clique pour débloquer."}
                  </p>
                </BentoTile>
              );
            }}
          </PremiumGate>

          {/* Détection des frais bancaires : ouvre le rapport dédié (/pro/bank-fees). */}
          <PremiumGate feature={BANK_FEES_FEATURE}>
            {({ isPremium: unlocked, guard }) => {
              const Icon = BANK_FEES_TOOL.icon;
              return (
                <BentoTile
                  onClick={guard(() => navigate(BANK_FEES_TOOL.path))}
                  role="button"
                  tabIndex={0}
                  className={cn("relative cursor-pointer", !unlocked && "opacity-70")}
                >
                  <PremiumLockBadge show={!unlocked} />
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-luxury-text">{BANK_FEES_TOOL.title}</h3>
                  <p className="mt-1 text-sm text-luxury-text-light">
                    {unlocked ? BANK_FEES_TOOL.description : "Fonctionnalité Premium — clique pour débloquer."}
                  </p>
                </BentoTile>
              );
            }}
          </PremiumGate>
        </div>
      </div>

      {/* Modale de confirmation : Export Excel */}
      <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer et télécharger vos abonnements</DialogTitle>
            <DialogDescription>
              Voulez-vous générer et télécharger un classeur Excel complet de vos abonnements (résumé, catégories,
              partage et règlements) ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={confirmExportExcel} loading={exportExcel.isPending}>
              <Download className="h-4 w-4" /> Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
