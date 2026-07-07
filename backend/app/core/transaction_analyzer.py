"""Moteur d'analyse des transactions bancaires -- Liste Blanche Stricte
+ Déduplication par Clé Marchand.

Logique en 4 temps :

1. Fenêtre d'analyse : on ne regarde que les transactions des 6 derniers mois
   (`ANALYSIS_WINDOW_MONTHS`). Tout ce qui est plus ancien est ignoré.
2. Liste blanche stricte : une transaction n'est retenue comme abonnement QUE
   SI son libellé (nettoyé du bruit bancaire habituel) correspond à l'un des
   marchands de `SUBSCRIPTION_WHITELIST` (matching souple par sous-chaîne,
   strictement insensible à la casse/accents/ponctuation, avec limites de
   mots pour éviter les faux positifs sur les entrées courtes comme "PC" ou
   "AWS"). Tout le reste est ignoré (ex: "LIDL", "SOGENAL", un simple billet
   "SNCF-VOYAGEURS"), même si le motif ressemble à une récurrence. Chaque
   match est aussitôt normalisé sous sa Clé Marchand canonique (ex:
   "DEEZERFR DEEZER" ou "deezer premium fr" deviennent tous les deux
   "Deezer") : c'est cette clé, jamais le libellé brut, qui sert de critère
   de regroupement.
3. Regroupement par Clé Marchand (reduce) + règle d'écrasement : toutes les
   transactions d'un même marchand sont groupées ensemble quel que soit leur
   montant (un changement de forfait ne doit jamais créer un doublon), puis
   seule LA PLUS RÉCENTE est conservée comme état final (prix actuel, date de
   prélèvement) -- les autres ne servent qu'à confirmer la périodicité.
4. Filtre d'activité : un marchand identifié n'est renvoyé que s'il est
   toujours actif -- soit une occurrence de paiement dans le mois en cours ou
   le mois précédent, soit une périodicité mensuelle/annuelle détectée dont la
   prochaine échéance logique n'est pas dépassée.

Module pur (aucune dépendance DB/FastAPI), testable isolément avec un simple
tableau de transactions. Ne dépend de `subscription_detector` que pour deux
utilitaires génériques et stables (le dataclass `RawTransaction`, partagé avec
l'API, et `clean_label`, le nettoyage de bruit bancaire) -- pas pour la
détection de récurrence elle-même, entièrement réécrite ci-dessous.
"""

import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta
from functools import reduce

from app.core.subscription_detector import RawTransaction, clean_label

# ---------------------------------------------------------------------------
# Règles métier
# ---------------------------------------------------------------------------

ANALYSIS_WINDOW_MONTHS = 6

# Intervalle nominal (jours, tolérance) pour chaque périodicité reconnue.
# Le whitelist ne contient que des services par abonnement (streaming, cloud,
# assurances...), jamais facturés à la semaine : on ne teste que mensuel/annuel.
_FREQUENCIES: dict[str, tuple[int, int]] = {
    "monthly": (30, 5),
    "yearly": (365, 20),
}

# ---------------------------------------------------------------------------
# Base de données des marchands (organisée par catégorie, utilisée à la fois
# pour l'identification stricte et pour l'auto-catégorisation).
# Certains marchands apparaissent dans plusieurs catégories (ex: "Orange" en
# Téléphonie Mobile ET en Box Internet, "Trade Republic" en Banques & Fintech
# ET en Investissement & Trading) : un même libellé bancaire ne permet pas de
# distinguer ces cas dans la réalité. Le matching prend le premier match
# trouvé selon l'ordre ci-dessous (les entrées plus longues/spécifiques sont
# toujours testées avant les plus courtes/génériques, cf. `_WHITELIST_INDEX`).
# ---------------------------------------------------------------------------

