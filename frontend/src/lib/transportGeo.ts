import { TRANSPORT_ATTRIBUTE_KEYS, TRANSPORT_SCOPE_LABELS } from "@/types";
import type { MarketOffer } from "@/types";

function getAttr(offer: MarketOffer, key: string): string | undefined {
  return (offer.attributes ?? []).find((attr) => attr.key === key)?.value;
}

/** Villes françaises où les transports en commun sont gratuits pour les
 * résidents -- indépendant du catalogue d'offres (une ville gratuite n'a pas
 * forcément de ligne dédiée dans `MARKET_OFFERS_FALLBACK`/la DB) : permet à
 * `getFreeTransportAlert` de fonctionner même pour des villes non seedées.
 * Dunkerque et Montpellier ont une offre dédiée (cf. migration
 * `c4d8f2a913e7_add_transport_mobilite_market_offers`) ; Aubagne, Châteauroux
 * et Niort sont gratuites aussi mais sans ligne de catalogue dédiée. */
export const FREE_TRANSPORT_CITIES = ["Dunkerque", "Montpellier", "Aubagne", "Châteauroux", "Niort"] as const;

export function isFreeTransportCity(city: string): boolean {
  const normalized = city.trim().toLowerCase();
  return FREE_TRANSPORT_CITIES.some((free) => free.toLowerCase() === normalized);
}

/** Arbre de décision géographique : une offre "Urbain local" ne doit jamais
 * être proposée à un utilisateur d'une autre ville, une offre "Régional
 * (TER)" doit rester dans la région choisie, une offre "National" (SNCF,
 * covoiturage) est toujours pertinente. Tant que l'utilisateur n'a choisi ni
 * région ni ville (valeurs vides), aucun filtrage géographique n'est appliqué
 * -- le sélecteur est additif, pas une contrainte de départ. */
export function matchesUserLocation(offer: MarketOffer, region: string, city: string): boolean {
  const scope = getAttr(offer, TRANSPORT_ATTRIBUTE_KEYS.scope);
  if (!scope) return true; // catégorie sans attribute géo (pas Transport) : jamais filtrée ici

  if (scope === TRANSPORT_SCOPE_LABELS.NATIONAL) return true;

  if (scope === TRANSPORT_SCOPE_LABELS.REGIONAL_TER) {
    if (!region) return true;
    return getAttr(offer, TRANSPORT_ATTRIBUTE_KEYS.region) === region;
  }

  if (scope === TRANSPORT_SCOPE_LABELS.URBAN_LOCAL) {
    if (!city) return true;
    const covered = getAttr(offer, TRANSPORT_ATTRIBUTE_KEYS.coveredCities) ?? "";
    return covered.toLowerCase().includes(city.trim().toLowerCase());
  }

  return true;
}

/** -50% obligatoire (Code du travail Art. L3261-2) sur les abonnements
 * domicile-travail urbains/régionaux -- n'affecte pas les cartes de réduction
 * SNCF (pas un abonnement domicile-travail) ni le covoiturage subventionné
 * différemment (déjà pris en compte dans son propre prix). Retourne une
 * copie : ne mute jamais l'offre source (réutilisée par le cache react-query). */
export function withEmployerReimbursement(offer: MarketOffer): MarketOffer {
  const eligible = (getAttr(offer, TRANSPORT_ATTRIBUTE_KEYS.employerReimbursement) ?? "").startsWith("50%");
  if (!eligible) return offer;
  return { ...offer, price: Math.round((offer.price / 2) * 100) / 100 };
}
