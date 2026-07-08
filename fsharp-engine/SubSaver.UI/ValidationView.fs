namespace SubSaver.UI

/// ---------------------------------------------------------------------------
/// Vue de validation humaine — Fable + Feliz.
///
/// Pourquoi Feliz plutôt que Fable.React "classique" : chaque prop est une
/// fonction typée (prop.className, prop.onClick...) au lieu de listes
/// d'unions HTMLProps — erreurs détectées à la compilation, autocomplétion
/// complète, et une syntaxe qui reste lisible pour un dev React venant de
/// TSX. C'est le standard de facto de l'écosystème Fable depuis des années.
///
/// Le composant est 100% contrôlé : il reçoit la liste des détections en
/// attente et deux callbacks — aucune mutation interne, l'état vit chez le
/// parent (Elmish ou hooks React), fidèle à l'esprit fonctionnel du moteur.
/// ---------------------------------------------------------------------------
module ValidationView =

    open Feliz
    open SubSaver.Engine.Domain
    open SubSaver.Engine.Detection

    let private frequencyLabel =
        function
        | Weekly -> "Hebdomadaire"
        | Monthly -> "Mensuel"
        | Yearly -> "Annuel"
        | Unknown -> "Fréquence inconnue"

    let private formatAmount (amount: decimal) = sprintf "%.2f €" (float amount)

    let private merchantDisplayName (detection: DetectedSubscription) =
        // Nom canonique du dictionnaire si disponible ("Netflix"), sinon le
        // nom nettoyé — jamais le libellé bancaire brut.
        match detection.CanonicalName with
        | Some canonical -> canonical
        | None ->
            let (CleanMerchantName cleaned) = detection.Merchant
            cleaned

    /// Carte d'une détection en attente de validation.
    [<ReactComponent>]
    let PendingCard
        (detection: DetectedSubscription)
        (onValidate: DetectedSubscription -> unit)
        (onReject: DetectedSubscription -> unit)
        =
        Html.li [
            prop.className "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-900/10 bg-white p-4 shadow-sm"
            prop.children [
                Html.div [
                    prop.className "min-w-0"
                    prop.children [
                        Html.p [
                            prop.className "truncate font-semibold text-slate-900"
                            prop.text (merchantDisplayName detection)
                        ]
                        Html.p [
                            prop.className "mt-1 text-sm text-slate-500"
                            prop.text (
                                sprintf "%s · %s en moyenne · %d occurrence(s) · score %d/100"
                                    (frequencyLabel detection.Frequency)
                                    (formatAmount detection.AverageAmount)
                                    detection.Occurrences
                                    detection.Score
                            )
                        ]
                    ]
                ]
                Html.div [
                    prop.className "flex shrink-0 gap-2"
                    prop.children [
                        Html.button [
                            prop.type' "button"
                            prop.className "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            prop.onClick (fun _ -> onValidate detection)
                            prop.text "Valider comme abonnement"
                        ]
                        Html.button [
                            prop.type' "button"
                            prop.className "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                            prop.onClick (fun _ -> onReject detection)
                            prop.text "Rejeter"
                        ]
                    ]
                ]
            ]
        ]

    /// Vue complète : ne montre QUE les détections `RequiresHumanValidation`
    /// (filtrées ici par sécurité même si le parent a déjà filtré — un
    /// abonnement High auto-validé ne doit jamais transiter par cet écran).
    [<ReactComponent>]
    let ValidationView
        (detections: DetectedSubscription list)
        (onValidate: DetectedSubscription -> unit)
        (onReject: DetectedSubscription -> unit)
        =
        let pending = pendingHumanValidation detections

        Html.section [
            prop.className "space-y-4"
            prop.children [
                Html.h2 [
                    prop.className "text-xl font-bold text-slate-900"
                    prop.text "Abonnements à confirmer"
                ]
                Html.p [
                    prop.className "text-sm text-slate-500"
                    prop.text (
                        sprintf
                            "%d détection(s) dont l'algorithme n'est pas assez sûr (score entre 50 et 79). Confirme ou rejette chacune."
                            pending.Length
                    )
                ]
                if List.isEmpty pending then
                    Html.p [
                        prop.className "rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
                        prop.text "Rien à valider : toutes les détections étaient suffisamment sûres."
                    ]
                else
                    Html.ul [
                        prop.className "space-y-3"
                        prop.children [
                            for detection in pending ->
                                PendingCard detection onValidate onReject
                        ]
                    ]
            ]
        ]