SUBSCRIPTION_WHITELIST: dict[str, tuple[str, ...]] = {
    "Streaming & VOD": (
        "Netflix", "Disney+", "Prime Video", "Apple TV+", "Max", "Canal+", "Canal+ Séries",
        "OCS", "Paramount+", "MUBI", "Crunchyroll", "ADN", "Shadowz", "Filmo", "UniversCiné",
        "Molotov", "Molotov Plus", "France.tv", "TF1+", "M6+", "Arte.tv", "Rakuten TV",
        "Plex Pass", "Hayu", "BritBox", "AMC+", "Curiosity Stream", "MagellanTV", "Nebula",
        "Shudder", "Lionsgate+", "Rakuten Wuaki", "YouTube Premium", "Vimeo OTT", "Gaia",
        "DogTV", "BroadwayHD", "WOW Presents Plus", "Hoichoi", "Acorn TV", "Pass Warner",
        "Pass Ciné+", "Pass Paramount", "Pass STARZ", "Pass MGM", "Pass AMC",
    ),
    "Musique & Audio": (
        "Spotify", "Apple Music", "Deezer", "Amazon Music", "YouTube Music", "Qobuz", "Tidal",
        "Napster", "SoundCloud Go", "SoundCloud Go+", "Idagio", "Audiomack+", "Bandcamp Fan",
        "Anghami", "Pandora", "iHeartRadio", "Calm Radio", "TuneIn Premium", "Mixcloud Pro",
    ),
    "Lecture & Presse": (
        "Audible", "Kindle Unlimited", "Kobo Plus", "BookBeat", "Nextory", "Youboox", "Scribd",
        "Everand", "Perlego", "Izneo", "Mangas.io", "Cafeyn", "Readly", "PressReader",
        "LeKiosk", "Mediapart", "Le Monde", "Le Figaro", "Capital", "Les Échos", "L'Équipe",
        "Courrier International", "Marianne", "Le Point", "Society", "The Economist",
        "Financial Times", "New York Times", "Washington Post", "The Guardian", "Libération",
        "Challenges", "Paris Match", "Ouest-France", "Sud Ouest", "Le Parisien", "La Croix",
        "Bloomberg", "Reuters",
    ),
    "Gaming": (
        "Sony", "PlayStation Plus Essential", "PlayStation Plus Extra",
        "PlayStation Plus Premium", "Xbox", "Game Pass Core", "Game Pass Standard",
        "Game Pass Ultimate", "PC Game Pass", "EA Play", "EA Play Pro", "Nintendo",
        "Nintendo Switch Online", "Nintendo Expansion Pack", "PC", "Ubisoft+", "Battle.net",
        "WoW Subscription", "Final Fantasy XIV", "RuneScape", "Old School RuneScape",
        "Black Desert", "GeForce NOW", "Boosteroid", "Shadow PC", "Amazon Luna", "Antstream",
        "Xbox Cloud Gaming",
    ),
    "IA & Outils Dev": (
        "ChatGPT Plus", "ChatGPT Pro", "Claude Pro", "Claude Max", "Gemini AI Pro",
        "Perplexity Pro", "Microsoft Copilot Pro", "Cursor Pro", "Windsurf Pro",
        "GitHub Copilot", "Codeium Pro", "Tabnine", "Lovable", "Bolt.new", "Replit Core", "v0",
        "Phind Pro", "Midjourney", "Leonardo AI", "Ideogram", "Flux", "DreamStudio", "Runway",
        "Pika", "Kling AI", "Luma AI", "Hailuo AI", "ElevenLabs", "PlayHT", "Murf AI",
        "Speechify", "HeyGen", "Synthesia", "Descript", "Gamma", "Beautiful.ai", "Canva Pro",
        "Notion AI", "Mem AI", "Granola", "Otter AI", "Fireflies AI", "Fathom AI", "DeepL Pro",
        "Tome",
    ),
    "Cloud & Hébergement": (
        "GitHub Pro", "GitHub Team", "GitLab Premium", "GitLab Ultimate", "Bitbucket",
        "Vercel Pro", "Netlify Pro", "Cloudflare Pro", "DigitalOcean", "Linode", "Hetzner",
        "AWS", "Azure", "Google Cloud", "Supabase", "Firebase Blaze", "PlanetScale", "Railway",
        "Render", "Fly.io", "MongoDB Atlas", "Neon", "Redis Cloud", "n8n Cloud", "Make",
        "Zapier", "Pipedream", "Postman", "Insomnia", "Docker Pro", "Koyeb", "Coolify Cloud",
        "Hostinger", "OVHcloud", "Infomaniak", "o2switch", "IONOS", "Namecheap", "Gandi",
        "Cloudflare Domains",
    ),
    "Logiciels Pro & Productivité": (
        "Notion", "ClickUp", "Monday", "Asana", "Slack", "Discord Nitro", "Zoom",
        "Google Workspace", "Microsoft 365", "Dropbox", "Google One", "iCloud+", "MEGA",
        "pCloud", "Sync.com", "Tresorit", "Box", "Evernote", "Obsidian Sync", "Craft",
        "Todoist", "TickTick", "Any.do", "Calendly", "Loom", "Miro", "Figma", "FigJam", "Canva",
        "Grammarly", "LanguageTool", "Proton Unlimited", "Fastmail",
    ),
    "Banques & Fintech": (
        "BoursoBank", "Fortuneo", "Hello Bank", "Monabanq", "Revolut", "N26", "Bunq", "Nickel",
        "Trade Republic", "Wise", "Lydia", "Sumeria", "Orange Bank", "Crédit Agricole", "BNP",
        "SG", "Caisse d'Épargne", "Banque Populaire", "Crédit Mutuel", "CIC", "HSBC",
        "American Express",
    ),
    "Téléphonie Mobile": (
        "Orange", "Sosh", "Free", "Bouygues", "B&You", "SFR", "RED", "Prixtel", "NRJ Mobile",
        "Syma", "Lebara", "Lyca Mobile", "Auchan Télécom", "Cdiscount Mobile",
        "La Poste Mobile", "YouPrice", "Mint Mobile",
    ),
    "Box Internet": (
        "Orange", "Freebox", "Bouygues", "SFR", "RED Box", "Starlink", "Nordnet", "K-Net",
        "Wifirst",
    ),
    "Énergie": (
        "EDF", "Engie", "TotalEnergies", "Ekwateur", "Enercoop", "Mint Énergie",
        "Ohm Énergie", "Octopus Energy", "Vattenfall", "Alpiq", "Elmy", "Barry Energy",
        "Gaz de Bordeaux",
    ),
    "Mobilité & Transports": (
        "Ulys", "Bip&Go", "Fulli", "Vinci Autoroutes", "Télépéage APRR", "Chargemap",
        "Freshmile", "Shell Recharge", "Tesla Premium Connectivity", "Mobilize Charge Pass",
        "Izivia", "Allego", "Ionity Passport", "Electra", "Fastned", "Navigo", "TER",
        "TGV Max", "SNCF Carte Avantage", "SNCF Liberté", "TBM", "TCL", "RTM", "CTS",
        "Tisséo", "STAR", "Vélib'", "Vélo'v", "Dott", "Lime Prime", "Tier", "Cityscoot",
        "Yego",
    ),
    "Sport & Fitness": (
        "Basic-Fit", "Fitness Park", "KeepCool", "L'Orange Bleue", "Neoness", "ON AIR",
        "CrossFit", "Club Med Gym", "Wellness Sport Club", "CMG Sports Club",
        "Urban Sports Club", "ClassPass",
    ),
    "Livraison & Courses": (
        "Uber One", "Deliveroo Plus", "Wolt+", "Amazon Prime", "Carrefour+", "Monopflix",
        "Casino Max", "Instacart+", "HelloFresh", "Quitoque", "Jow", "Too Good To Go+",
    ),
    "Rencontres": (
        "Tinder", "Bumble", "Happn", "Meetic", "Fruitz", "Adopte", "Elite Rencontre",
        "DisonsDemain", "OkCupid", "Hinge", "Feeld", "Badoo",
    ),
    "Éducation & VPN/Sécurité": (
        "OpenClassrooms", "Coursera", "Udemy", "Udemy Personal Plan", "Codecademy",
        "DataCamp", "Brilliant", "Skillshare", "Domestika", "LinkedIn Learning",
        "Pluralsight", "Educative", "Frontend Masters", "Laracasts", "Scrimba", "MasterClass",
        "Babbel", "Duolingo Super", "Busuu", "Mosalingua", "Gymglish", "NordVPN", "Surfshark",
        "ExpressVPN", "CyberGhost", "Proton VPN", "Mullvad", "Private Internet Access",
        "Bitdefender", "Norton", "Avast", "AVG", "Kaspersky", "ESET", "Malwarebytes",
        "1Password", "Dashlane", "Keeper", "NordPass", "Bitwarden Premium",
    ),
    "Assurances, Mutuelles & Animaux": (
        "AXA", "MAIF", "MACIF", "GMF", "MMA", "Groupama", "Matmut", "Allianz", "SwissLife",
        "Direct Assurance", "L'Olivier", "Lovys", "Acheel", "Alan", "AÉSIO", "Malakoff Humanis",
        "Harmonie Mutuelle", "MGEN", "April", "Apivia", "SantéVet", "Dalma", "Assur O'Poil",
        "Bulle Bleue", "Kozoo", "Trupanion", "Fidanimo", "Otherwise",
    ),
    "Maison & Sécurité": (
        "Veolia", "Suez", "SAUR", "HomeServe", "Verisure", "Sector Alarm",
        "Orange Maison Protégée", "IKEA Family+", "Engie Home Services",
    ),
    "Investissement & Trading": (
        "Scalable Capital", "eToro", "Degiro", "Interactive Brokers", "XTB", "Saxo Bank",
        "Binance", "Coinbase One", "Kraken Pro", "Ledger Recover",
    ),
}


