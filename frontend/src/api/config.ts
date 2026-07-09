export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
export const STRIPE_BILLING_URL =
  import.meta.env.VITE_STRIPE_BILLING_URL || "https://buy.stripe.com/cNi28t3y0gnz5gvcDOds400";
/** Portail client Stripe pour les membres déjà Premium (gestion moyen de
 * paiement, factures, résiliation). Lien fictif en attendant que le backend
 * génère une vraie session de portail via l'API Stripe -- ne jamais renvoyer
 * un Premium existant vers STRIPE_BILLING_URL (page d'achat), ce qui lui
 * ferait payer un second abonnement. */
export const STRIPE_CUSTOMER_PORTAL_URL =
  import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL || "https://billing.stripe.com/p/session/test_fictif";
export const TOKEN_STORAGE_KEY = "subsaver_token";
export const TRACKED_MERCHANT_KEYS_STORAGE_KEY = "subsaver_bank_tracked_merchants";
