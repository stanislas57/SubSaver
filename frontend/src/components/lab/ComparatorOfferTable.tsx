import * as React from "react";
import { ExternalLink, Tag, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OfferBadge } from "@/lib/marketBadges";
import type { MarketOffer, Currency } from "@/types";

export interface ComparatorOfferTableProps {
  offers: MarketOffer[];
  currency: Currency;
  cheapestId: string | null;
  bestMatchId: string | null;
  /** Badges génériques calculés par computeOfferBadges, indexés par offer.id. */
  badgesByOfferId?: Map<string, OfferBadge[]>;
}

/** Vue tableau comparatif horizontal : même liste d'offres que les cartes,
 * mais plus dense -- utile dès que le nombre d'offres (jusqu'à 10) rend le
 * grid de cartes long à parcourir. Colonnes = union de tous les `attributes`
 * de la liste comparée (indexées par `key`, pas par position) afin que
 * chaque critère de chaque offre reste comparable en vis-à-vis même si une
 * offre ne pose pas tel attribute ou les liste dans un ordre différent --
 * "--" affiché quand une offre n'a pas ce critère plutôt que de décaler les
 * colonnes suivantes. */
export function ComparatorOfferTable({ offers, currency, cheapestId, bestMatchId, badgesByOfferId }: ComparatorOfferTableProps) {
  const attributeColumns = React.useMemo(() => {
    const columns = new Map<string, string>();
    for (const offer of offers) {
      for (const attr of offer.attributes ?? []) {
        if (!columns.has(attr.key)) columns.set(attr.key, attr.label);
      }
    }
    return Array.from(columns, ([key, label]) => ({ key, label }));
  }, [offers]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-hover text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="p-3 font-medium">Offre</th>
            <th className="p-3 font-medium">Prix</th>
            {attributeColumns.map((col) => (
              <th key={col.key} className="p-3 font-medium">{col.label}</th>
            ))}
            <th className="p-3 font-medium">Engagement</th>
            <th className="p-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => {
            const attrByKey = new Map((offer.attributes ?? []).map((attr) => [attr.key, attr.value]));
            return (
              <tr
                key={offer.id}
                className={cn(
                  "border-b border-border last:border-0",
                  (offer.id === cheapestId || offer.id === bestMatchId) && "bg-accent/5"
                )}
              >
                <td className="p-3">
                  <p className="font-medium text-text-main">{offer.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {offer.id === cheapestId && (
                      <Badge variant="success" className="inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Le moins cher
                      </Badge>
                    )}
                    {offer.id === bestMatchId && (
                      <Badge variant="default" className="inline-flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> Meilleur compromis
                      </Badge>
                    )}
                    {badgesByOfferId?.get(offer.id)?.map((badge) => (
                      <Badge key={badge.key} variant="neutral">{badge.label}</Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <p className="font-display font-bold text-text-main">{formatPrice(offer.price, currency)}/mois</p>
                  {(offer.annual_price ?? null) !== null && (
                    <p className="text-xs text-accent">ou {formatPrice(offer.annual_price as number, currency)}/an</p>
                  )}
                </td>
                {attributeColumns.map((col) => (
                  <td key={col.key} className="p-3 text-text-main">{attrByKey.get(col.key) ?? "--"}</td>
                ))}
                <td className="p-3 text-text-muted">{offer.engagement}</td>
                <td className="p-3">
                  <Button variant="outline" size="sm" onClick={() => window.open(offer.link, "_blank")}>
                    Voir <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
