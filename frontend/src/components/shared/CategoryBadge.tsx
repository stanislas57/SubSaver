import { Badge } from "@/components/ui/badge";

const CATEGORY_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  Telephonie: "default",
  Sport: "success",
  Streaming: "danger",
  Banque: "neutral",
  Musique: "default",
  Transport: "warning",
  Autre: "neutral",
};

export function CategoryBadge({ category }: { category: string }) {
  return <Badge variant={CATEGORY_VARIANT[category] ?? "neutral"}>{category}</Badge>;
}