# ---------------------------------------------------------------------------
# Matching liste blanche : deux formes de normalisation combinées.
#
# 1. Forme "espacée" (ponctuation -> espace) + limites de mots (\b) : utilisée
#    pour les entrées courtes/génériques ("PC", "AWS", "SG", "Box", "Wise"...)
#    afin qu'elles ne matchent que comme mot isolé, jamais comme fragment
#    ("AWS" ne doit pas matcher "AWSOME", "Wise" ne doit pas matcher
#    "OTHERWISE", "Box" ne doit pas matcher "XBOX").
# 2. Forme "fusionnée" (ponctuation ET espaces retirés sans substitution) :
#    utilisée en complément pour les entrées assez longues (>= 5 caractères
#    fusionnés) afin d'absorber les libellés bancaires qui accolent le
#    marchand à un suffixe sans séparateur clair (ex: "LEQUIPE.FR" doit
#    matcher "L'Équipe", "CANAL+ SERIES FR" doit matcher "Canal+ Séries")
#    quelle que soit la ponctuation d'origine de part et d'autre.
#
# Un marchand est reconnu si SOIT le test par mot isolé réussit, SOIT
# (pour les entrées assez longues) le test fusionné réussit.
# ---------------------------------------------------------------------------

_FUSED_MATCH_MIN_LENGTH = 5


