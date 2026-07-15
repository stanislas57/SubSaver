import * as React from "react";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Sparkles,
  Pencil,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  Building2,
  ShoppingCart,
  PartyPopper,
  Info,
  Minus,
  Equal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { RevealText } from "@/components/shared/RevealText";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSalary } from "@/hooks/useSalary";
import { useAuth } from "@/contexts/AuthContext";
import { useSeo } from "@/hooks/useSeo";
import { formatPrice } from "@/lib/format";
import {
  SAVINGS_ACADEMY,
  type AcademyContext,
  type RichNode,
} from "@/data/savingsAcademy";

// ---------------------------------------------------------------------------
// Répartiteur : règle des 50/30/20 adaptée par SubSaver. Les abonnements étant
// DÉJÀ déduits du Reste à Vivre en amont, le poste "Plaisir & Lifestyle" ne
// couvre ici que les dépenses de loisir hors abonnements. Les valeurs par
// défaut somment à 100 ; l'utilisateur peut les ajuster librement (slider ET
// saisie directe du pourcentage), le total étant contrôlé et signalé s'il
// s'écarte de 100.
// ---------------------------------------------------------------------------

interface BudgetBucket {
  key: "charges" | "courses" | "plaisir" | "epargne";
  label: string;
  hint: string;
  icon: typeof Wallet;
  /** Classe de couleur de la barre/jauge. */
  barClass: string;
  textClass: string;
  ringClass: string;
  defaultPercent: number;
  highlight?: boolean;
}

const BUDGET_BUCKETS: BudgetBucket[] = [
  {
    key: "charges",
    label: "Charges fixes & logement",
    hint: "Loyer, énergie, assurances, transport, remboursements de crédits.",
    icon: Building2,
    barClass: "bg-luxury-sapphire",
    textClass: "text-luxury-sapphire",
    ringClass: "focus:ring-luxury-sapphire/30",
    defaultPercent: 35,
  },
  {
    key: "courses",
    label: "Courses & vie quotidienne",
    hint: "Alimentation, hygiène, santé quotidienne.",
    icon: ShoppingCart,
    barClass: "bg-luxury-gold",
    textClass: "text-luxury-gold-deep",
    ringClass: "focus:ring-luxury-gold/30",
    defaultPercent: 20,
  },
  {
    key: "plaisir",
    label: "Plaisir & lifestyle",
    hint: "Sorties, restaurants, shopping, loisirs (hors abonnements déjà déduits).",
    icon: PartyPopper,
    barClass: "bg-purple-400",
    textClass: "text-purple-500",
    ringClass: "focus:ring-purple-400/30",
    defaultPercent: 20,
  },
  {
    key: "epargne",
    label: "Épargne & investissement",
    hint: "Le levier de liberté financière : à sécuriser puis faire fructifier.",
    icon: PiggyBank,
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
    ringClass: "focus:ring-emerald-500/30",
    defaultPercent: 25,
    highlight: true,
  },
];

type Allocation = Record<BudgetBucket["key"], number>;

const DEFAULT_ALLOCATION: Allocation = {
  charges: 35,
  courses: 20,
  plaisir: 20,
  epargne: 25,
};

// ---------------------------------------------------------------------------

/** Numéro d'étape rond, doré, cohérent sur les 3 sections -- lisibilité du
 * parcours (1. ce qui rentre -> 2. comment le répartir -> 3. quoi en faire). */
function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-luxury-night text-sm font-black text-luxury-gold">
      {n}
    </span>
  );
}

/** Symbole opérateur (− / =) entre les 3 cartes du synthétiseur -- posé en
 * pleine ligne de grille : centré automatiquement qu'on soit en colonne
 * unique (mobile, l'opérateur devient sa propre ligne) ou en ligne (lg+). */
function OperatorBadge({ icon: Icon }: { icon: typeof Minus }) {
  return (
    <div className="flex items-center justify-center py-1 lg:py-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-luxury-text-light shadow-luxury">
        <Icon className="h-4 w-4" />
      </span>
    </div>
  );
}

