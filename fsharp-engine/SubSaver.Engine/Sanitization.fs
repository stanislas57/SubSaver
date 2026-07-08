namespace SubSaver.Engine

/// ---------------------------------------------------------------------------
/// Sanitization — libellé bancaire brut -> CleanMerchantName.
///
/// Fonction pure : même entrée => même sortie, aucun effet de bord. L'ordre
/// des passes compte (préfixes d'abord, sinon "PRLV SEPA" masque le motif
/// suivant) et chaque regex est documentée par l'exemple qu'elle cible.
/// ---------------------------------------------------------------------------
module Sanitization =

    open System.Text.RegularExpressions
    open SubSaver.Engine.Domain

    /// Préfixes de "bruit bancaire" français courants, en tête de libellé.
    /// Ex: "PRLV SEPA NETFLIX.COM" -> "NETFLIX.COM"
    let private noisePrefixes =
        [ @"^PRLV\s+SEPA\s*"
          @"^PRELEVEMENT\s+SEPA\s*"
          @"^PRLV\s*"
          @"^CB\s+"
          @"^CARTE\s+"
          @"^VIR\s+SEPA\s*"
          @"^ACHAT\s+CB\s*"
          @"^PAIEMENT\s+(PSC\s+)?" ]
        |> List.map (fun p -> Regex(p, RegexOptions.Compiled))

    /// Références SEPA (mandat, RUM, ICS, échéance...) n'importe où dans le
    /// libellé. Ex: "EDF RUM: FR12ABC456 ECH 05/07" -> retire "RUM: FR12ABC456".
    let private sepaReference =
        Regex(@"\b(RUM|MANDAT|ICS|ECH|REF)\s*[:\-]?\s*\S+", RegexOptions.Compiled)

    /// Dates numériques : "05/07", "05/07/2026", "05-07-26", "05.07".
    let private embeddedDate =
        Regex(@"\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b", RegexOptions.Compiled)

    /// Numéros de facture / client / autorisation : toute suite de 4 chiffres
    /// ou plus. Ex: "NETFLIX.COM 442213" -> "NETFLIX.COM". C'est aussi une
    /// mesure de CONFIDENTIALITÉ : un numéro de client n'a rien à faire dans
    /// un nom de marchand affiché (ni a fortiori partagé).
    let private longDigitRun = Regex(@"\b\d{4,}\b", RegexOptions.Compiled)

    /// Code pays résiduel en fin de libellé. Ex: "SPOTIFY FR" -> "SPOTIFY".
    let private trailingCountry = Regex(@"\s+FR\d*$", RegexOptions.Compiled)

    let private multiSpace = Regex(@"\s{2,}", RegexOptions.Compiled)

    /// Pipeline de nettoyage complet. Renvoie None si le libellé ne contient
    /// plus rien d'exploitable après nettoyage (100% bruit) — le type force
    /// l'appelant à gérer ce cas au lieu de propager une chaîne vide.
    let cleanMerchantName (rawWording: string) : CleanMerchantName option =
        let upper = rawWording.Trim().ToUpperInvariant()

        let withoutPrefix =
            noisePrefixes |> List.fold (fun acc rx -> (rx: Regex).Replace(acc, "")) upper

        let cleaned =
            withoutPrefix
            |> fun s -> sepaReference.Replace(s, " ")
            |> fun s -> embeddedDate.Replace(s, " ")
            |> fun s -> longDigitRun.Replace(s, " ")
            |> fun s -> trailingCountry.Replace(s, "")
            |> fun s -> multiSpace.Replace(s, " ")
            |> fun s -> s.Trim([| ' '; '-'; '*'; '.'; ','; ':' |])

        if cleaned = "" then None else Some (CleanMerchantName cleaned)