def _normalize_spaced(text: str) -> str:
    """MAJUSCULES, sans accents, ponctuation réduite à des espaces simples.
    Ex: "Canal+ Séries" -> "CANAL SERIES", "L'Équipe" -> "L EQUIPE"."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.upper()
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _normalize_fused(text: str) -> str:
    """Comme `_normalize_spaced`, mais sans aucun espace résiduel.
    Ex: "L'Équipe" -> "LEQUIPE", "Canal+ Séries" -> "CANALSERIES"."""
    return _normalize_spaced(text).replace(" ", "")


def _build_whitelist_index() -> list[tuple[re.Pattern[str] | None, str, str, str]]:
    """Précompile (regex mot-isolé, forme fusionnée, nom canonique, catégorie)
    pour chaque marchand, triés par longueur fusionnée décroissante : les noms
    spécifiques ("PC Game Pass") sont ainsi toujours testés avant les
    génériques courts qu'ils contiennent ("PC")."""
    entries: list[tuple[re.Pattern[str] | None, str, str, str]] = []
    for category, merchants in SUBSCRIPTION_WHITELIST.items():
        for merchant in merchants:
            spaced = _normalize_spaced(merchant)
            fused = spaced.replace(" ", "")
            if not fused:
                continue
            pattern = re.compile(r"\b" + re.escape(spaced) + r"\b") if spaced else None
            entries.append((pattern, fused, merchant, category))
    entries.sort(key=lambda entry: len(entry[1]), reverse=True)
    return entries


