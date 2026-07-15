// ============================================================================
// SubSaver - Détection du revenu (salaire) à partir des transactions Powens
// ----------------------------------------------------------------------------
// Module PUR (aucune dépendance React/réseau/DB), testable isolément avec un
// simple tableau de transactions -- même philosophie que le moteur d'analyse
// des abonnements côté backend (core/transaction_analyzer.py).
//
// L'algorithme repose sur quatre heuristiques cumulatives, chacune ajoutant de
// la confiance plutôt que d'être éliminatoire (un freelance aux revenus
// irréguliers doit obtenir une estimation, quitte à ce qu'elle soit signalée
// "à valider") :
//
//   1. Montant conséquent  : on ne retient comme candidat "revenu" qu'un CRÉDIT
//      (entrée d'argent) dont le cumul mensuel dépasse un plancher proche du
//      salaire minimum net (SALARY_MIN_MONTHLY). Les petits remboursements
//      entre amis ou cashbacks sont écartés.
//   2. Constance de l'émetteur : les crédits sont regroupés par ÉMETTEUR
//      normalisé (l'employeur), après avoir retiré le bruit bancaire
//      structurel ("VIR SEPA", "VIREMENT DE", références, dates...). Deux
//      virements du même employeur libellés différemment tombent dans le même
//      groupe.
//   3. Récurrence temporelle : un vrai salaire tombe environ tous les 30 jours,
//      autour du même jour du mois (souvent fin de mois ou début). On mesure la
//      régularité des intervalles ET la dispersion du jour de versement.
//   4. Moyenne glissante : le montant estimé est la moyenne des cumuls des 3 à
//      6 derniers mois -- ce lissage absorbe les primes, heures sup et le 13e
//      mois sans faire bondir l'estimation.
//
// Repli UX : si le meilleur groupe est peu régulier, à montant très variable,
// ou sans mot-clé de paie explicite, le résultat est renvoyé avec
// `needsReview = true`. La page "Vos Ressources" met alors en avant le bouton
// « Modifier / Ajuster mon revenu manuel » pour laisser le contrôle final à
// l'utilisateur (cas freelance / revenus variables).
// ============================================================================

/** Transaction bancaire brute telle que renvoyée par GET /bank/transactions.
 * Un crédit (entrée d'argent) a `value > 0`, un débit `value < 0`. */
export interface SalaryTransaction {
  id: string;
  wording: string;
  value: number;
  /** Format ISO "YYYY-MM-DD". */
  date: string;
}

export type SalarySource = "detected" | "manual" | "none";

export interface MonthlyPoint {
  /** Clé "YYYY-MM" du mois. */
  month: string;
  /** Cumul des crédits du revenu détecté ce mois-là (0 si aucun). */
  amount: number;
}

export interface SalaryDetectionResult {
  /** Revenu mensuel estimé (moyenne glissante des cumuls mensuels récents). */
  monthlyIncome: number;
  /** Indice de confiance 0..1 de la détection. */
  confidence: number;
  /** Origine de la valeur affichée -- "manual" est posé par la couche hook
   * quand l'utilisateur a saisi un montant, jamais par ce module pur. */
  source: SalarySource;
  /** Libellé lisible de l'émetteur retenu (employeur), null si indéterminé. */
  employerLabel: string | null;
  /** Nombre de mois distincts observés pour le groupe retenu. */
  monthsAnalyzed: number;
  /** Nombre de crédits agrégés dans le groupe retenu. */
  occurrences: number;
  /** Rythme reconnu, ou null si un seul mois observé. */
  frequency: "monthly" | "irregular" | null;
  /** Historique des 6 derniers mois (buckets remplis, 0 si mois sans revenu) --
   * consommé tel quel par le mini-graphique de la page Ressources. */
  monthlyBreakdown: MonthlyPoint[];
  /** true -> l'UI doit mettre en avant l'ajustement manuel (doute de
   * l'algorithme : irrégularité, forte variance, ou pas de mot-clé de paie). */
  needsReview: boolean;
}

// ---------------------------------------------------------------------------
// Réglages métier
// ---------------------------------------------------------------------------

/** Fenêtre d'analyse : on ne regarde que les crédits des 6 derniers mois --
 * au-delà, un ancien employeur fausserait l'estimation courante. */
