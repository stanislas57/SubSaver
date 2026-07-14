import type { Currency } from "@/types";

const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: "fr-FR",
  USD: "en-US",
  GBP: "en-GB",
  SEK: "sv-SE",
};

export function formatPrice(amount: number, currency: Currency = "EUR"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function billingDayLabel(day: number): string {
  return `Le ${day} du mois`;
}

/** Formate un horodatage ISO complet (ex: created_at/last_login_at du CRM
 * admin) -- contrairement à `formatDate`, ne pas ajouter "T00:00:00" : la
 * valeur contient déjà une heure précise. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
