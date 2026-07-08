/// Tests d'intégration du moteur de détection — console autonome (aucune
/// dépendance NuGet) : `dotnet run` suffit, code de sortie 1 au moindre échec.
module SubSaver.Engine.Tests.Program

open System
open SubSaver.Engine.Domain
open SubSaver.Engine.Sanitization
open SubSaver.Engine.Detection

let mutable failures = 0

let check (label: string) (condition: bool) =
    if condition then
        printfn "  ✓ %s" label
    else
        failures <- failures + 1
        printfn "  ✗ ÉCHEC : %s" label

let tx (id: string) (wording: string) (amount: decimal) (daysAgo: float) : RawTransaction =
    { Id = TransactionId id
      Wording = wording
      Amount = amount
      Date = DateTime.Today.AddDays(-daysAgo) }

[<EntryPoint>]
let main _ =

    printfn "-- Sanitization --------------------------------------------------"
    let cleanedNetflix = cleanMerchantName "PRLV SEPA NETFLIX.COM 442213 FR"
    check "préfixe PRLV SEPA + n° facture + code pays retirés"
        (cleanedNetflix = Some(CleanMerchantName "NETFLIX.COM"))

    let cleanedEdf = cleanMerchantName "PRLV SEPA EDF RUM: FR12ABC456 ECH 05/07/2026"
    check "références SEPA (RUM/ECH) et date retirées"
        (match cleanedEdf with
         | Some (CleanMerchantName s) -> s.StartsWith "EDF" && not (s.Contains "RUM") && not (s.Contains "05/07")
         | None -> false)

    check "libellé 100% bruit -> None (pas de chaîne vide)"
        (cleanMerchantName "PRLV SEPA 12345678 01/02/2026" = None)

    printfn "-- Pipeline complet ----------------------------------------------"
    let transactions =
        [ // Netflix : mensuel parfait, montant identique -> connu(40) + timing(40) + montant(20) = 100 -> High
          tx "n1" "PRLV SEPA NETFLIX.COM 442213 FR" -13.49m 65.0
          tx "n2" "PRLV SEPA NETFLIX.COM 442213 FR" -13.49m 35.0
          tx "n3" "PRLV SEPA NETFLIX.COM 442213 FR" -13.49m 5.0
          // EDF : mensuel en LIMITE de tolérance (deltas 33/33j -> moyenne 33,
          // déviation 3.0 = borne du ±3) et montants fluctuants dans la
          // tolérance énergie (15%) -> connu(40) + timing plancher(15) +
          // montant(10) = 65 -> zone 50..79 -> RequiresHumanValidation
          tx "e1" "PRLV SEPA EDF CLIENTS 87654321" -45.00m 66.0
          tx "e2" "PRLV SEPA EDF CLIENTS 87654321" -49.00m 33.0
          tx "e3" "PRLV SEPA EDF CLIENTS 87654321" -47.00m 0.0
          // Marchand inconnu mais mensuel parfait, montant exact
          // -> 0 + 40 + 20 = 60 -> RequiresHumanValidation
          tx "g1" "PRLV SEPA GYMLIB PARIS" -29.90m 60.0
          tx "g2" "PRLV SEPA GYMLIB PARIS" -29.90m 30.0
          tx "g3" "PRLV SEPA GYMLIB PARIS" -29.90m 0.0
          // Boulangerie : achats espacés sans rythme -> Unknown -> Low -> éliminé
          tx "b1" "CB BOULANGERIE MARTIN" -4.50m 47.0
          tx "b2" "CB BOULANGERIE MARTIN" -6.20m 29.0
          tx "b3" "CB BOULANGERIE MARTIN" -3.80m 11.0
          // Crédit (salaire) : jamais un abonnement
          tx "s1" "VIR SEPA EMPLOYEUR SALAIRE" 2500.00m 15.0
          // Occurrence unique : récurrence non mesurable -> éliminé
          tx "u1" "CB RESTAURANT CHEZ LUCIE" -54.00m 8.0 ]

    let detections = detectSubscriptions transactions

    let find name =
        detections
        |> List.tryFind (fun d ->
            let (CleanMerchantName m) = d.Merchant
            m.Contains(name: string))

    match find "NETFLIX" with
    | Some netflix ->
        check "Netflix : fréquence Monthly" (netflix.Frequency = Monthly)
        check (sprintf "Netflix : score 100 (obtenu %d)" netflix.Score) (netflix.Score = 100)
        check "Netflix : confiance High (auto-validé)" (netflix.Confidence = High)
        check "Netflix : nom canonique du dictionnaire" (netflix.CanonicalName = Some "Netflix")
        check "Netflix : prochaine échéance estimée à +30j"
            (netflix.NextEstimatedDate = Some(DateTime.Today.AddDays(-5.0).AddDays(30.0)))
    | None -> check "Netflix détecté" false

    match find "EDF" with
    | Some edf ->
        check "EDF : fréquence Monthly malgré le jitter" (edf.Frequency = Monthly)
        check (sprintf "EDF : score en zone 50..79 (obtenu %d)" edf.Score)
            (edf.Score >= 50 && edf.Score < 80)
        check "EDF : RequiresHumanValidation" (edf.Confidence = RequiresHumanValidation)
        check "EDF : catégorie Energy via dictionnaire" (edf.Category = Energy)
    | None -> check "EDF détecté" false

    match find "GYMLIB" with
    | Some gym ->
        check (sprintf "Marchand inconnu régulier : score 60 (obtenu %d)" gym.Score) (gym.Score = 60)
        check "Marchand inconnu régulier : RequiresHumanValidation"
            (gym.Confidence = RequiresHumanValidation)
    | None -> check "Marchand inconnu régulier détecté" false

    check "Boulangerie (aucun rythme) éliminée" (find "BOULANGERIE" = None)
    check "Salaire (crédit) éliminé" (find "SALAIRE" = None)
    check "Occurrence unique éliminée" (find "RESTAURANT" = None)

    let pending = pendingHumanValidation detections
    check (sprintf "Vue de validation : exactement 2 éléments (obtenu %d)" pending.Length)
        (pending.Length = 2)

    printfn "-- Scoring : bornes ----------------------------------------------"
    check "confidenceOfScore 80 -> High" (confidenceOfScore 80 = High)
    check "confidenceOfScore 79 -> RequiresHumanValidation" (confidenceOfScore 79 = RequiresHumanValidation)
    check "confidenceOfScore 50 -> RequiresHumanValidation" (confidenceOfScore 50 = RequiresHumanValidation)
    check "confidenceOfScore 49 -> Medium" (confidenceOfScore 49 = Medium)
    check "confidenceOfScore 24 -> Low" (confidenceOfScore 24 = Low)

    printfn ""
    if failures = 0 then
        printfn "TOUS LES TESTS PASSENT ✓"
        0
    else
        printfn "%d TEST(S) EN ÉCHEC ✗" failures
        1
