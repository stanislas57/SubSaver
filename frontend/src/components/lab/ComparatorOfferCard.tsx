import { ExternalLink, Check, X, Trophy, Tag, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketOffer, Currency } from "@/types";

export interface ComparatorOfferCardProps {
  offer: MarketOffer;
  currency: Currency;
  /** "Le moins cher" -- offre au prix mensuel le plus bas de la catégorie affichée. */
  isCheapest?: boolean;
  /** "Meilleur compromis" -- score de pertinence le plus élevé (pas forcément la moins chère). */
  isBestMatch?: boolean;
  currentPrice?: number;
}

/** Carte d'offre générique : les 3 premiers `attributes` de l'offre s'affichent
 * toujours, quelle que soit la famille (VOD, forfaits mobiles, musique...) --
 * c'est la donnée elle-même qui porte les libellés propres à chaque catégorie,
 * pas le composant. */
export function ComparatorOfferCard({ offer, currency, isCheapest, isBestMatch, currentPrice }: ComparatorOfferCardProps) {
  const savings = currentPrice ? currentPrice - offer.price : null;

  return (
    <Card className={cn((isCheapest || isBestMatch) && "border-accent ring-1 ring-accent")}>
      <CardContent className="p-5">
        {(isCheapest || isBestMatch) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {isCheapest && (
              <Badge variant="success" className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" /> Le moins cher
              </Badge>
            )}
            {isBestMatch && (
              <Badge variant="default" className="inline-flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Meilleur compromis
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 font-display text-base font-bold text-text-main">{offer.name}</h4>
            {offer.promo && <p className="line-clamp-2 text-xs font-medium text-accent">{offer.promo}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-bold text-text-main">{formatPrice(offer.price, currency)}</p>
            <p className="text-xs text-text-muted">{offer.engagement}</p>
            {offer.annual_price !== null && (
              <p className="text-xs text-accent">
                ou {formatPrice(offer.annual_price, currency)}/an
              </p>
            )}
          </div>
        </div>

        {savings !== null && savings > 0 && (
          <p className="mt-2 text-sm font-medium text-accent">
            Économie estimée : {formatPrice(savings, currency)}/mois
          </p>
        )}

        {offer.setup_fee !== null && (
          <p className="mt-2 rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
            Frais à prévoir : {formatPrice(offer.setup_fee, currency)}
            {offer.setup_fee_note ? ` — ${offer.setup_fee_note}` : ""}
          </p>
        )}

        {offer.attributes.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-y border-border py-3 text-xs">
            {offer.attributes.slice(0, 4).map((attr) => (
              <div key={attr.key} className="min-w-0">
                <dt className="flex items-center gap-1 text-text-muted">
                  <ListChecks className="h-3 w-3 shrink-0" /> {attr.label}
                </dt>
                <dd className="truncate font-medium text-text-main">{attr.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3 space-y-1">
          {offer.pros.slice(0, 3).map((pro) => (
            <p key={pro} className="flex items-center gap-1.5 text-xs text-text-main">
              <Check className="h-3 w-3 shrink-0 text-accent" /> {pro}
            </p>
          ))}
          {offer.cons.slice(0, 2).map((con) => (
            <p key={con} className="flex items-center gap-1.5 text-xs text-text-muted">
              <X className="h-3 w-3 shrink-0 text-red-400" /> {con}
            </p>
          ))}
        </div>

        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => window.open(offer.link, "_blank")}>
          Voir l'offre <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Tarif vérifié le {offer.price_checked_at}
        </p>
      </CardContent>
    </Card>
  );
}