_WHITELIST_INDEX = _build_whitelist_index()


def match_whitelist(cleaned_label: str) -> tuple[str, str] | None:
    """Renvoie (nom_marchand_canonique, catégorie) si le libellé nettoyé
    correspond à un marchand de la liste blanche, sinon None."""
    spaced_label = _normalize_spaced(cleaned_label)
    if not spaced_label:
        return None
    fused_label = spaced_label.replace(" ", "")

    for pattern, fused_merchant, merchant, category in _WHITELIST_INDEX:
        if pattern is not None and pattern.search(spaced_label):
            return merchant, category
        if len(fused_merchant) >= _FUSED_MATCH_MIN_LENGTH and fused_merchant in fused_label:
            return merchant, category
    return None


# ---------------------------------------------------------------------------
# Détection de récurrence + filtre d'activité
# ---------------------------------------------------------------------------

@dataclass
class CategorizedSubscription:
    merchant: str
    price: float
    frequency: str  # "monthly" | "yearly"
    occurrences: int
    last_date: str
    next_estimated_date: str
    confidence: float  # 0..1
    source_transaction_ids: list[str]
    category: str


def _parse_date(value: str) -> date:
    return date.fromisoformat(value[:10])


def _shift_months(d: date, months: int) -> date:
    """Décale une date d'un nombre de mois (négatif = passé), en bornant le
    jour au dernier jour du mois cible si besoin."""
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                      31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


def _is_current_or_previous_month(d: date, today: date) -> bool:
    if (d.year, d.month) == (today.year, today.month):
        return True
    previous = _shift_months(today, -1)
    return (d.year, d.month) == (previous.year, previous.month)


def _match_frequency(intervals: list[int]) -> tuple[str, float] | None:
    """Teste si une série d'intervalles (jours) colle à un rythme mensuel ou
    annuel. Renvoie (fréquence, confiance) ou None si aucun rythme cohérent."""
    best: tuple[str, float] | None = None
    for freq_name, (nominal, tolerance) in _FREQUENCIES.items():
        deviations = [abs(i - nominal) for i in intervals]
        if all(d <= tolerance for d in deviations):
            avg_deviation = sum(deviations) / len(deviations)
            confidence = max(0.0, 1 - (avg_deviation / tolerance))
            if best is None or confidence > best[1]:
                best = (freq_name, confidence)
    return best


def _group_by_merchant_key(
    whitelisted: list[tuple[RawTransaction, str, str]],
) -> dict[str, list[tuple[RawTransaction, str]]]:
    """Regroupe (reduce) les transactions whitelistées par Clé Marchand
    canonique -- jamais par libellé brut ni par montant. C'est ce qui garantit
    qu'"EDF" et "EDF CLIENTS PARTICULIERS", ou deux prélèvements Prixtel à des
    prix différents (changement de forfait), tombent dans le MÊME groupe au
    lieu de générer un doublon."""

    def _accumulate(
        acc: dict[str, list[tuple[RawTransaction, str]]],
        item: tuple[RawTransaction, str, str],
    ) -> dict[str, list[tuple[RawTransaction, str]]]:
        tx, merchant_key, category = item
        acc.setdefault(merchant_key, []).append((tx, category))
        return acc

    return reduce(_accumulate, whitelisted, {})


