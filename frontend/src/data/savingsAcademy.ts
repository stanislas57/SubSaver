// ============================================================================
// SubSaver - Académie de l'Épargne (données statiques)
// ----------------------------------------------------------------------------
// Contenu éditorial de la section C de la page "Vos Ressources" : une FAQ /
// guide de décision d'éducation financière. Chaque réponse est un enchaînement
// de noeuds texte + liens hypertextes INLINE pointant vers des sources
// officielles réelles et vérifiées (INSEE, AMF, service-public.fr, comité
// Nobel, Journal of Political Economy). Séparé du composant pour que le texte
// et les sources soient relus/mis à jour sans toucher au rendu.
//
// Les montants (capacité d'épargne, cible d'épargne de précaution) sont
// injectés dynamiquement via `AcademyContext` : le contenu reste des DONNÉES
// (fonctions pures de contexte), la mise en forme reste dans le composant.
//
// NB sources : toutes les URL ci-dessous ont été vérifiées. Les chiffres cités
// (taux d'épargne des ménages à 18,2 % en 2024, plafond du Livret A à
// 22 950 €, taux 2,4 % depuis le 1er février 2025) proviennent directement des
// pages liées et sont à réactualiser si ces pages évoluent.
// ============================================================================

import type { LucideIcon } from "lucide-react";
import { ShieldCheck, TrendingUp, CalendarClock } from "lucide-react";

/** Un noeud de texte enrichi : soit une chaîne brute, soit un lien inline. */
export type RichNode = string | { text: string; href: string };

/** Une source citée, listée sous la réponse (autorité + traçabilité). */
export interface AcademySource {
  label: string;
  href: string;
  /** Organisme émetteur, affiché en petit (ex: "INSEE", "AMF"). */
  org: string;
}

/** Contexte dynamique injecté dans les réponses -- formaté par le composant
 * (chaînes déjà prêtes à l'affichage, ce module ne connaît pas la devise). */
export interface AcademyContext {
  /** Capacité d'épargne mensuelle calculée (ex: "450,00 €"). */
  savingsMonthly: string;
  /** Borne basse de l'épargne de précaution : 3 mois de charges (ex: "3 600 €"). */
  emergencyLow: string;
  /** Borne haute de l'épargne de précaution : 6 mois de charges (ex: "7 200 €"). */
  emergencyHigh: string;
  /** Nombre de mois pour atteindre la borne basse au rythme actuel (ex: "8"). */
  monthsToEmergency: string;
}

export interface AcademyItem {
  id: string;
  icon: LucideIcon;
  /** Intitulé de la question, capacité d'épargne injectée. */
  question: (ctx: AcademyContext) => string;
  /** Idée-force en une phrase, mise en avant sous la question. */
  takeaway: string;
  /** Corps de réponse : liste de paragraphes, chacun étant une suite de
   * noeuds (texte + liens inline). */
  body: (ctx: AcademyContext) => RichNode[][];
  sources: AcademySource[];
}

// ---------------------------------------------------------------------------
// Les trois piliers du parcours d'épargne, dans l'ordre de priorité financière :
// 1. sécuriser (épargne de précaution)  2. faire fructifier (long terme)
// 3. automatiser (comportement).
// ---------------------------------------------------------------------------

