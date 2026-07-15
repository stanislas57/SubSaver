import type { MarketOffer, Subscription } from "@/types";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Isole le nom de marque d'une offre catalogue (avant le " -- " ou la
 * parenthèse qui introduit la formule/précision) -- ex: "Le Met' Metz --
 * Abonnement mensuel" -> "le met metz", comparable à un libellé bancaire brut
 * ("LE MET' METZ SEPT26") sans dépendre d'une correspondance exacte. */
function offerBrandKey(offerName: string): string {
  return normalize(offerName.split(/--|\(/)[0]);
}

/** Déduit la localisation d'un abonnement à partir du marchand déjà
 * identifié dans le catalogue, sans jamais la demander à l'utilisateur : un
 * abonnement nommé "Le Met' Metz" ou "TCL Lyon" révèle à lui seul que son
 * souscripteur habite Metz ou Lyon -- l'utilisateur a déjà donné cette
 * information en contractant l'abonnement. Ne matche que contre les offres
 * locales du catalogue (`location` renseigné) : une offre nationale
 * n'apprend rien sur la ville de l'utilisateur. Si l'abonnement porte déjà
 * une `location` explicite (renseignée via l'API), elle prime toujours. */
export function inferLocation(userSub: Subscription, categoryOffers: MarketOffer[]): { location: string | null; region: string | null } {
  if (userSub.location) return { location: userSub.location, region: userSub.region ?? null };

  const subName = normalize(userSub.display_name || userSub.name);
  if (!subName) return { location: null, region: null };

  const matched = categoryOffers.find((offer) => {
    if (!offer.location) return false;
    const brand = offerBrandKey(offer.name);
    return brand.length > 2 && (subName.includes(brand) || brand.includes(subName));
  });

  return matched ? { location: matched.location ?? null, region: matched.region ?? null } : { location: null, region: null };
}

/** Une offre catalogue est la propre offre de l'utilisateur (même marque, cf.
 * `offerBrandKey` déjà utilisé par `inferLocation` ci-dessus) : ce n'est pas
 * une "alternative", donc elle n'a rien à faire dans ses propres résultats de
 * comparaison. */
function isUserCurrentOffer(userSub: Subscription, offer: MarketOffer): boolean {
  const subName = normalize(userSub.display_name || userSub.name);
  if (!subName) return false;
  const brand = offerBrandKey(offer.name);
  return brand.length > 2 && (subName.includes(brand) || brand.includes(subName));
}

/** Filtre grossier de l'Étape 3 du Comparateur : catégorie identique, puis
 * portée nationale (toujours pertinente) ou localisation strictement
 * identique à celle de l'abonnement comparé (déduite via `inferLocation` si
 * non renseignée explicitement), à l'exclusion de l'abonnement comparé
 * lui-même (cf. `isUserCurrentOffer`). Les filtres complémentaires (budget,
 * engagement, type d'activité/établissement, région/ville sélectionnées
 * manuellement...) s'appliquent ensuite sur ce résultat, cf.
 * lib/transportGeo.ts et LabComparatorPage. */
export function matchOffers(userSub: Subscription, offers: MarketOffer[]): MarketOffer[] {
  const { location } = inferLocation(userSub, offers);
  return offers.filter(
    (item) =>
      item.category === userSub.category &&
      (item.scope === "national" || item.location === location) &&
      !isUserCurrentOffer(userSub, item)
  );
}
