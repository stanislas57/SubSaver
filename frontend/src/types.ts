// ============================================================================
// SubServer — Types partagés Frontend
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
  bank_connected: boolean;
  is_admin: boolean;
  /** null tant que l'utilisateur n'a jamais accepté la charte informatique --
   * c'est ce champ qui déclenche CharterGate (modale bloquante) à la
   * première connexion, cf. POST /users/me/accept-charter. */
  charter_accepted_at: string | null;
}

/** Réponse de POST /auth/login et POST /auth/verify-email (schéma Token). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/** Réponse de POST /auth/register : le compte n'est pas encore actif, un code
 * de vérification à 6 chiffres vient d'être envoyé par email. */
export interface RegisterResult {
  email: string;
  message: string;
}

export interface MessageResult {
  message: string;
}

/** Corps de PATCH /users/me — tous les champs sont optionnels. */
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
}

/** Corps commun à POST /subscriptions et PUT /subscriptions/{id}. */
export type SubscriptionInput = Omit<Subscription, "id" | "is_shared">;

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
// Constantes partagées
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "Logement",
  "Telephonie",
  "Sport",
  "Streaming",
  "Banque & Invest",
  "Musique",
  "Transport",
  "Autre",
] as const;

export type Category = (typeof CATEGORIES)[number];

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

/** Corps de PATCH /admin/users/{id} — tous les champs sont optionnels. */
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
