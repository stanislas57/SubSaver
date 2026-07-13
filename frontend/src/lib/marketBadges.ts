import { SPORT_ATTRIBUTE_KEYS, TRANSPORT_ATTRIBUTE_KEYS, BANKING_ATTRIBUTE_KEYS } from "@/types";
import type { MarketOffer } from "@/types";

export interface OfferBadge {
  key: "max_savings" | "zero_commitment" | "home_fitness" | "free_transport" | "remote_work_friendly" | "zero_foreign_fees";
  label: string;
}

function getAttribute(offer: MarketOffer, key: string): string | undefined {
  return (offer.attributes ?? []).find((attr) => attr.key === key)?.value;
}

/** Économie annuelle nette vs l'abonnement actuel, frais de dossier de la
 * nouvelle offre déduits. Le frais de dossier de l'abonnement quitté est un
 * coût déjà englouti : il n'entre pas dans ce calcul. */
export function annualNetSavings(offer: MarketOffer, currentPrice: number): number {
  return (currentPrice - offer.price) * 12 - (offer.setup_fee ?? 0);
}

/** Badges calculés sur la liste d'offres affichée -- génériques, pas
 * hardcodés à une catégorie : s'appliquent à toute famille du comparateur qui
 * expose `engagement`/`setup_fee`, ou l'attribute optionnel `subcategory`
 * (aujourd'hui renseigné pour Sport, cf. migration `sport_attrs`). */
export function computeOfferBadges(offers: MarketOffer[], currentPrice?: number | null): Map<string, OfferBadge[]> {
  const badges = new Map<string, OfferBadge[]>();
  const push = (id: string, badge: OfferBadge) => badges.set(id, [...(badges.get(id) ?? []), badge]);

  if (currentPrice) {
    let bestId: string | null = null;
    let bestSavings = 0;
    for (const offer of offers) {
      const savings = annualNetSavings(offer, currentPrice);
      if (savings > bestSavings) {
        bestSavings = savings;
        bestId = offer.id;
      }
    }
    if (bestId) {
      push(bestId, { key: "max_savings", label: `💸 Économie maximale (-${Math.round(bestSavings)} €/an)` });
    }
  }

  for (const offer of offers) {
    if (offer.engagement.toLowerCase().startsWith("sans engagement")) {
      push(offer.id, { key: "zero_commitment", label: "🔓 Zéro engagement" });
    }
    if (getAttribute(offer, SPORT_ATTRIBUTE_KEYS.subcategory) === "Application de coaching / Fitness à domicile") {
      push(offer.id, { key: "home_fitness", label: "🏠 Idéal pour le sport à domicile" });
    }
    if ((getAttribute(offer, TRANSPORT_ATTRIBUTE_KEYS.freeTransport) ?? "").startsWith("Oui")) {
      push(offer.id, { key: "free_transport", label: "🎉 Gratuit pour les résidents" });
    }
    if ((getAttribute(offer, TRANSPORT_ATTRIBUTE_KEYS.flexibleUsage) ?? "").startsWith("Oui")) {
      push(offer.id, { key: "remote_work_friendly", label: "🏡 Idéal télétravail hybride" });
    }
    if ((getAttribute(offer, BANKING_ATTRIBUTE_KEYS.foreignFees) ?? "").startsWith("Gratuit")) {
      push(offer.id, { key: "zero_foreign_fees", label: "💳 Zéro frais à l'étranger" });
    }
  }

  return badges;
}
