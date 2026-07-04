import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { FamilyBalance, Currency } from "@/types";

export function FamilyBalanceCard({ balance, currency }: { balance: FamilyBalance; currency: Currency }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium text-text-main">{balance.member_name}</p>
          <p className="text-xs text-text-muted">{balance.share_percent}% de la part commune</p>
        </div>
        <p className="font-display text-base font-bold text-text-main">{formatPrice(balance.amount_owed, currency)}</p>
      </CardContent>
    </Card>
  );
}
