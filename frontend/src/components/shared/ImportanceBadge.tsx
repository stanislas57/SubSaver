import { Badge } from "@/components/ui/badge";
import { IMPORTANCE_LABELS, type Importance } from "@/types";

const VARIANT: Record<Importance, "danger" | "default" | "neutral"> = {
  1: "danger",
  2: "default",
  3: "neutral",
};

export function ImportanceBadge({ importance }: { importance: Importance }) {
  return <Badge variant={VARIANT[importance]}>{IMPORTANCE_LABELS[importance]}</Badge>;
}
