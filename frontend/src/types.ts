// ============================================================================
// SubSaver - Types partagés Frontend
// Miroir strict des schémas Pydantic exposés par l'API FastAPI (/api/v1).
// ============================================================================

export type Language = "fr" | "en" | "de" | "es" | "sv";
export type Theme = "light" | "dark";
export type Currency = "EUR" | "USD" | "GBP" | "SEK";
export type NotificationPref = "all" | "trials" | "none";
export type Importance = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Utilisateur / Authentification
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  first_name: string;
  language: Language;
  theme: Theme;
  currency: Currency;
  notification_pref: NotificationPref;
  is_premium: boolean;
  /** Date ISO de la souscription Premium (posée une seule fois côté serveur),
   * null si jamais upgradé ou upgradé avant l'ajout de ce champ. */
  premium_since: string | null;
  bank_connected: boolean;
  is_admin: boolean;
  /** null tant que l'utilisateur n'a jamais accepté la charte informatique --
   * c'est ce champ qui déclenche CharterGate (modale bloquante) à la
   * première connexion, cf. POST /users/me/accept-charter. */
  charter_accepted_at: string | null;
}

/** Réponse de POST /auth/login (schéma Token). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MessageResult {
  message: string;
}

/** Corps de PATCH /users/me - tous les champs sont optionnels. */
export interface ProfileUpdatePayload {
  first_name?: string;
  language?: Language;
  theme?: Theme;
  currency?: Currency;
  notification_pref?: NotificationPref;
}

// ---------------------------------------------------------------------------
// Abonnements
// ---------------------------------------------------------------------------

export interface Subscription {
  id: string;
  name: string;
  price: number;
  category: string;
  domain: string;
  billing_day: number;
  importance: Importance;
  /** Format ISO "YYYY-MM-DD" ou null. */
  start_date: string | null;
  /** Format ISO "YYYY-MM-DD" ou null. */
  trial_end_date: string | null;
  /** Lecture seule (jamais dans SubscriptionInput) -- statut de partage,
   * utilisé par exemple par le filtre Personnels/Partagés de l'Analytique. */
  is_shared: boolean;
  /** Lecture seule (jamais dans SubscriptionInput) -- nom normalisé (moteur
   * Clé Marchand), jamais le libellé bancaire brut. Utilisé par ex. par le
   * Calendrier pour ne jamais afficher un badge tronqué illisible. */
  display_name: string;
  /** Métadonnées géographiques optionnelles, consommées par le moteur de
   * correspondance du Comparateur (Étape 3 du parcours guidé) -- jamais
   * déduites automatiquement, absentes tant que non renseignées. */
  location?: string | null;
  region?: string | null;
  scope?: string | null;
}

/** Corps commun à POST /subscriptions et PUT /subscriptions/{id}. */
export type SubscriptionInput = Omit<Subscription, "id" | "is_shared" | "display_name">;

// ---------------------------------------------------------------------------
// Banque
// ---------------------------------------------------------------------------

export interface BankProvider {
  id: string;
  name: string;
  domain: string;
}

/** Réponse de POST /bank/sync. */
export interface BankSyncResult {
  bank_connected: boolean;
  injected_subscriptions: Subscription[];
}

/** Réponse de GET /bank/connect-url. */
export interface BankConnectUrl {
  webview_url: string;
}

/** Corps de POST /bank/callback, extrait des query params au retour de la Webview Powens. */
export interface BankCallbackInput {
  state: string;
  connection_id?: string;
  error?: string;
  error_description?: string;
}

/** Réponse de POST /bank/callback. */
export interface BankCallbackResult {
  bank_connected: boolean;
  connection_id?: string;
}

// ---------------------------------------------------------------------------
// Comparateur marché
// ---------------------------------------------------------------------------

/** Caractéristique propre à la famille de l'offre (ex: "Qualité vidéo" en VOD,
 * "Enveloppe Data" en forfaits mobiles) -- liste plutôt que colonnes dédiées,
 * pour que le même modèle serve toutes les familles sans changement de schéma
 * à chaque nouvelle catégorie ajoutée. */
