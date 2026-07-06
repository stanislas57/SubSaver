/** Devine un domaine web plausible à partir du nom marchand, pour le logo. */
export function guessDomain(merchant: string): string {
  const lower = merchant.toLowerCase().trim();
  if (lower.includes(".")) return lower.replace(/\s+/g, "");
  return `${lower.replace(/\s+/g, "")}.com`;
}
