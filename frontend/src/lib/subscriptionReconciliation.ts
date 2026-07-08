import { guessDomain } from "@/lib/bank";
import { TRACKED_MERCHANT_KEYS_STORAGE_KEY } from "@/api/config";
import type { DetectedSubscription, Subscription, SubscriptionInput } from "@/types";

/**
 * Réconciliation d'état (Upsert & Cleanup) entre l'état actuel du tableau de
 * bord (`existingSubscriptions`) et le résultat d'une nouvelle détection
 * bancaire (`newDetectedSubscriptions`). Relancer la détection ne doit
 * jamais dupliquer un abonnement déjà suivi, ni laisser traîner un
 * abonnement que l'analyse des 6 derniers mois ne retrouve plus.
 *
 * La Clé Marchand normalisée (celle déjà produite par le TransactionAnalyzer
 * côté backend, ex: "Netflix", "EDF") sert d'identifiant unique de
 * comparaison entre les deux listes -- jamais l'id de la transaction, jamais
 * le libellé brut.
 *
 * Le nettoyage (`toRemove`) ne porte que sur les marchands déjà suivis via
 * une détection bancaire précédente (`trackedMerchantKeys`, à persister par
 * l'appelant entre deux appels, ex: localStorage). Un abonnement ajouté à la
 * main n'a par nature pas vocation à être retrouvé par un scan bancaire
 * (payé autrement, marchand hors liste blanche...) : sans cette distinction,
 * il serait proposé à la suppression à chaque re-détection alors qu'il n'a
 * jamais été résilié.
 */

export interface SubscriptionReconciliation {
  /** Marchands détectés qui ne correspondent à aucun abonnement existant. */
  toCreate: SubscriptionInput[];
  /** Abonnements existants dont le prix ou la date de prélèvement a changé
   * (ex: changement de forfait) -- à mettre à jour, jamais dupliquer. */
  toUpdate: { id: string; input: SubscriptionInput }[];
  /** Abonnements existants, déjà suivis via une détection bancaire
   * précédente (cf. `trackedMerchantKeys`), dont la Clé Marchand n'a plus
   * aucune occurrence dans les 6 derniers mois analysés -- probablement
   * résiliés. Exposés pour confirmation avant suppression plutôt que
   * supprimés en silence. */
  toRemove: Subscription[];
  /** Ensemble à jour des clés marchand suivies via détection bancaire, à
   * persister par l'appelant (ex: localStorage) et à repasser au prochain
   * appel. Ne jamais reconstruire ce jeu de données à partir de la seule
   * liste d'abonnements existants : elle peut aussi contenir des entrées
   * ajoutées manuellement, jamais destinées à être retrouvées par un scan
   * bancaire (payées autrement, marchand hors liste blanche...) -- les
   * inclure dans le nettoyage produirait une confirmation de suppression à
   * chaque re-détection pour des abonnements pourtant toujours valides. */
  updatedTrackedMerchantKeys: Set<string>;
}

/** Normalise une Clé Marchand pour une comparaison strictement insensible à
 * la casse et aux accents (ex: "EDF" == "edf" == "Édf"). Exportée pour que
 * l'appelant puisse ajuster `updatedTrackedMerchantKeys` de façon cohérente
 * (ex: si l'utilisateur annule une suppression proposée). */
export function normalizeMerchantKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

/** Construit le SubscriptionInput correspondant à un candidat détecté, en
 * conservant les champs que l'algorithme bancaire ne connaît pas
 * (importance, date de fin d'essai) depuis l'abonnement existant si présent. */
function buildInputFromCandidate(
  candidate: DetectedSubscription,
  existing: Subscription | undefined
): SubscriptionInput {
  return {
    name: candidate.merchant,
    price: candidate.price,
    category: candidate.category,
    domain: existing?.domain ?? guessDomain(candidate.merchant),
    billing_day: new Date(candidate.next_estimated_date).getDate(),
    importance: existing?.importance ?? 2,
    start_date: candidate.last_date,
    trial_end_date: existing?.trial_end_date ?? null,
  };
}

/** Trie les doublons d'une même Clé Marchand par date de départ décroissante :
 * la plus récente fait référence (cohérent avec la règle d'écrasement du
 * TransactionAnalyzer -- ne conserver que l'entrée la plus récente). */
function pickCanonicalSubscription(duplicates: Subscription[]): Subscription {
  return [...duplicates].sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""))[0];
}

