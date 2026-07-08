namespace SubSaver.Engine

/// ---------------------------------------------------------------------------
/// Moteur de détection — pipeline 100% fonctions pures :
///
///   RawTransaction list
///     |> keepDebits
///     |> groupByCleanMerchant     (Sanitization)
///     |> List.choose analyzeGroup (récurrence + constance + dictionnaire + score)
///
/// Aucun IO, aucune mutation, aucune exception attendue : tout cas dégénéré
/// (groupe d'1 transaction, libellé vide...) est éliminé par `option`, pas
/// par un throw. Testable ligne à ligne sans mock.
/// ---------------------------------------------------------------------------
module Detection =

    open System
    open SubSaver.Engine.Domain
    open SubSaver.Engine.Sanitization
    open SubSaver.Engine.KnownMerchants

    // -- Étape 1 : ne garder que les débits ---------------------------------

    let keepDebits (transactions: RawTransaction list) : RawTransaction list =
        transactions |> List.filter (fun tx -> tx.Amount < 0m)

    // -- Étape 2 : regroupement par nom de marchand nettoyé -----------------

    let groupByCleanMerchant
        (transactions: RawTransaction list)
        : (CleanMerchantName * RawTransaction list) list =
        transactions
        |> List.choose (fun tx ->
            cleanMerchantName tx.Wording |> Option.map (fun name -> name, tx))
        |> List.groupBy fst
        |> List.map (fun (name, pairs) -> name, pairs |> List.map snd)

    // -- Étape 3 : récurrence temporelle ------------------------------------

    /// Deltas (jours) entre transactions consécutives, triées par date.
    let daysBetweenOccurrences (transactions: RawTransaction list) : float list =
        transactions
        |> List.sortBy (fun tx -> tx.Date)
        |> List.pairwise
        |> List.map (fun (a, b) -> (b.Date - a.Date).TotalDays)

    /// Classe la fréquence selon la moyenne des deltas et les fenêtres
    /// nominales (Monthly = 30 ± 3 jours, cf. Domain.frequencyWindows).
    /// Renvoie aussi l'écart moyen à la fenêtre, réutilisé par le scoring.
    let classifyFrequency (deltas: float list) : Frequency * float =
        match deltas with
        | [] -> Unknown, infinity
        | _ ->
            let mean = List.average deltas

            let candidate =
                frequencyWindows
                |> List.tryPick (fun (freq, (nominal, tolerance)) ->
                    let deviation = abs (mean - nominal)
                    if deviation <= tolerance then Some(freq, deviation) else None)

            match candidate with
            | Some (freq, deviation) -> freq, deviation
            | None -> Unknown, infinity

    // -- Étape 4 : constance du montant --------------------------------------

    /// Déviation relative maximale des montants par rapport à leur moyenne
    /// (0.0 = tous identiques). Comparée à la tolérance de la catégorie :
    /// 0% pour le streaming, 15% pour l'énergie, etc.
    let amountSpread (transactions: RawTransaction list) : float =
        let amounts = transactions |> List.map (fun tx -> float (abs tx.Amount))
        match amounts with
        | [] | [ _ ] -> 0.0
        | _ ->
            let mean = List.average amounts
            if mean = 0.0 then 0.0
            else amounts |> List.map (fun a -> abs (a - mean) / mean) |> List.max

    // -- Étape 5 : scoring 0..100 --------------------------------------------

    /// Barème (spec) : dictionnaire connu = +40, écart temporel parfait = +40,
    /// montant exact = +20. Les deux derniers sont dégressifs à l'intérieur de
    /// leur tolérance plutôt que binaires : un abonnement à 30 ± 2 jours vaut
    /// plus qu'un 30 ± 3, sans tomber à zéro.
    let score
        (isKnownMerchant: bool)
        (frequency: Frequency)
        (timingDeviation: float)
        (spread: float)
        (tolerance: float)
        : int =
        let merchantPoints = if isKnownMerchant then 40 else 0

        let timingPoints =
            match frequency with
            | Unknown -> 0
            | freq ->
                let _, (_, maxTolerance) =
                    frequencyWindows |> List.find (fun (f, _) -> f = freq)
                // Parfait (déviation 0) -> 40 ; à la limite de tolérance -> 15.
                let ratio = min 1.0 (timingDeviation / maxTolerance)
                15 + int (round (25.0 * (1.0 - ratio)))

        let amountPoints =
            if spread = 0.0 then 20 // montant strictement identique à chaque occurrence
            elif spread <= tolerance then 10 // fluctuation légitime pour la catégorie
            else 0

        merchantPoints + timingPoints + amountPoints

    // -- Pipeline complet -----------------------------------------------------

    /// Analyse un groupe de transactions d'un même marchand nettoyé.
    /// None si le groupe ne peut pas être un abonnement (moins de 2
    /// occurrences : aucune récurrence mesurable).
    let analyzeGroup
        (merchant: CleanMerchantName)
        (transactions: RawTransaction list)
        : DetectedSubscription option =
        match transactions with
        | [] | [ _ ] -> None
        | _ ->
            let sorted = transactions |> List.sortBy (fun tx -> tx.Date)
            let deltas = daysBetweenOccurrences sorted
            let frequency, timingDeviation = classifyFrequency deltas

            let known = tryMatch merchant
            let canonicalName = known |> Option.map fst
            let category = known |> Option.map snd |> Option.defaultValue Other

            let spread = amountSpread sorted
            let tolerance = amountTolerance category

            let totalScore =
                score (Option.isSome known) frequency timingDeviation spread tolerance

            let last = List.last sorted
            let amounts = sorted |> List.map (fun tx -> abs tx.Amount)

            let nextEstimated =
                frequencyWindows
                |> List.tryPick (fun (f, (nominal, _)) ->
                    if f = frequency then Some(last.Date.AddDays(nominal)) else None)

            Some
                { Merchant = merchant
                  CanonicalName = canonicalName
                  Category = category
                  Frequency = frequency
                  AverageAmount = List.average amounts
                  LastAmount = abs last.Amount
                  Occurrences = List.length sorted
                  LastDate = last.Date
                  NextEstimatedDate = nextEstimated
                  Score = totalScore
                  Confidence = confidenceOfScore totalScore
                  SourceTransactionIds = sorted |> List.map (fun tx -> tx.Id) }

    /// Point d'entrée du moteur : transactions brutes -> détections triées par
    /// score décroissant. Les groupes trop faibles (Low) sont éliminés ici --
    /// ils ne sont jamais montrés, ni en auto-validé ni en validation humaine.
    let detectSubscriptions (transactions: RawTransaction list) : DetectedSubscription list =
        transactions
        |> keepDebits
        |> groupByCleanMerchant
        |> List.choose (fun (merchant, group) -> analyzeGroup merchant group)
        |> List.filter (fun d -> d.Confidence <> Low)
        |> List.sortByDescending (fun d -> d.Score)

    /// Sous-liste destinée à la vue de validation Fable (cf. SubSaver.UI).
    let pendingHumanValidation (detections: DetectedSubscription list) : DetectedSubscription list =
        detections |> List.filter (fun d -> d.Confidence = RequiresHumanValidation)
