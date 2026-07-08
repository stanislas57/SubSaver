# SubSaver Engine — implémentation F# / Fable (module de référence)

Moteur de détection d'abonnements récurrents à partir de transactions
bancaires brutes (API Powens), écrit en **F# pur** (fonctions pures,
immuabilité, Discriminated Unions), avec une vue de validation humaine en
**Fable + Feliz**.

## ⚠️ Positionnement dans le dépôt

Ce module est une **implémentation de référence autonome**. Le moteur en
production de SubServer est en Python
([`backend/app/core/transaction_analyzer.py`](../backend/app/core/transaction_analyzer.py)),
et le frontend en TypeScript/React. Rien ici n'est branché sur l'app — ce
code compile et se teste indépendamment, et sert de spécification exécutable
typée du moteur de détection.

### Correspondance avec le moteur Python de production

| Concept F# (ici) | Équivalent production |
|---|---|
| `Sanitization.cleanMerchantName` | `subscription_detector.clean_label` |
| `KnownMerchants.tryMatch` | `transaction_analyzer.match_whitelist` (liste blanche 19 catégories) |
| `Detection.classifyFrequency` | `_match_frequency` (fenêtres nominales/tolérances) |
| `Detection.detectSubscriptions` | `analyze_transactions` |
| Score 0–100 + `Confidence` DU | champ `confidence` 0..1 (continu, sans paliers) |
| `ValidationView` (Feliz) | `BankReportModal.tsx` ("Transactions importées") |

Différence de conception assumée : le moteur Python utilise une **liste
blanche stricte** (un marchand hors liste n'est jamais détecté), tandis que
cette version F# utilise un **scoring gradué** où un marchand inconnu mais
parfaitement régulier atteint 60/100 et passe en validation humaine. Les deux
approches sont documentées ; la version scoring est plus tolérante, la
liste blanche produit moins de faux positifs.

## Architecture

```
fsharp-engine/
├── SubSaver.Engine/          # Moteur pur (aucune dépendance, net8.0)
│   ├── Domain.fs             # Types stricts : RawTransaction, DetectedSubscription,
│   │                         #   DUs Frequency / Confidence / MerchantCategory
│   ├── Sanitization.fs       # Libellé brut -> CleanMerchantName (option)
│   ├── KnownMerchants.fs     # Dictionnaire heuristique (+40 pts au score)
│   └── Detection.fs          # Pipeline : débits -> groupes -> récurrence ->
│                             #   constance des montants -> scoring 0..100
├── SubSaver.Engine.Tests/    # Console de tests sans framework (dotnet run)
└── SubSaver.UI/              # Vue de validation Fable + Feliz (transpile en JS)
    └── ValidationView.fs
```

## Le pipeline (fonctions pures, composées)

```fsharp
transactions
|> keepDebits                 // 1. crédits éliminés
|> groupByCleanMerchant       // 2. sanitization + regroupement
|> List.choose analyzeGroup   // 3. récurrence + constance + dictionnaire + score
```

**Scoring** (spec) : dictionnaire connu **+40**, écart temporel parfait
**+40** (dégressif jusqu'à +15 à la limite de tolérance), montant exact
**+20** (+10 si la fluctuation reste dans la tolérance de la catégorie —
0 % streaming/musique, 15 % énergie, 10 % télécom).

**Paliers de confiance** : `>= 80` → `High` (auto-validé), `50–79` →
`RequiresHumanValidation` (affiché dans `ValidationView`), `25–49` →
`Medium`, `< 25` → `Low` (jamais remonté).

## Compiler et tester

Prérequis : [SDK .NET 8](https://dotnet.microsoft.com/download).

```bash
cd fsharp-engine
dotnet run --project SubSaver.Engine.Tests   # exécute la suite, exit 1 si échec
```

Pour la vue Feliz (nécessite le toolchain Fable) :

```bash
dotnet tool install -g fable
cd SubSaver.UI && dotnet fable               # transpile en JavaScript
```

## Pourquoi Feliz plutôt que Fable.React ?

Chaque prop est une fonction typée (`prop.className`, `prop.onClick`…) au
lieu de listes d'unions `HTMLProps` : erreurs attrapées à la compilation,
autocomplétion complète, syntaxe proche du TSX pour un dev React. C'est le
standard de facto de l'écosystème Fable.

## État de vérification

Le code de ce module a été écrit et revu, mais **pas compilé** dans
l'environnement de développement de ce dépôt (SDK .NET absent de la machine).
La suite `SubSaver.Engine.Tests` est fournie précisément pour valider le
moteur dès qu'un SDK .NET est disponible : `dotnet run` doit afficher
`TOUS LES TESTS PASSENT ✓`.