export interface MarketOfferAttribute {
  key: string;
  label: string;
  value: string;
}

export interface MarketOffer {
  id: string;
  category: string;
  name: string;
  price: number;
  promo: string | null;
  score: number;
  engagement: string;
  pros: string[];
  cons: string[];
  link: string;
  /** Date (YYYY-MM-DD) de dernière vérification manuelle du tarif. */
  price_checked_at: string;
  /** Prix annuel remisé (facturé en une fois), null si pas de formule annuelle. */
  annual_price: number | null;
  /** Frais unique de mise en service / résiliation anticipée, null si aucun frais caché. */
  setup_fee: number | null;
  setup_fee_note: string | null;
  attributes: MarketOfferAttribute[];
  /** Métadonnées géographiques optionnelles pour le moteur de correspondance
   * du Comparateur -- distinctes des attributes `scope`/`region` déjà
   * présents pour la famille Transport (JSONB, valeurs riches consommées par
   * lib/transportGeo.ts pour les filtres complémentaires) : ces champs-ci ne
   * servent qu'au filtrage initial grossier de l'Étape 3 (catégorie + portée). */
  location?: string | null;
  region?: string | null;
  scope?: string | null;
}

// ---------------------------------------------------------------------------
// Abonnement partagé
// ---------------------------------------------------------------------------

export interface SharedSubscriptionMember {
  id: string;
  name: string;
  email: string | null;
  is_owner: boolean;
}

export interface SharedSubscriptionGroup {
  id: string;
  name: string;
  members: SharedSubscriptionMember[];
}

export interface SharedSubscriptionBalance {
  member_id: string;
  member_name: string;
  share_percent: number;
  amount_owed: number;
}

/** Abonnement de l'utilisateur avec son statut de partage (GET/PUT
 * /family/shareable-subscriptions et /family/shared-subscriptions) --
 * volontairement distinct de `Subscription` : le partage ne concerne que la
 * sélection, pas l'édition complète d'un abonnement. */
/** `display_name` est déjà normalisé côté backend (moteur Clé Marchand) et la
 * liste dédupliquée -- jamais un libellé bancaire brut ni un doublon. */
export interface ShareableSubscription {
  id: string;
  display_name: string;
  price: number;
  category: string;
  is_shared: boolean;
}

export type SplitMode = "equal" | "percentage" | "fixed";

export interface SubscriptionSplitMember {
  member_id: string;
  member_name: string;
  /** Valeur brute stockée (pourcentage ou montant fixe) -- null en mode "equal". */
  share_value: number | null;
  /** Montant réellement dû par ce membre pour cet abonnement, déjà calculé côté serveur. */
  computed_amount: number;
}

export interface SubscriptionSplit {
  subscription_id: string;
  display_name: string;
  price: number;
  split_mode: SplitMode;
  members: SubscriptionSplitMember[];
}

/** Corps de PUT /family/subscriptions/{id}/split. */
export interface SubscriptionSplitUpdateInput {
  split_mode: SplitMode;
  members: { member_id: string; share_value?: number | null }[];
}

/** Une dette déjà simplifiée (GET /family/debts) : "from" doit "amount" à "to". */
export interface DebtEdge {
  from_member_id: string;
  from_member_name: string;
  to_member_id: string;
  to_member_name: string;
  amount: number;
}

/** Corps de POST /family/debts/settle. */
export interface SettleDebtInput {
  from_member_id: string;
  to_member_id: string;
  amount: number;
}

/** Corps de POST /family/debts/remind -- le créditeur est toujours l'appelant. */
export interface SendReminderInput {
  member_id: string;
  amount: number;
}

/** Ligne d'historique (GET /family/settlements). */
export interface Settlement {
  id: string;
  from_member_id: string;
  from_member_name: string;
  to_member_id: string;
  to_member_name: string;
  amount: number;
  period: string;
  created_at: string;
}