const ANALYSIS_WINDOW_MONTHS = 6;

/** Plancher du cumul MENSUEL en dessous duquel un émetteur n'est pas considéré
 * comme une source de revenu (proche du SMIC net mensuel français). */
const SALARY_MIN_MONTHLY = 800;

/** Plancher par transaction : sous ce montant, un crédit isolé est du bruit
 * (remboursement, cashback) -- appliqué avant tout regroupement. Volontairement
 * bas pour ne pas écarter un acompte de salaire versé en deux fois. */
const MIN_CREDIT = 200;

/** Intervalle mensuel nominal (jours) et tolérance pour juger la régularité. */
const MONTHLY_INTERVAL = 30;
const MONTHLY_INTERVAL_TOLERANCE = 6; // 24-36 jours (mois courts/longs + week-ends)

/** Dispersion max (jours) du "jour du mois" de versement pour parler d'un
 * versement à date fixe (ex: toujours entre le 27 et le 2). */
const DAY_OF_MONTH_SPREAD_MAX = 6;

/** Coefficient de variation des cumuls mensuels au-delà duquel le revenu est
 * jugé "variable" (profil freelance) -> needsReview. */
const HIGH_VARIANCE_CV = 0.35;

/** Seuil de confiance en dessous duquel l'UI doit proposer l'ajustement manuel. */
const REVIEW_CONFIDENCE_THRESHOLD = 0.6;

// Mots-clés de PAIE : leur présence dans le libellé est un signal fort. Testés
// sur le libellé normalisé (majuscules, sans accents), en sous-chaîne.
const SALARY_KEYWORDS = [
  "SALAIRE",
  "SAL ",
  "PAIE",
  "PAYE",
  "PAY ",
  "REMUNERATION",
  "REMUN",
  "BULLETIN",
  "TRAITEMENT", // fonction publique
  "SOLDE", // militaires / soldes de tout compte
  "WAGES",
  "PAYROLL",
];

// Formes juridiques d'entreprise : renforcent l'hypothèse "employeur".
const EMPLOYER_FORMS = ["SARL", "SAS", "SASU", "EURL", "SA ", "SCOP", "SNC", "GIE", "EIRL"];

// Bruit bancaire STRUCTUREL retiré pour construire la clé d'émetteur (mais
// jamais avant d'avoir testé les mots-clés de paie ci-dessus, sinon on
// effacerait le signal). Ordre indifférent : chaque token est retiré comme mot.
const STRUCTURAL_TOKENS = new Set([
  "VIR", "VIREMENT", "VIRT", "SEPA", "RECU", "RECV", "DE", "INST", "INSTANTANE",
  "PRLV", "CB", "PAIEMENT", "PMT", "REF", "MOTIF", "MDT", "RUM", "ID", "EMETTEUR",
  "DU", "LE", "REGROUPEMENT", "EUR", "EUROS", "SALAIRE", "SAL", "PAIE", "PAYE",
  "REMUNERATION", "REMUN", "TRAITEMENT", "AVEC", "POUR", "COMPTE",
]);

const MONTH_TOKENS = new Set([
  "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT",
  "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE",
]);

// ---------------------------------------------------------------------------
// Utilitaires purs
// ---------------------------------------------------------------------------

function parseDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** MAJUSCULES, sans accents, ponctuation réduite à des espaces simples. */
function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSalaryKeyword(normalized: string): boolean {
  const padded = ` ${normalized} `;
  return SALARY_KEYWORDS.some((k) => padded.includes(k.trim().length <= 3 ? ` ${k.trim()} ` : k));
}

function hasEmployerForm(normalized: string): boolean {
  const padded = ` ${normalized} `;
  return EMPLOYER_FORMS.some((f) => padded.includes(` ${f.trim()} `) || normalized.includes(f.trim()));
}

/** Clé de regroupement par émetteur : on retire les tokens structurels, les
 * mois écrits en toutes lettres et les blocs purement numériques (références,
 * dates, RUM), pour ne garder que les mots distinctifs de l'employeur.
 * Repli sur le libellé normalisé complet si le nettoyage vide la chaîne. */
