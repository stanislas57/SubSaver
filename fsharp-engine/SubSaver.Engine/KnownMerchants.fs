namespace SubSaver.Engine

/// ---------------------------------------------------------------------------
/// Dictionnaire de marchands connus (heuristique) — un match ici booste le
/// score de confiance de +40 points (cf. Scoring dans Detection.fs).
///
/// Le matching se fait par mot entier sur le libellé NETTOYÉ (jamais brut) :
/// "FREE" ne doit pas matcher "FREELANCE PAYMENT", d'où la regex \b plutôt
/// qu'un simple Contains. Les motifs longs sont testés avant les courts pour
/// que "AMAZON PRIME" gagne sur "AMAZON".
/// ---------------------------------------------------------------------------
module KnownMerchants =

    open System.Text.RegularExpressions
    open SubSaver.Engine.Domain

    /// (motif sur libellé nettoyé, nom canonique affichable, catégorie)
    let private entries : (string * string * MerchantCategory) list =
        [ // Streaming & VOD
          "NETFLIX", "Netflix", Streaming
          "DISNEY", "Disney+", Streaming
          "AMAZON PRIME", "Amazon Prime", Streaming
          "PRIME VIDEO", "Prime Video", Streaming
          "CANAL", "Canal+", Streaming
          "YOUTUBE PREMIUM", "YouTube Premium", Streaming
          "OCS", "OCS", Streaming
          // Musique
          "SPOTIFY", "Spotify", Music
          "DEEZER", "Deezer", Music
          "APPLE MUSIC", "Apple Music", Music
          "TIDAL", "Tidal", Music
          // Énergie
          "EDF", "EDF", Energy
          "ENGIE", "Engie", Energy
          "TOTALENERGIES", "TotalEnergies", Energy
          "TOTAL ENERGIES", "TotalEnergies", Energy
          "EKWATEUR", "Ekwateur", Energy
          // Télécom
          "ORANGE", "Orange", Telecom
          "SOSH", "Sosh", Telecom
          "SFR", "SFR", Telecom
          "BOUYGUES", "Bouygues Telecom", Telecom
          "FREE MOBILE", "Free Mobile", Telecom
          "FREEBOX", "Freebox", Telecom
          "PRIXTEL", "Prixtel", Telecom
          "RED BY SFR", "RED by SFR", Telecom
          // Logiciels & services
          "MICROSOFT", "Microsoft 365", Software
          "ADOBE", "Adobe", Software
          "DROPBOX", "Dropbox", Software
          "ICLOUD", "iCloud+", Software
          "GITHUB", "GitHub", Software
          "NORDVPN", "NordVPN", Software ]

    /// Index précompilé, trié par longueur de motif décroissante : les motifs
    /// spécifiques ("FREE MOBILE") sont toujours testés avant les génériques
    /// qu'ils contiennent ("FREE" n'est volontairement PAS dans la liste --
    /// trop ambigu seul, source de faux positifs).
    let private index : (Regex * string * MerchantCategory) list =
        entries
        |> List.sortByDescending (fun (pattern, _, _) -> pattern.Length)
        |> List.map (fun (pattern, canonical, category) ->
            Regex(@"\b" + Regex.Escape(pattern) + @"\b", RegexOptions.Compiled), canonical, category)

    /// Renvoie (nom canonique, catégorie) si le nom nettoyé correspond à un
    /// marchand connu, None sinon. Fonction pure et totale.
    let tryMatch (CleanMerchantName cleaned) : (string * MerchantCategory) option =
        index
        |> List.tryPick (fun (rx, canonical, category) ->
            if rx.IsMatch(cleaned) then Some(canonical, category) else None)
