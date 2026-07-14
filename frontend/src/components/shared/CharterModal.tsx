import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OnboardingSteps } from "@/components/shared/OnboardingSteps";
import { useAuth } from "@/contexts/AuthContext";

type View = "summary" | "fullText";

/** Modale strictement bloquante d'acceptation de la charte informatique.
 *
 * Aucune voie de fermeture générique n'est laissée ouverte : pas de croix
 * (hideCloseButton), Echap et clic à l'extérieur sont neutralisés
 * (preventDefault), et `onOpenChange` est un no-op volontaire. La SEULE
 * façon de faire disparaître cette modale est d'appeler `acceptCharter()`,
 * qui met à jour `user.charter_accepted_at` -- CharterGate se démonte alors
 * de lui-même puisque sa condition d'affichage n'est plus remplie.
 *
 * Deux vues internes (résumé / texte intégral) plutôt qu'une navigation vers
 * une page séparée : ça évite tout risque qu'un changement de route
 * démonte accidentellement le gate avant l'acceptation, et le bouton
 * "J'accepte" reste accessible depuis les deux vues. */
export function CharterModal() {
  const { acceptCharter, isAcceptingCharter } = useAuth();
  const [view, setView] = React.useState<View>("summary");

  function handleAccept() {
    acceptCharter();
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        {view === "summary" ? (
          <>
            <OnboardingSteps current={1} />
            <DialogHeader>
              <DialogTitle>Charte informatique</DialogTitle>
              <DialogDescription>
                Avant de continuer, merci de prendre connaissance de la charte informatique de SubSaver et de
                l'accepter. Cette étape est obligatoire et ne s'affichera qu'une seule fois.
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm text-luxury-text-light">
              Elle définit les règles d'utilisation du Service, vos obligations de sécurité (confidentialité de vos
              identifiants, signalement de toute compromission), ainsi que les usages interdits (extraction
              automatisée, contournement des protections techniques, usage frauduleux). En cliquant sur « J'accepte »,
              vous confirmez avoir pris connaissance de l'intégralité de ce texte.
            </p>

            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setView("fullText")}
                className="text-sm font-medium text-luxury-sapphire hover:underline"
              >
                Lire la charte informatique
              </button>
              <Button onClick={handleAccept} loading={isAcceptingCharter} className="w-full sm:w-auto">
                J'accepte la charte informatique
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Charte informatique - texte intégral</DialogTitle>
            </DialogHeader>

            <div className="max-h-[55vh] space-y-6 overflow-y-auto pr-2 text-sm text-luxury-text-light">
              <p className="text-xs italic text-luxury-text-light">Dernière mise à jour : 7 juillet 2026</p>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 1 - Objet et champ d'application</h3>
                <p>
                  La présente Charte Informatique a pour objet de définir les règles d'utilisation du service
                  SubSaver (ci-après « le Service ») ainsi que les droits et obligations de tout Utilisateur créant
                  un compte. Elle s'applique dès la création du compte et pour toute la durée d'utilisation du
                  Service, en complément de la Charte de Confidentialité (voir /privacy) qui régit spécifiquement le
                  traitement des données personnelles.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 2 - Conditions d'accès et d'inscription</h3>
                <p>
                  L'accès au Service nécessite la création d'un compte nominatif, associé à une adresse e-mail
                  valide et vérifiée. L'Utilisateur s'engage à fournir des informations exactes et à jamais usurper
                  l'identité d'un tiers. Un compte est strictement personnel et ne peut être partagé, cédé ou revendu.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 3 - Obligations de sécurité de l'Utilisateur</h3>
                <p>
                  L'Utilisateur est seul responsable de la confidentialité de son mot de passe et de son adresse
                  e-mail associée. Toute action réalisée depuis un compte authentifié est présumée effectuée par son
                  titulaire. En cas de suspicion de compromission (accès non autorisé, perte du mot de passe),
                  l'Utilisateur s'engage à en informer SubSaver sans délai à l'adresse contact.subsaver@proton.me et
                  à modifier immédiatement son mot de passe.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 4 - Usage conforme du Service</h3>
                <p>Sont notamment interdits, sans que cette liste soit exhaustive :</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>La rétro-ingénierie, décompilation ou tentative d'extraction du code source du Service ;</li>
                  <li>
                    L'extraction automatisée de données (scraping), l'usage de robots, scripts ou tout moyen
                    technique visant à contourner les limitations d'usage normales du Service ;
                  </li>
                  <li>
                    Toute tentative de contournement des mesures de sécurité, d'authentification ou de limitation
                    technique (rate limiting, quotas) mises en place par SubSaver ;
                  </li>
                  <li>
                    L'utilisation du Service à des fins frauduleuses, illicites, ou contraires à l'ordre public ;
                  </li>
                  <li>La revente, sous-licence ou mise à disposition du Service à des tiers sans accord préalable.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 5 - Propriété intellectuelle</h3>
                <p>
                  Le code source, la marque, les interfaces graphiques et l'ensemble des éléments constitutifs du
                  Service demeurent la propriété exclusive de SubSaver. Aucune disposition de la présente Charte ne
                  saurait être interprétée comme une cession de droits de propriété intellectuelle. Les données
                  saisies ou détectées par l'Utilisateur (abonnements, préférences) lui restent propres et lui sont
                  restituables conformément à son droit à la portabilité (cf. Charte de Confidentialité).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 6 - Disponibilité et maintenance</h3>
                <p>
                  SubSaver s'efforce d'assurer une disponibilité continue du Service mais ne garantit pas une
                  disponibilité ininterrompue. Des interruptions programmées (maintenance) ou exceptionnelles
                  (incident technique, force majeure) peuvent survenir, sans que la responsabilité de SubSaver ne
                  puisse être engagée à ce titre.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 7 - Responsabilités et limites</h3>
                <p>
                  SubSaver agrège et présente des informations financières à titre purement informatif à partir des
                  données bancaires de l'Utilisateur. Ces informations ne constituent en aucun cas un conseil
                  financier, juridique ou fiscal. L'Utilisateur demeure seul responsable des décisions qu'il prend sur
                  la base des informations affichées par le Service.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 8 - Sanctions en cas de manquement</h3>
                <p>
                  Tout manquement à la présente Charte peut entraîner, selon sa gravité, un avertissement, une
                  suspension temporaire ou une résiliation immédiate et sans préavis du compte de l'Utilisateur
                  concerné, sans préjudice d'éventuelles poursuites judiciaires en cas d'usage frauduleux ou illicite.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 9 - Droit applicable et juridiction</h3>
                <p>
                  La présente Charte est soumise au droit français. Tout litige relatif à son interprétation ou à son
                  exécution relève de la compétence exclusive des tribunaux français, sauf disposition légale
                  impérative contraire applicable aux consommateurs.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-luxury-text">Article 10 - Acceptation</h3>
                <p>
                  En cliquant sur « J'accepte la charte informatique », l'Utilisateur reconnaît avoir lu, compris et
                  accepté sans réserve l'intégralité des dispositions de la présente Charte.
                </p>
              </section>
            </div>

            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setView("summary")}
                className="text-sm font-medium text-luxury-sapphire hover:underline"
              >
                ← Retour
              </button>
              <Button onClick={handleAccept} loading={isAcceptingCharter} className="w-full sm:w-auto">
                J'accepte la charte informatique
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