def analyze_transactions(transactions: list[RawTransaction]) -> list[CategorizedSubscription]:
    """Point d'entrée principal.

    1. Ne garde que les débits des `ANALYSIS_WINDOW_MONTHS` derniers mois.
    2. Ne garde que ceux dont le libellé matche la liste blanche stricte
       (matching insensible à la casse/accents/ponctuation), et les
       normalise sous leur Clé Marchand canonique (ex: "DEEZERFR DEEZER"
       et "deezer premium fr" deviennent tous les deux "Deezer").
    3. Regroupe (reduce) PAR CLÉ MARCHAND SEULE -- jamais par montant --
       pour absorber les variations de libellé ET les changements de forfait
       (prix différent) sous un même abonnement. Détecte une périodicité
       mensuelle/annuelle sur l'historique complet du marchand (les dates
       de toutes les occurrences, indépendamment de leur montant).
    4. Dans chaque groupe, ne conserve que LA TRANSACTION LA PLUS RÉCENTE :
       c'est elle seule qui définit le prix actuel et la date de
       prélèvement renvoyés (les anciennes transactions du groupe ne
       servent qu'à confirmer la récurrence, jamais à l'état final).
    5. Ne renvoie que les abonnements toujours actifs : dernière occurrence
       dans le mois en cours ou précédent, OU périodicité détectée dont la
       prochaine échéance n'est pas dépassée.

    Note : une périodicité annuelle ne peut mathématiquement pas être
    confirmée par 2 occurrences dans une fenêtre de 6 mois (l'intervalle
    dépasse la fenêtre elle-même). Un abonnement annuel n'est donc remonté
    que si sa dernière occurrence tombe dans le mois en cours ou précédent ;
    au-delà, faute de second point de mesure, on ne peut pas garantir qu'il
    est toujours actif et il est légitimement ignoré par le filtre.
    """
    today = date.today()
    window_start = _shift_months(today, -ANALYSIS_WINDOW_MONTHS)

    debits = [tx for tx in transactions if tx.value < 0 and _parse_date(tx.date) >= window_start]

    # Étape liste blanche : (transaction, Clé Marchand canonique, catégorie).
    # `match_whitelist` normalise déjà en MAJUSCULES avant comparaison (via
    # `_normalize_spaced`/`_normalize_fused`) : le matching est donc
    # strictement insensible à la casse ("Prixtel" == "prixtel" == "PRIXTEL").
    whitelisted: list[tuple[RawTransaction, str, str]] = []
    for tx in debits:
        label = clean_label(tx.wording)
        if not label:
            continue
        match = match_whitelist(label)
        if match is None:
            continue
        merchant_key, category = match
        whitelisted.append((tx, merchant_key, category))

    groups = _group_by_merchant_key(whitelisted)

    results: list[CategorizedSubscription] = []

    for merchant_key, entries in groups.items():
        entries_by_date = sorted(entries, key=lambda entry: entry[0].date)
        all_txs = [tx for tx, _ in entries_by_date]
        latest_tx, category = entries_by_date[-1]

        dates = [_parse_date(t.date) for t in all_txs]
        last_date = dates[-1]
        recent = _is_current_or_previous_month(last_date, today)

        frequency: str | None = None
        confidence = 0.5  # valeur par défaut si la périodicité n'est pas mesurable
        if len(all_txs) >= 2:
            intervals = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
            match = _match_frequency(intervals)
            if match is not None:
                frequency, confidence = match

        if frequency is None:
            # Une seule occurrence (ou intervalles incohérents) : on ne peut
            # pas mesurer de périodicité. Le mensuel est l'hypothèse par
            # défaut (l'immense majorité des services de la liste blanche),
            # mais seule une occurrence récente justifie de garder ce
            # candidat (cf. règle du filtre d'activité).
            if not recent:
                continue
            frequency = "monthly"

        nominal_days = _FREQUENCIES[frequency][0]
        next_estimated = last_date + timedelta(days=nominal_days)
        still_due = next_estimated >= today

        if not (recent or still_due):
            continue  # ni occurrence récente, ni échéance à venir -> plus actif

        results.append(
            CategorizedSubscription(
                merchant=merchant_key,
                # Prix et date : uniquement ceux de la transaction la plus
                # récente (règle d'écrasement), jamais une moyenne sur
                # l'historique -- un changement de forfait doit se refléter
                # immédiatement, pas être lissé.
                price=round(abs(latest_tx.value), 2),
                frequency=frequency,
                occurrences=len(all_txs),
                last_date=last_date.isoformat(),
                next_estimated_date=next_estimated.isoformat(),
                confidence=round(confidence, 2),
                source_transaction_ids=[latest_tx.id],
                category=category,
            )
        )

    results.sort(key=lambda r: (r.confidence, r.occurrences), reverse=True)
    return results