/** Abonnement dédupliqué et normalisé pour le menu de la Lettre de
 * résiliation (GET /subscriptions/cancellation-candidates) -- `display_name`
 * est passé dans le moteur Clé Marchand côté backend, donc jamais un libellé
 * bancaire brut ni un doublon. */
export interface CancellableSubscription {
  id: string;
  display_name: string;
  price: number;
  domain: string;
}

// ---------------------------------------------------------------------------
// Espace Pro / BtoB (Premium) -- Extraction comptable, Récupération de TVA,
// Détection des frais bancaires. Cf. GET /pro/vat-recovery, GET /pro/bank-fees.
// ---------------------------------------------------------------------------

export interface VatRecoveryLine {
  subscription_id: string;
  display_name: string;
  category: string;
  price_ttc: number;
  price_ht: number;
  vat_amount: number;
}

export interface VatRecoveryReport {
  vat_rate: number;
  lines: VatRecoveryLine[];
  total_price_ttc: number;
  total_vat_amount: number;
}

export interface BankFee {
  transaction_id: string;
  label: string;
  date: string;
  amount: number;
}

export interface BankFeeReport {
  bank_connected: boolean;
  fees: BankFee[];
  total_amount: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Constantes partagées
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "Telephonie",
  "Sport",
  "Streaming",
  "Banque",
  "Musique",
  "Transport",
  "Autre",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Libellé d'affichage par catégorie -- ne remplace jamais la valeur stockée
 * (Category), seulement le texte présenté à l'utilisateur (ex: "Sport" reste
 * la valeur en base/formulaires, mais s'affiche "Sport & Fitness" dans le
 * comparateur). Catégories absentes de ce record : libellé = valeur brute. */
export const CATEGORY_DISPLAY_LABELS: Partial<Record<Category, string>> = {
  Sport: "Sport & Fitness",
  Transport: "Transport & Mobilité",
};

/** Sous-catégories de la famille Sport (attribute JSONB `subcategory` d'une
 * MarketOffer) -- pas de colonne dédiée : `MarketOffer.attributes` reste un
 * JSONB générique {key,label,value}[] partagé par toutes les catégories, cf.
 * commentaire de `MarketOffer` dans ce fichier. Ces constantes ne servent
 * qu'à typer/lire cet attribute côté front, sans contrainte au niveau DB. */
export const SPORT_SUBCATEGORIES = [
  "Salle de sport physique",
  "Application de coaching / Fitness à domicile",
  "Agrégateur multi-activités",
  "Streaming sportif",
] as const;

export type SportSubcategory = (typeof SPORT_SUBCATEGORIES)[number];

/** Portée géographique d'une offre Transport (attribute JSONB `scope`) --
 * même logique que SPORT_SUBCATEGORIES : ne contraint pas le schéma DB,
 * seulement le typage/la lecture côté front des `MarketOffer.attributes`. */
export const TRANSPORT_SCOPE_LABELS = {
  URBAN_LOCAL: "Urbain local",
  REGIONAL_TER: "Régional (TER)",
  NATIONAL: "National",
} as const;

export type TransportScope = keyof typeof TRANSPORT_SCOPE_LABELS;

/** Les 11 régions françaises (hors collectivités d'outre-mer), utilisées pour
 * le sélecteur "Ma région" du comparateur Transport -- attribute `region`. */
export const FRENCH_REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Occitanie",
  "Nouvelle-Aquitaine",
  "Hauts-de-France",
  "Grand Est",
  "Bretagne",
  "Pays de la Loire",
  "Normandie",
  "Provence-Alpes-Côte d'Azur",
  "Centre-Val de Loire",
] as const;

export type FrenchRegion = (typeof FRENCH_REGIONS)[number];

/** Clés des `MarketOfferAttribute` propres à la famille Transport (cf.
 * migration ajoutant les offres Transport, fonction `transport_attrs`). */
