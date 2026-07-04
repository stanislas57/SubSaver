import { ExternalLink, Check, X, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketOffer, Currency } from "@/types";

export interface ComparatorOfferCardProps {
  offer: MarketOffer;
  currency: Currency;
  isBest?: boolean;
  currentPrice?: number;
}

export function ComparatorOfferCard({ offer, currency, isBest, currentPrice }: ComparatorOfferCardProps) {
  const savings = currentPrice ? currentPrice - offer.price : null;

  return (
    <Card className={cn(isBest && "border-accent ring-1 ring-accent")}>
      <CardContent className="p-5">
        {isBest && (
          <Badge variant="success" className="mb-3 inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Meilleure offre
          </Badge>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-display text-base font-bold text-text-main">{offer.name}</h4>
            {offer.promo && <p className="text-xs font-medium text-accent">{offer.promo}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-text-main">{formatPrice(offer.price, currency)}</p>
            <p className="text-xs text-text-muted">{offer.engagement}</p>
          </div>
        </div>

        {savings !== null && savings > 0 && (
          <p className="mt-2 text-sm font-medium text-accent">
            Économie estimée : {formatPrice(savings, currency)}/mois
          </p>
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