if __name__ == "__main__":
    today = date.today()

    def _iso(days_ago: int) -> str:
        return (today - timedelta(days=days_ago)).isoformat()

    sample = [
        # Netflix : 3 occurrences mensuelles récentes -> actif, 1 seul résultat.
        RawTransaction(id="1", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(65)),
        RawTransaction(id="2", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(35)),
        RawTransaction(id="3", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(5)),
        # Spotify : une seule occurrence ce mois-ci -> actif malgré l'absence d'historique.
        RawTransaction(id="4", wording="PRLV SEPA SPOTIFY 99001122", value=-9.99, date=_iso(3)),
        # Disney+ : dernière occurrence il y a 4 mois, aucune récurrence prouvée -> ignoré (résilié probable).
        RawTransaction(id="5", wording="PRLV SEPA DISNEY PLUS", value=-8.99, date=_iso(120)),
        # EDF : changement de forfait (45€ -> 52€) + libellé qui varie -> UN SEUL
        # résultat à 52€ (le plus récent), pas deux entrées en double.
        RawTransaction(id="6", wording="PRLV SEPA EDF CLIENTS PARTICULIERS", value=-45.00, date=_iso(35)),
        RawTransaction(id="7", wording="PRLV SEPA EDF", value=-52.00, date=_iso(5)),
        # Prixtel : même marchand, casse différente ("prixtel" vs "PRIXTEL") -> regroupés.
        RawTransaction(id="8", wording="prlv sepa prixtel mobile", value=-8.00, date=_iso(33)),
        RawTransaction(id="9", wording="PRLV SEPA PRIXTEL MOBILE", value=-10.00, date=_iso(3)),
        # Marchand hors liste blanche -> toujours ignoré, même récurrent.
        RawTransaction(id="10", wording="CB ACHAT BOULANGERIE MARTIN", value=-4.50, date=_iso(30)),
        RawTransaction(id="11", wording="CB ACHAT BOULANGERIE MARTIN", value=-4.50, date=_iso(60)),
        # Faux positifs stricts : jamais dans la liste blanche -> ignorés.
        RawTransaction(id="12", wording="CB LIDL PARIS 18", value=-32.10, date=_iso(4)),
        RawTransaction(id="13", wording="VIR SEPA SOGENAL", value=-120.00, date=_iso(4)),
        RawTransaction(id="14", wording="PRLV METROPOLE DU GRAND NANCY", value=-15.00, date=_iso(4)),
        RawTransaction(id="15", wording="CB SNCF-VOYAGEURS INTERNET", value=-42.00, date=_iso(4)),
        # Transaction hors fenêtre de 6 mois -> ignorée.
        RawTransaction(id="16", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(210)),
    ]

    for result in analyze_transactions(sample):
        print(result)