function emitterKey(normalized: string): string {
  const kept = normalized
    .split(" ")
    .filter((token) => {
      if (!token) return false;
      if (STRUCTURAL_TOKENS.has(token)) return false;
      if (MONTH_TOKENS.has(token)) return false;
      if (/^\d+$/.test(token)) return false; // bloc purement numérique
      if (token.length === 1) return false; // initiales/bruit isolé
      return true;
    })
    .join(" ");
  return kept || normalized;
}

/** Libellé lisible de l'employeur (Title Case) à partir de la clé d'émetteur. */
function toDisplayLabel(key: string): string {
  return key
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
    .trim();
}

function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

/** Coefficient de variation (écart-type / moyenne), 0 si moyenne nulle. */
function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance) / m;
}

// ---------------------------------------------------------------------------
// Cœur de l'algorithme
// ---------------------------------------------------------------------------

interface Candidate {
  key: string;
  displayLabel: string;
  hasKeyword: boolean;
  transactions: SalaryTransaction[];
  monthlyTotals: Map<string, number>; // "YYYY-MM" -> cumul
  monthlyIncome: number;
  monthsAnalyzed: number;
  confidence: number;
  variance: number;
}

/** Construit les 6 derniers buckets mensuels (du plus ancien au plus récent),
 * remplis depuis les cumuls du groupe (0 pour un mois sans versement). */
function buildBreakdown(monthlyTotals: Map<string, number>, today: Date): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let i = ANALYSIS_WINDOW_MONTHS - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(d);
    points.push({ month: key, amount: Math.round((monthlyTotals.get(key) ?? 0) * 100) / 100 });
  }
  return points;
}

function scoreCandidate(
  transactions: SalaryTransaction[],
  monthlyTotals: Map<string, number>,
  hasKeyword: boolean,
  hasForm: boolean,
): { monthlyIncome: number; confidence: number; variance: number } {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Moyenne glissante : cumuls des (au plus) 6 mois les plus récents ayant un
  // versement -- lisse primes / heures sup / 13e mois.
  const orderedMonths = [...monthlyTotals.keys()].sort();
  const recentMonths = orderedMonths.slice(-ANALYSIS_WINDOW_MONTHS);
  const recentTotals = recentMonths.map((m) => monthlyTotals.get(m) as number);
  const monthlyIncome = Math.round(mean(recentTotals) * 100) / 100;

  // Régularité des intervalles (jours entre deux crédits consécutifs).
  const dates = sorted.map((t) => parseDate(t.date));
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(Math.round((dates[i].getTime() - dates[i - 1].getTime()) / 86_400_000));
  }
  const monthlyIntervals = intervals.filter(
    (d) => Math.abs(d - MONTHLY_INTERVAL) <= MONTHLY_INTERVAL_TOLERANCE,
  );
  const intervalRegularity = intervals.length ? monthlyIntervals.length / intervals.length : 0;

  // Dispersion du jour du mois (un salaire tombe ~ toujours le même jour).
  const daysOfMonth = dates.map((d) => d.getDate());
  const dayspread = daysOfMonth.length
    ? Math.max(...daysOfMonth) - Math.min(...daysOfMonth)
    : 99;

  const variance = coefficientOfVariation(recentTotals);

  // Score cumulatif borné à [0, 1].
  let confidence = 0.25; // socle : c'est déjà un crédit conséquent et récurrent
  if (hasKeyword) confidence += 0.3;
  if (hasForm) confidence += 0.1;
  if (monthlyTotals.size >= 3) confidence += 0.15;
  confidence += 0.15 * intervalRegularity;
  if (dayspread <= DAY_OF_MONTH_SPREAD_MAX) confidence += 0.1;
  if (variance > HIGH_VARIANCE_CV) confidence -= 0.15; // revenu variable
  confidence = Math.max(0, Math.min(1, confidence));

  return { monthlyIncome, confidence, variance };
}

/**
 * Détecte le revenu mensuel de l'utilisateur à partir de ses transactions
 * bancaires synchronisées via Powens. Fonction pure : mêmes entrées -> mêmes
 * sorties, aucun effet de bord.
 *
 * @param transactions Transactions brutes (crédits ET débits mélangés).
 * @param now Date de référence, injectable pour les tests (défaut : maintenant).
 */
