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
  phone: string;
  language: Language;
  theme: Theme;
  currency: Currency;
  notification_pref: NotificationPref;
  is_premium: boolean;
  bank_connected: boolean;
}

/** Réponse de POST /auth/register et POST /auth/login (schéma Token). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/** Corps de POST /auth/register — déclenche l'envoi du SMS OTP. */
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  phone: string;
}

/** Réponse de POST /auth/register — confirmation du SMS envoyé. */
export interface RegisterResponse {
  phone_masked: string;
  attempts_remaining: number;
}

/** Corps de POST /auth/verify-otp — vérifie le code et retourne le token. */
export interface VerifyOtpRequest {
  email: string;
  phone: string;
  otp_code: string;
}

/** Réponse de POST /auth/verify-otp — identique à AuthResponse. */
export type VerifyOtpResponse = AuthResponse;

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
}

// ---------------------------------------------------------------------------
// Mode Famille
// ---------------------------------------------------------------------------

export interface FamilyMember {
  id: string;
  name: string;
  email: string | null;
  is_owner: boolean;
}

export interface FamilyGroup {
  id: string;
  name: string;
  members: FamilyMember[];
}

export interface FamilyBalance {
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