/** Rend une réponse d'Académie (paragraphes de noeuds texte/lien inline). */
function RichAnswer({ paragraphs }: { paragraphs: RichNode[][] }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-luxury-text-light">
      {paragraphs.map((nodes, i) => (
        <p key={i}>
          {nodes.map((node, j) =>
            typeof node === "string" ? (
              <React.Fragment key={j}>{node}</React.Fragment>
            ) : (
              <a
                key={j}
                href={node.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-luxury-sapphire underline decoration-luxury-sapphire/30 underline-offset-2 transition-colors hover:decoration-luxury-sapphire"
              >
                {node.text}
              </a>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

/** Espace Premium "Vos Ressources" -- copilote de santé financière : revenu
 * détecté via Powens, reste à vivre, répartiteur de budget, académie de
 * l'épargne. Accès garanti Premium côté route (PremiumOnlyRoute). */
export function ResourcesPage() {
  useSeo({
    title: "Vos Ressources - SubSaver",
    description:
      "Votre copilote de santé financière : revenu détecté, reste à vivre, répartiteur de budget et académie de l'épargne.",
    path: "/ressources",
  });

  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const subs = useSubscriptions();
  const {
    salary,
    isLoading: salaryLoading,
    isError: salaryError,
    refetch,
    setManualIncome,
    clearManualIncome,
    isManual,
  } = useSalary();

  const [allocation, setAllocation] = React.useState<Allocation>(DEFAULT_ALLOCATION);
  const [editingIncome, setEditingIncome] = React.useState(false);
  const [draftIncome, setDraftIncome] = React.useState("");
  const [openFaq, setOpenFaq] = React.useState<string | null>(SAVINGS_ACADEMY[0]?.id ?? null);

  const subscriptionsTotal = React.useMemo(
    () => (subs.data ?? []).reduce((sum, s) => sum + s.price, 0),
    [subs.data],
  );

  const income = salary.monthlyIncome;
  const remaining = Math.max(0, income - subscriptionsTotal);

  const totalPercent = allocation.charges + allocation.courses + allocation.plaisir + allocation.epargne;
  const isBalanced = totalPercent === 100;

  const amountFor = (percent: number) => (remaining * percent) / 100;
  const savingsMonthly = amountFor(allocation.epargne);

  /** Met à jour un poste du répartiteur (slider OU saisie directe du %),
   * toujours borné à [0, 100] -- une seule fonction pour les deux modes de
   * saisie garantit qu'ils restent en phase. */
  function updateBucket(key: BudgetBucket["key"], rawValue: number) {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(rawValue) ? rawValue : 0));
    setAllocation((prev) => ({ ...prev, [key]: clamped }));
  }

  // Contexte dynamique de l'Académie : cible d'épargne de précaution = 3 à 6
  // mois de charges courantes (charges fixes + courses + abonnements déjà
  // synchronisés), et délai pour l'atteindre au rythme d'épargne courant.
  const monthlyCharges = amountFor(allocation.charges) + amountFor(allocation.courses) + subscriptionsTotal;
  const emergencyLow = monthlyCharges * 3;
  const emergencyHigh = monthlyCharges * 6;
  const monthsToEmergency =
    savingsMonthly > 0 ? String(Math.ceil(emergencyLow / savingsMonthly)) : "-";

  const academyContext: AcademyContext = {
    savingsMonthly: formatPrice(savingsMonthly, currency),
    emergencyLow: formatPrice(Math.round(emergencyLow), currency),
    emergencyHigh: formatPrice(Math.round(emergencyHigh), currency),
    monthsToEmergency,
  };

  function startEditIncome() {
    setDraftIncome(income > 0 ? String(Math.round(income)) : "");
    setEditingIncome(true);
  }

  function saveIncome() {
    const value = Number.parseFloat(draftIncome.replace(",", "."));
    if (Number.isFinite(value) && value > 0) {
      setManualIncome(value);
      setEditingIncome(false);
    }
  }

  const loading = salaryLoading || subs.isPending;

  return (
    <div className="w-full px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        {/* En-tête */}
        <div className="mb-12">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-luxury-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-luxury-gold-deep">
            <Sparkles className="h-3.5 w-3.5" /> Espace Premium
          </span>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Vos Ressources
          </RevealText>
          <RevealText className="mt-4 max-w-2xl text-lg leading-relaxed text-luxury-text-light">
            Votre copilote de santé financière : ce qui rentre, ce qui reste, et comment
            en faire un levier de liberté.
          </RevealText>
        </div>

        {salaryError && (
          <div className="mb-8">
            <ErrorAlert
              message="Impossible de charger vos transactions bancaires pour l'instant."
              onRetry={() => refetch()}
            />
          </div>
        )}

        <div className="space-y-10">
          {/* ================= SECTION 1 - Synthétiseur de Reste à Vivre ====== */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <StepNumber n={1} />
              <div>
                <h2 className="text-xl font-black tracking-tight text-luxury-text">
                  Ce qui rentre, ce qui reste
                </h2>
                <p className="text-sm text-luxury-text-light">
                  Revenu détecté moins abonnements actifs -- votre base de répartition.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {/* Revenu détecté */}
              <Card className="h-full">
                <CardContent className="flex h-full flex-col p-7">
                  <div className="flex items-center gap-2 text-luxury-text-light">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Revenu mensuel</span>
                  </div>

                  {loading ? (
                    <Skeleton className="mt-4 h-10 w-36" />
                  ) : editingIncome ? (
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        autoFocus
                        value={draftIncome}
                        onChange={(e) => setDraftIncome(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveIncome()}
                        placeholder="2450"
                        className="w-28 rounded-lg border border-slate-900/15 px-2.5 py-2 text-lg font-bold text-luxury-text outline-none focus:border-luxury-gold"
                      />
                      <button
                        onClick={saveIncome}
                        aria-label="Valider"
                        className="rounded-lg bg-emerald-500 p-2 text-white transition-colors hover:bg-emerald-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingIncome(false)}
                        aria-label="Annuler"
                        className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2.5">
                      <p className="text-4xl font-black tracking-tight text-luxury-text">
                        {income > 0 ? formatPrice(income, currency) : "-"}
                      </p>
                      <button
                        onClick={startEditIncome}
                        aria-label="Modifier le revenu"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-luxury-text-light transition-colors hover:bg-luxury-bg-soft hover:text-luxury-text"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-auto pt-5">
                    {!loading && !editingIncome && (
                      <div className="flex flex-wrap items-center gap-2">
                        {isManual ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-luxury-sapphire/10 px-2.5 py-1 text-[11px] font-medium text-luxury-sapphire">
                            Ajusté manuellement
                          </span>
                        ) : salary.source === "detected" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                            Détecté {salary.employerLabel ? `- ${salary.employerLabel}` : ""} ({Math.round(salary.confidence * 100)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                            Aucun revenu détecté
                          </span>
                        )}
                        {isManual && (
                          <button
                            onClick={clearManualIncome}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-luxury-text-light underline-offset-2 hover:text-luxury-text hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" /> Revenir à la détection
                          </button>
                        )}
                      </div>
                    )}
                    {!loading && salary.needsReview && !isManual && salary.source === "detected" && (
                      <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-snug text-amber-600">
                        <Info className="mt-px h-3 w-3 shrink-0" />
                        Revenu variable ou incertain : vérifiez et ajustez si besoin.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <OperatorBadge icon={Minus} />

              {/* Abonnements */}
              <Card className="h-full">
                <CardContent className="flex h-full flex-col p-7">
                  <div className="flex items-center gap-2 text-luxury-text-light">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Abonnements actifs</span>
                  </div>
                  {loading ? (
                    <Skeleton className="mt-4 h-10 w-36" />
                  ) : (
                    <p className="mt-4 text-4xl font-black tracking-tight text-red-500">
                      -{formatPrice(subscriptionsTotal, currency)}
                    </p>
                  )}
                  <p className="mt-auto pt-5 text-[11px] text-luxury-text-light">
                    {(subs.data ?? []).length} abonnement(s) synchronisé(s) sur SubSaver.
                  </p>
                </CardContent>
              </Card>

              <OperatorBadge icon={Equal} />

              {/* Reste à vivre */}
              <Card className="h-full overflow-hidden">
                <CardContent className="flex h-full flex-col bg-luxury-night p-7 text-white">
                  <div className="flex items-center gap-2 text-luxury-gold">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Reste à vivre réel</span>
                  </div>
                  {loading ? (
                    <Skeleton className="mt-4 h-10 w-36 bg-white/10" />
                  ) : (
                    <p className="mt-4 text-4xl font-black tracking-tight">
                      {formatPrice(remaining, currency)}
                    </p>
                  )}
                  <p className="mt-auto pt-5 text-[11px] text-slate-300">
                    C'est votre base de répartition ci-dessous.
                  </p>
                </CardContent>
              </Card>
            </div>

            {income <= 0 && !loading && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
                Aucun revenu n'a pu être détecté dans vos transactions. Connectez votre banque
                depuis la page <span className="font-semibold">Banque</span> pour une détection
                automatique, ou saisissez votre revenu avec l'icône crayon ci-dessus.
              </div>
            )}
          </section>

          {/* ================= SECTION 2 - Répartiteur intelligent ============ */}
          <section>
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <StepNumber n={2} />
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-luxury-text">
                        Répartissez votre reste à vivre
                      </h2>
                      <p className="text-sm text-luxury-text-light">
                        Ventilation façon 50/30/20 adaptée. Glissez le curseur ou tapez directement
                        un pourcentage.
                      </p>
                    </div>
                  </div>
                  {!isBalanced && (
                    <Button variant="ghost" size="sm" onClick={() => setAllocation(DEFAULT_ALLOCATION)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
                    </Button>
                  )}
                </div>

                {/* Barre empilée de répartition (normalisée sur le total courant) */}
                <div className="mb-8 flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  {BUDGET_BUCKETS.map((b) => (
                    <div
                      key={b.key}
                      className={`${b.barClass} transition-all duration-200`}
                      style={{ width: `${totalPercent > 0 ? (allocation[b.key] / totalPercent) * 100 : 0}%` }}
                      title={`${b.label} - ${allocation[b.key]}%`}
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  {BUDGET_BUCKETS.map((b) => {
                    const Icon = b.icon;
                    const pct = allocation[b.key];
                    return (
                      <div
                        key={b.key}
                        className={`rounded-2xl border p-5 transition-colors sm:p-6 ${
                          b.highlight ? "border-emerald-200 bg-emerald-50/40" : "border-slate-900/5 bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${b.textClass} shadow-luxury`}>
                              <Icon className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-luxury-text">{b.label}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-luxury-text-light">{b.hint}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className={`text-lg font-black tabular-nums ${b.highlight ? "text-emerald-600" : "text-luxury-text"}`}>
                              {formatPrice(amountFor(pct), currency)}
                            </p>
                            {/* Saisie directe du pourcentage -- synchronisée avec le slider
                             * via updateBucket(), pour ajuster au chiffre près sans dépendre
                             * de la précision de la souris/du tactile. */}
                            <div className="flex items-center gap-1 rounded-lg border border-slate-900/10 bg-white px-2 py-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={pct}
                                onChange={(e) => updateBucket(b.key, Number(e.target.value))}
                                aria-label={`Pourcentage exact ${b.label}`}
                                className="w-11 bg-transparent text-right text-sm font-semibold tabular-nums text-luxury-text outline-none"
                              />
                              <span className="text-sm font-semibold text-luxury-text-light">%</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={60}
                          step={1}
                          value={pct}
                          onChange={(e) => updateBucket(b.key, Number(e.target.value))}
                          aria-label={`Pourcentage ${b.label}`}
                          className={`mt-4 w-full accent-luxury-gold ${b.ringClass}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`mt-6 flex items-center justify-between rounded-xl px-5 py-3 text-sm font-medium ${
                    isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span>Total réparti</span>
                  <span className="tabular-nums">
                    {totalPercent}% {isBalanced ? "" : totalPercent > 100 ? "(à réduire)" : "(à compléter)"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ================= SECTION 3 - Académie de l'épargne ============== */}
          <section>
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <StepNumber n={3} />
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-luxury-text">
                      L'Académie de l'épargne
                    </h2>
                    <p className="text-sm text-luxury-text-light">
                      Que faire de vos <span className="font-semibold text-emerald-600">{academyContext.savingsMonthly}/mois</span> ? Un guide de décision, sources officielles à l'appui.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {SAVINGS_ACADEMY.map((item) => {
                    const Icon = item.icon;
                    const isOpen = openFaq === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`overflow-hidden rounded-2xl border transition-colors ${
                          isOpen ? "border-emerald-200" : "border-slate-900/5"
                        }`}
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : item.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center gap-3.5 bg-white px-5 py-4 text-left transition-colors hover:bg-luxury-bg-soft sm:px-6"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="flex-1 text-sm font-semibold text-luxury-text">
                            {item.question(academyContext)}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-luxury-text-light transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="bg-luxury-bg-soft/40 px-5 pb-6 pt-2 sm:px-16">
                            <p className="mb-4 rounded-xl border-l-2 border-emerald-400 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-800">
                              {item.takeaway}
                            </p>
                            <RichAnswer paragraphs={item.body(academyContext)} />
                            <div className="mt-5 border-t border-slate-900/5 pt-4">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-luxury-text-light">
                                Sources
                              </p>
                              <ul className="space-y-1.5">
                                {item.sources.map((src) => (
                                  <li key={src.href}>
                                    <a
                                      href={src.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-luxury-sapphire hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      <span>{src.label}</span>
                                      <span className="text-luxury-text-light">- {src.org}</span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-6 text-[11px] leading-snug text-luxury-text-light">
                  Contenu éducatif, pas un conseil en investissement personnalisé. Tout placement
                  en actions comporte un risque de perte en capital.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
