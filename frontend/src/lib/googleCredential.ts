/** Décodage du payload d'un ID token Google (JWT) côté client.
 * Ce token vient de Google Identity Services et est revérifié côté backend
 * avant toute connexion (cf. authService.loginWithGoogle) -- le décodage ici
 * ne sert qu'à pré-remplir le formulaire d'inscription (prénom, email),
 * jamais à authentifier quoi que ce soit, donc l'absence de vérification de
 * signature côté client n'est pas un problème de sécurité. */
export interface GoogleCredentialPayload {
  email: string;
  given_name?: string;
  name?: string;
}

export function decodeGoogleCredential(credential: string): GoogleCredentialPayload | null {
  try {
    const payloadPart = credential.split(".")[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
