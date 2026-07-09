/**
 * Construit un lien `mailto:` prêt à l'emploi. `subject` et `body` sont
 * systématiquement passés par `encodeURIComponent` -- indispensable pour que
 * les sauts de ligne, espaces et accents survivent une fois interprétés par
 * le client mail de destination (Gmail, Outlook, Apple Mail...), qui reçoit
 * ces valeurs comme de simples paramètres de query string.
 */
export function generateMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