export const TRANSPORT_ATTRIBUTE_KEYS = {
  scope: "scope",
  region: "region",
  coveredCities: "covered_cities",
  aomName: "aom_name",
  mobilityType: "mobility_type",
  freeTransport: "free_transport",
  employerReimbursement: "employer_reimbursement",
  flexibleUsage: "flexible_usage",
} as const;

/** Clés des `MarketOfferAttribute` propres à la famille Sport (cf. migration
 * `b2c94a71e8d3_add_sport_fitness_market_offers`, fonction `sport_attrs`). */
export const SPORT_ATTRIBUTE_KEYS = {
  subcategory: "subcategory",
  multiClubAccess: "multi_club_access",
  groupClasses: "group_classes",
  mobileApp: "mobile_app",
  guestInvite: "guest_invite",
} as const;

/** Clés des `MarketOfferAttribute` propres à la famille Banque (cf. migration
 * `a4f7c9e2b6d1_add_banque_market_offers`, fonction `banking_attrs`). */
export const BANKING_ATTRIBUTE_KEYS = {
  bankType: "bank_type",
  cardLevel: "card_level",
  foreignFees: "foreign_fees",
  eligibility: "eligibility",
  checkCashDeposit: "check_cash_deposit",
  insurance: "insurance",
} as const;

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  1: "Essentiel",
  2: "Utile",
  3: "Plaisir",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
  sv: "Svenska",
};

/** Réponse de POST /bank/transactions/sync. */
export interface BankTransactionsSyncResult {
  synced_count: number;
  total_stored: number;
}

/** Transaction bancaire brute (GET /bank/transactions) -- miroir de
 * BankTransactionOut côté API. Crédit si `value > 0`, débit si `value < 0`.
 * Consommée par l'algorithme de détection du revenu (lib/detectSalary.ts). */
export interface BankTransaction {
  id: string;
  wording: string;
  value: number;
  /** Format ISO "YYYY-MM-DD". */
  date: string;
  transaction_type: string | null;
}

/** Candidat renvoyé par GET /bank/subscriptions/detect. */
export interface DetectedSubscription {
  merchant: string;
  price: number;
  frequency: "weekly" | "monthly" | "yearly";
  occurrences: number;
  last_date: string;
  next_estimated_date: string;
  confidence: number;
  source_transaction_ids: string[];
  category: string;
  /** Abonnement existant déjà déduit du même marchand (comparaison
   * normalisée côté serveur, détecte aussi les libellés bancaires bruts
   * hérités) -- si présent, ce candidat doit mettre à jour cet abonnement
   * plutôt que d'en créer un nouveau. */
  matched_subscription_id: string | null;
  /** Autres abonnements existants correspondant au même marchand (doublons
   * hérités, ex: libellés bruts différents) -- proposés au nettoyage. */
  duplicate_subscription_ids: string[];
}

/** Réponse de GET /bank/status. */
export interface BankStatus {
  bank_connected: boolean;
  bank_name: string | null;
  last_sync_at: string | null;
  total_transactions: number;
}

// ---------------------------------------------------------------------------
// Back-Office Super Admin
// ---------------------------------------------------------------------------

/** Ligne du tableau CRM GET /admin/users. */
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  is_premium: boolean;
  is_admin: boolean;
  bank_connected: boolean;
  created_at: string | null;
  last_login_at: string | null;
  subscriptions_count: number;
}

export interface AdminUsersPage {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

/** Corps de PATCH /admin/users/{id} - tous les champs sont optionnels. */
export interface AdminUserUpdateInput {
  email?: string;
  first_name?: string;
  is_premium?: boolean;
  is_admin?: boolean;
}

/** Réponse de GET /admin/analytics. */
export interface AdminAnalytics {
  total_users: number;
  new_users_today: number;
  premium_users: number;
  premium_conversion_rate: number;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/** Corps de POST /contact (formulaire public, aucune authentification requise). */
export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}
