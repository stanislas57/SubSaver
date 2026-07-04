export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
export const STRIPE_BILLING_URL =
  import.meta.env.VITE_STRIPE_BILLING_URL || "https://billing.stripe.com/p/login/test_link_subserver";
export const TOKEN_STORAGE_KEY = "subserver_token";
