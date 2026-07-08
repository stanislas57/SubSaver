namespace SubSaver.Engine

/// ---------------------------------------------------------------------------
/// Modélisation du domaine (DDD) — types stricts et immuables.
///
/// Choix délibérés :
/// - `TransactionId` et `CleanMerchantName` sont des single-case DU (pas des
///   string nues) : impossible de passer un libellé brut là où un nom nettoyé
///   est attendu — le compilateur fait le travail de revue de code.
/// - `System.DateTime` plutôt que `DateOnly` : Fable transpile DateTime vers
///   le Date natif JS sans friction, DateOnly a un support partiel.
/// ---------------------------------------------------------------------------
module Domain =

    open System

    type TransactionId = TransactionId of string

    /// Transaction brute telle que reçue de l'API Powens (Bank API de base).
    /// Amount négatif = débit (convention Powens conservée).
    type RawTransaction =
        { Id: TransactionId
          Wording: string
          Amount: decimal
          Date: DateTime }

    /// Nom de marchand après sanitization — ne peut être construit que par
    /// `Sanitization.cleanMerchantName`, jamais à la main depuis un libellé brut.
    type CleanMerchantName = CleanMerchantName of string

    /// Fréquence de récurrence détectée.
    type Frequency =
        | Weekly
        | Monthly
        | Yearly
        | Unknown

    /// Niveau de confiance de l'algorithme, dérivé du score 0..100 :
    ///   score >= 80 -> High (abonnement auto-validé)
    ///   50..79      -> RequiresHumanValidation (affiché dans la vue de validation)
    ///   25..49      -> Medium (trop faible : ignoré par défaut, conservé pour
    ///                  un futur mode "voir aussi les détections incertaines")
    ///   < 25        -> Low (bruit, jamais remonté)
    type Confidence =
        | High
        | Medium
        | Low
        | RequiresHumanValidation

    /// Catégorie marchande — pilote notamment la tolérance de variance des
    /// montants (0% pour le streaming, variable pour l'énergie/télécom).
    type MerchantCategory =
        | Streaming
        | Music
        | Energy
        | Telecom
        | Software
        | Other

    /// Résultat final du pipeline pour un groupe de transactions.
    type DetectedSubscription =
        { Merchant: CleanMerchantName
          CanonicalName: string option // renseigné si trouvé au dictionnaire de marchands connus
          Category: MerchantCategory
          Frequency: Frequency
          AverageAmount: decimal
          LastAmount: decimal
          Occurrences: int
          LastDate: DateTime
          NextEstimatedDate: DateTime option
          Score: int // 0..100
          Confidence: Confidence
          SourceTransactionIds: TransactionId list }

    /// Fenêtres nominales (jours, tolérance) par fréquence — la spec fixe
    /// Monthly à 30 ± 3 jours.
    let frequencyWindows =
        [ Weekly, (7.0, 2.0)
          Monthly, (30.0, 3.0)
          Yearly, (365.0, 15.0) ]

    let confidenceOfScore (score: int) : Confidence =
        if score >= 80 then High
        elif score >= 50 then RequiresHumanValidation
        elif score >= 25 then Medium
        else Low

    /// Tolérance de variance relative des montants par catégorie :
    /// un abonnement streaming ne change jamais de prix d'un mois à l'autre
    /// (0%), une facture d'énergie ou de télécom fluctue légitimement.
    let amountTolerance (category: MerchantCategory) : float =
        match category with
        | Streaming | Music | Software -> 0.0
        | Energy -> 0.15
        | Telecom -> 0.10
        | Other -> 0.02
