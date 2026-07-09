import { ShieldCheck, KeyRound, CreditCard, DoorClosed, ScanSearch, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BankSecurityAssuranceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onLater: () => void;
  connecting?: boolean;
}

/** Badge de statut ("Certifié" / "Impossible" / "Protégé") apposé sur chaque
 * garantie -- lisible en un coup d'œil, sans avoir à lire la phrase entière. */
function GuaranteeBadge({ tone, label }: { tone: "certified" | "impossible" | "protected"; label: string }) {
  const toneClasses: Record<typeof tone, string> = {
    certified: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    impossible: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
    protected: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  };
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

/** Ligne de garantie technique : icône, titre, description, badge de statut. */
function GuaranteeRow({
  icon: Icon,
  title,
  description,
  tone,
  badgeLabel,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  tone: "certified" | "impossible" | "protected";
  badgeLabel: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-900/5 bg-luxury-bg/60 p-3.5">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-luxury-night text-luxury-gold">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-luxury-text">{title}</p>
          <GuaranteeBadge tone={tone} label={badgeLabel} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-luxury-text-light">{description}</p>
      </div>
    </li>
  );
}

/** Pop-up de réassurance maximale affiché juste avant le lancement du flow
 * Powens (avant redirection vers webview_url). Objectif : lever 100% des
 * doutes sur la sécurité en explicitant l'autorité de tutelle (ACPR, DSP2)
 * et le cloisonnement technique des données (identifiants, IBAN, virements),
 * plutôt que la version courte de BankConnectPromptModal qui sert, elle, de
 * simple relance ponctuelle post-onboarding. */
export function BankSecurityAssuranceModal({ open, onOpenChange, onConfirm, onLater, connecting }: BankSecurityAssuranceModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onLater()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Une connexion blindée et certifiée</DialogTitle>
          <DialogDescription>
            Avant de continuer, voici exactement ce que SubSaver peut voir — et surtout, ce qu'il ne pourra jamais voir
            ni faire.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-xl bg-luxury-night px-4 py-3 text-luxury-gold">
          <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <p className="text-xs leading-relaxed text-luxury-gold/90">
            La technologie de connexion est opérée par <strong className="text-luxury-gold">Powens</strong>,
            établissement de paiement agréé par l'<strong className="text-luxury-gold">ACPR</strong> (Autorité de
            Contrôle Prudentiel et de Résolution, organe de supervision de la Banque de France), dans le strict
            respect de la directive européenne <strong className="text-luxury-gold">DSP2</strong>.
          </p>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-luxury-text-light">
          Ce que nous ne voyons jamais
        </p>
        <ul className="mt-2.5 space-y-2.5">
          <GuaranteeRow
            icon={KeyRound}
            title="Zéro identifiant"
            description="Vos identifiants et mots de passe bancaires restent cryptés chez votre banque. SubSaver ne les connaît pas et ne les stocke jamais."
            tone="protected"
            badgeLabel="Protégé"
          />
          <GuaranteeRow
            icon={CreditCard}
            title="Zéro coordonnée bancaire"
            description="L'application n'a jamais accès à vos coordonnées structurelles : votre RIB et votre IBAN restent totalement invisibles."
            tone="impossible"
            badgeLabel="Impossible"
          />
          <GuaranteeRow
            icon={DoorClosed}
            title="Aucun accès à votre environnement bancaire"
            description="Nous ne pénétrons à aucun moment dans votre espace personnel. Impossible de consulter vos soldes, d'effectuer un virement, de déplacer de l'argent ou de modifier vos comptes."
            tone="impossible"
            badgeLabel="Impossible"
          />
        </ul>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-luxury-text-light">Ce que nous lisons</p>
        <ul className="mt-2.5">
          <GuaranteeRow
            icon={ScanSearch}
            title="L'historique brut de vos transactions"
            description="Votre banque nous transmet uniquement la liste de vos transactions passées, pour y détecter les montants récurrents (abonnements). Aucun contrôle ni visibilité sur la gestion future de votre compte."
            tone="certified"
            badgeLabel="Certifié"
          />
        </ul>

        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onLater}
            className="text-sm font-medium text-luxury-text-light transition-colors hover:text-luxury-text"
          >
            Plus tard
          </button>
          <Button onClick={onConfirm} loading={connecting} className="w-full sm:w-auto">
            Continuer vers la connexion sécurisée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