export function reconcileSubscriptions(
  existingSubscriptions: Subscription[],
  newDetectedSubscriptions: DetectedSubscription[],
  trackedMerchantKeys: ReadonlySet<string> = new Set()
): SubscriptionReconciliation {
  // Regroupe par Clé Marchand -- jamais un Map naïf qui écraserait en
  // silence : si plusieurs lignes existantes partagent déjà la même clé
  // (doublons créés avant ce correctif, quand la réconciliation n'existait
  // pas encore), on doit les retrouver TOUTES pour ne garder que la plus
  // récente et proposer les autres au nettoyage, au lieu de les ignorer.
  const existingGroups = new Map<string, Subscription[]>();
  for (const subscription of existingSubscriptions) {
    const key = normalizeMerchantKey(subscription.name);
    const group = existingGroups.get(key);
    if (group) group.push(subscription);
    else existingGroups.set(key, [subscription]);
  }

  const existingByKey = new Map<string, Subscription>();
  const preExistingDuplicates: Subscription[] = [];
  for (const [key, group] of existingGroups) {
    const canonical = pickCanonicalSubscription(group);
    existingByKey.set(key, canonical);
    for (const subscription of group) {
      if (subscription.id !== canonical.id) preExistingDuplicates.push(subscription);
    }
  }

  const detectedKeys = new Set<string>();
  const toCreate: SubscriptionInput[] = [];
  const toUpdate: { id: string; input: SubscriptionInput }[] = [];
  const updatedTrackedMerchantKeys = new Set(trackedMerchantKeys);

  for (const candidate of newDetectedSubscriptions) {
    const key = normalizeMerchantKey(candidate.merchant);
    detectedKeys.add(key);
    updatedTrackedMerchantKeys.add(key);

    const existing = existingByKey.get(key);
    const input = buildInputFromCandidate(candidate, existing);

    if (!existing) {
      // Marchand jamais suivi jusqu'ici -> nouvelle ligne.
      toCreate.push(input);
      continue;
    }

    // Règle d'écrasement : seule la donnée la plus récente compte (nouveau
    // prix si changement de forfait, nouvelle date de prélèvement). Ne
    // déclenche une mise à jour que si quelque chose a réellement changé,
    // pour éviter un appel réseau inutile à chaque re-détection identique.
    const hasChanged = existing.price !== input.price || existing.billing_day !== input.billing_day;
    if (hasChanged) {
      toUpdate.push({ id: existing.id, input });
    }
  }

  // Nettoyage : uniquement parmi les abonnements déjà suivis via une
  // détection bancaire précédente (trackedMerchantKeys) -- jamais un
  // abonnement ajouté manuellement, qui n'a simplement pas vocation à être
  // retrouvé par un scan bancaire. Un marchand suivi dont la Clé Marchand
  // n'a AUCUNE occurrence dans la nouvelle analyse (source de vérité sur les
  // 6 derniers mois) est candidat à la suppression, et sort du suivi.
  //
  // Important : on filtre ici sur UNE seule entrée par clé (existingByKey,
  // le canonique de chaque groupe), jamais sur existingSubscriptions au
  // complet -- sinon un marchand à la fois dupliqué ET résilié ferait
  // apparaître deux fois le même id dans `toRemove` (une fois comme
  // doublon, une fois comme orphelin).
  const orphanedCanonical = [...existingByKey.values()].filter((subscription) => {
    const key = normalizeMerchantKey(subscription.name);
    return trackedMerchantKeys.has(key) && !detectedKeys.has(key);
  });
  for (const subscription of orphanedCanonical) {
    updatedTrackedMerchantKeys.delete(normalizeMerchantKey(subscription.name));
  }

  // Doublons déjà présents en base (même Clé Marchand, plusieurs lignes) :
  // toujours proposés au nettoyage, qu'ils soient re-détectés ou non -- ce
  // n'est jamais légitime d'avoir deux fois "Prixtel", contrairement à un
  // abonnement orphelin qui peut être manuel.
  const toRemove = [...preExistingDuplicates, ...orphanedCanonical];

  return { toCreate, toUpdate, toRemove, updatedTrackedMerchantKeys };
}

/** Charge l'ensemble des clés marchand suivies via détection bancaire
 * (persisté en localStorage, cf. `updatedTrackedMerchantKeys`). */
export function loadTrackedMerchantKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(TRACKED_MERCHANT_KEYS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveTrackedMerchantKeys(keys: ReadonlySet<string>): void {
  localStorage.setItem(TRACKED_MERCHANT_KEYS_STORAGE_KEY, JSON.stringify([...keys]));
}