export const SAVINGS_ACADEMY: AcademyItem[] = [
  {
    id: "precaution",
    icon: ShieldCheck,
    question: (ctx) => `Par quoi commencer avec mes ${ctx.savingsMonthly} ce mois-ci ?`,
    takeaway:
      "Avant d'investir, constituez une épargne de précaution : 3 à 6 mois de charges, disponible immédiatement.",
    body: (ctx) => [
      [
        "La toute première étape n'est pas d'investir, mais de vous protéger. Une épargne de précaution est un matelas de sécurité, disponible à tout moment, qui vous évite de vous endetter au premier imprévu (panne, coup dur, perte d'emploi). La règle communément admise : ",
        { text: "l'équivalent de 3 à 6 mois de charges courantes", href: "https://www.insee.fr/fr/statistiques/8612566" },
        `. Dans votre cas, cela représente une cible d'environ ${ctx.emergencyLow} à ${ctx.emergencyHigh}.`,
      ],
      [
        `Au rythme de ${ctx.savingsMonthly} par mois, la borne basse est atteignable en environ ${ctx.monthsToEmergency} mois. Placez cette somme sur un support garanti et sans risque : le `,
        { text: "Livret A", href: "https://www.service-public.fr/particuliers/vosdroits/F2365" },
        " (plafond 22 950 €) puis le ",
        { text: "LDDS", href: "https://www.service-public.fr/particuliers/vosdroits/F2368" },
        " (plafond 12 000 €). Capital garanti, retrait immédiat, intérêts nets d'impôt : c'est exactement ce qu'on attend d'une réserve de précaution, pas d'un placement de rendement.",
      ],
      [
        "Ce réflexe est loin d'être anecdotique : l'INSEE mesure un ",
        { text: "taux d'épargne des ménages de 18,2 % du revenu disponible en 2024", href: "https://www.insee.fr/fr/statistiques/8594943" },
        ", un niveau historiquement élevé. L'enjeu n'est donc pas tant d'épargner que de bien orienter cette épargne, étape par étape.",
      ],
    ],
    sources: [
      { label: "Consommation et épargne des ménages (2024)", href: "https://www.insee.fr/fr/statistiques/8612566", org: "INSEE" },
      { label: "L'épargne des ménages au sommet", href: "https://www.insee.fr/fr/statistiques/8594943", org: "INSEE" },
      { label: "Fiche officielle Livret A", href: "https://www.service-public.fr/particuliers/vosdroits/F2365", org: "Service-Public.fr" },
      { label: "Fiche officielle LDDS", href: "https://www.service-public.fr/particuliers/vosdroits/F2368", org: "Service-Public.fr" },
    ],
  },
  {
    id: "long-terme",
    icon: TrendingUp,
    question: () => "Comment protéger mon argent de l'inflation sur le long terme ?",
    takeaway:
      "Une fois la précaution constituée, diversifiez vers des indices actions via PEA ou assurance-vie, sur un horizon long.",
    body: () => [
      [
        "Un Livret A protège votre capital, mais son rendement (",
        { text: "2,4 % depuis février 2025", href: "https://www.service-public.fr/particuliers/vosdroits/F2365" },
        ") peut, selon les périodes, être rattrapé par l'inflation : au-delà de votre réserve de précaution, laisser dormir tout votre argent sur un livret revient à en éroder lentement le pouvoir d'achat.",
      ],
      [
        "Pour l'épargne dont vous n'avez pas besoin à court terme, l'",
        { text: "AMF (Autorité des marchés financiers) recommande la diversification vers les actions sur le long terme", href: "https://www.amf-france.org/sites/institutionnel/files/private/2020-08/stimuler-linvestissement-de-long-terme-en-actions.pdf" },
        ". En pratique, on privilégie des supports diversifiés à faibles frais -- des fonds indiciels (ETF) répliquant un indice large comme le MSCI World ou le S&P 500 -- plutôt que de miser sur des titres individuels.",
      ],
      [
        "Deux enveloppes fiscales françaises sont taillées pour cet horizon : le ",
        { text: "PEA (Plan d'Épargne en Actions)", href: "https://www.amf-france.org/sites/institutionnel/files/private/2023-07/Rapport_GT_PEA_2023.pdf" },
        ", exonéré d'impôt sur les gains après 5 ans de détention, et l'assurance-vie, souple pour la transmission. L'AMF insiste sur un point : sur les marchés actions, c'est la ",
        { text: "durée de détention qui lisse le risque", href: "https://www.amf-france.org/sites/institutionnel/files/private/2020-08/stimuler-linvestissement-de-long-terme-en-actions.pdf" },
        " -- ces supports ne conviennent qu'à un argent que vous pouvez laisser investi plusieurs années.",
      ],
    ],
    sources: [
      { label: "Stimuler l'investissement de long terme en actions", href: "https://www.amf-france.org/sites/institutionnel/files/private/2020-08/stimuler-linvestissement-de-long-terme-en-actions.pdf", org: "AMF" },
      { label: "Rapport du groupe de travail PEA (2023)", href: "https://www.amf-france.org/sites/institutionnel/files/private/2023-07/Rapport_GT_PEA_2023.pdf", org: "AMF" },
    ],
  },
  {
    id: "automatisation",
    icon: CalendarClock,
    question: () => "Pourquoi l'épargne automatisée en début de mois fonctionne-t-elle mieux ?",
    takeaway:
      "« Se payer en premier » : un virement automatique juste après le salaire bat la volonté en fin de mois.",
    body: (ctx) => [
      [
        "Le principe « Se payer en premier » (",
        { text: "Pay Yourself First", href: "https://www.shlomobenartzi.com/save-more-tomorrow" },
        `) consiste à programmer un virement automatique de votre épargne -- ici ${ctx.savingsMonthly} -- vers votre livret ou votre PEA le lendemain de la réception du salaire, avant toute dépense. Vous épargnez ce que vous vous êtes fixé, puis vivez avec le reste, au lieu d'espérer épargner ce qu'il restera en fin de mois (souvent rien).`,
      ],
      [
        "Ce n'est pas qu'une astuce : c'est un résultat d'économie comportementale. Les travaux de ",
        { text: "Richard Thaler, prix Nobel d'économie 2017", href: "https://www.nobelprize.org/prizes/economic-sciences/2017/popular-information/" },
        ", montrent que nous cédons systématiquement au ",
        { text: "biais du présent", href: "https://www.nobelprize.org/prizes/economic-sciences/2017/popular-information/" },
        " : ce qui est immédiat pèse plus que ce qui est futur. L'automatisation neutralise ce biais en retirant la décision au moment le plus tentant.",
      ],
      [
        "Le programme ",
        { text: "« Save More Tomorrow » de Thaler et Benartzi", href: "https://www.journals.uchicago.edu/doi/10.1086/380085" },
        " a démontré empiriquement la puissance de cette approche : en s'appuyant sur l'inertie (rester inscrit par défaut) plutôt que sur la volonté, il a aidé plus de 15 millions de personnes à augmenter durablement leur taux d'épargne. La leçon pour vous : rendez l'épargne automatique et par défaut, et laissez l'inertie jouer en votre faveur.",
      ],
    ],
    sources: [
      { label: "Prix Nobel d'économie 2017 - Richard Thaler", href: "https://www.nobelprize.org/prizes/economic-sciences/2017/popular-information/", org: "The Nobel Prize" },
      { label: "Save More Tomorrow (Thaler & Benartzi, 2004)", href: "https://www.journals.uchicago.edu/doi/10.1086/380085", org: "Journal of Political Economy" },
      { label: "Save More Tomorrow - présentation", href: "https://www.shlomobenartzi.com/save-more-tomorrow", org: "Benartzi & Thaler" },
    ],
  },
];
