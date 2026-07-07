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
}

/** Corps commun à POST /subscriptions et PUT /subscriptions/{id}. */
export type SubscriptionInput = Omit<Subscription, "id">;

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
