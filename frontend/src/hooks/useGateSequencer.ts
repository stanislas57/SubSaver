import * as React from "react";

/** Délai minimum entre la fermeture d'un pop-up d'activation et l'ouverture
 * du suivant -- laisse le temps à l'utilisateur d'assimiler ce qui vient de
 * se passer plutôt que d'enchaîner les modales d'un coup. */
const MIN_GAP_MS = 300;

/** Fait défiler une liste de "gates" (pop-ups d'activation : charte, bienvenue
 * Premium, objectif, connexion bancaire...) un par un, jamais plusieurs en
 * même temps. Chaque gate n'a le droit de décider s'il doit s'afficher que
 * lorsqu'il est actif (`current === son id`), et signale la suite via
 * `advance(didShow)` : s'il n'avait rien à montrer, l'étape suivante démarre
 * immédiatement ; s'il a effectivement affiché un pop-up, l'étape suivante
 * attend MIN_GAP_MS après sa fermeture avant de démarrer à son tour. */
export function useGateSequencer<const Steps extends readonly string[]>(steps: Steps) {
  const [index, setIndex] = React.useState(0);
  const advancedRef = React.useRef(false);

  React.useEffect(() => {
    advancedRef.current = false;
  }, [index]);

  function advance(didShow: boolean) {
    if (advancedRef.current) return;
    advancedRef.current = true;
    if (didShow) {
      setTimeout(() => setIndex((i) => i + 1), MIN_GAP_MS);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return { current: steps[index] as Steps[number] | undefined, advance };
}
