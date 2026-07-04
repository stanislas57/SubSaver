import type { Subscription, User } from "@/types";

/**
 * Génère une lettre de résiliation type à partir des données déjà en cache
 * (aucun appel API dédié — décision d'architecture : fonction pure côté client).
 */
export function generateCancellationLetter(subscription: Subscription, user: User): string {
  const today = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date()
  );

  return `${user.first_name}
${user.email}

Objet : Résiliation de mon abonnement ${subscription.name}

${today}

Madame, Monsieur,

Je vous informe par la présente de ma décision de résilier mon abonnement "${subscription.name}" (compte associé à l'adresse ${user.email}), avec effet à la prochaine échéance de facturation.

Je vous remercie de bien vouloir m'confirmer la prise en compte de cette résiliation ainsi que la date de fin effective de mon abonnement, par retour de courrier ou par email.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${user.first_name}`;
}