export function detectSalaryFromTransactions(
  transactions: SalaryTransaction[],
  now: Date = new Date(),
): SalaryDetectionResult {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowStart = new Date(today.getFullYear(), today.getMonth() - ANALYSIS_WINDOW_MONTHS, 1);

  const emptyBreakdown = buildBreakdown(new Map(), today);

  // 1. Ne garder que les CRÉDITS conséquents de la fenêtre d'analyse.
  const credits = transactions.filter((t) => {
    if (t.value < MIN_CREDIT) return false; // débits + petits crédits écartés
    const d = parseDate(t.date);
    return d >= windowStart && d <= today;
  });

  if (credits.length === 0) {
    return {
      monthlyIncome: 0,
      confidence: 0,
      source: "none",
      employerLabel: null,
      monthsAnalyzed: 0,
      occurrences: 0,
      frequency: null,
      monthlyBreakdown: emptyBreakdown,
      needsReview: true,
    };
  }

  // 2. Regrouper par émetteur normalisé.
  const groups = new Map<string, SalaryTransaction[]>();
  const groupMeta = new Map<string, { display: string; hasKeyword: boolean; hasForm: boolean }>();
  for (const tx of credits) {
    const norm = normalize(tx.wording);
    const key = emitterKey(norm);
    if (!groups.has(key)) {
      groups.set(key, []);
      groupMeta.set(key, {
        display: toDisplayLabel(key),
        hasKeyword: hasSalaryKeyword(norm),
        hasForm: hasEmployerForm(norm),
      });
    }
    groups.get(key)!.push(tx);
    // Un seul libellé du groupe suffit à activer le drapeau mot-clé/forme.
    const meta = groupMeta.get(key)!;
    if (!meta.hasKeyword && hasSalaryKeyword(norm)) meta.hasKeyword = true;
    if (!meta.hasForm && hasEmployerForm(norm)) meta.hasForm = true;
  }

  // 3. Scorer chaque groupe et ne retenir que ceux dont le cumul mensuel
  //    médian atteint le plancher salaire.
  const candidates: Candidate[] = [];
  for (const [key, txs] of groups) {
    const monthlyTotals = new Map<string, number>();
    for (const tx of txs) {
      const mk = monthKey(parseDate(tx.date));
      monthlyTotals.set(mk, (monthlyTotals.get(mk) ?? 0) + tx.value);
    }

    const meta = groupMeta.get(key)!;
    const { monthlyIncome, confidence, variance } = scoreCandidate(
      txs,
      monthlyTotals,
      meta.hasKeyword,
      meta.hasForm,
    );

    if (monthlyIncome < SALARY_MIN_MONTHLY) continue; // sous le plancher salaire

    candidates.push({
      key,
      displayLabel: meta.display,
      hasKeyword: meta.hasKeyword,
      transactions: txs,
      monthlyTotals,
      monthlyIncome,
      monthsAnalyzed: monthlyTotals.size,
      confidence,
      variance,
    });
  }

  if (candidates.length === 0) {
    return {
      monthlyIncome: 0,
      confidence: 0,
      source: "none",
      employerLabel: null,
      monthsAnalyzed: 0,
      occurrences: 0,
      frequency: null,
      monthlyBreakdown: emptyBreakdown,
      needsReview: true,
    };
  }

  // 4. Élire le meilleur candidat : confiance d'abord, puis montant (un salaire
  //    principal prime sur un complément de revenu du même profil de confiance).
  candidates.sort((a, b) => b.confidence - a.confidence || b.monthlyIncome - a.monthlyIncome);
  const best = candidates[0];

  const needsReview =
    best.confidence < REVIEW_CONFIDENCE_THRESHOLD ||
    best.variance > HIGH_VARIANCE_CV ||
    !best.hasKeyword;

  return {
    monthlyIncome: best.monthlyIncome,
    confidence: Math.round(best.confidence * 100) / 100,
    source: "detected",
    employerLabel: best.displayLabel || null,
    monthsAnalyzed: best.monthsAnalyzed,
    occurrences: best.transactions.length,
    frequency: best.monthsAnalyzed >= 2 ? "monthly" : "irregular",
    monthlyBreakdown: buildBreakdown(best.monthlyTotals, today),
    needsReview,
  };
}
