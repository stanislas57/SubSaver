"""Moteur d'analyse des transactions bancaires -- pipeline à trois étages :
Liste Blanche + Empreintes Bancaires (confiance 100%) / Liste Noire
d'exclusion / Heuristique de récurrence stricte pour marchands inconnus
(confiance 80%, à valider par l'utilisateur).

Ordre d'évaluation pour chaque transaction (débits des 6 derniers mois) :

1. Liste blanche + empreintes bancaires (`SUBSCRIPTION_WHITELIST` +
   `BANK_LABEL_ALIASES` + `BANK_FEE_ALIASES`) : si le libellé nettoyé
   correspond à un marchand connu -- soit sous son nom humain ("Netflix"),
   soit sous son empreinte bancaire réelle ("APPLE.COM/BILL", "COMUTITRES",
   "MTCH*TINDER"), soit sous un libellé de frais bancaire ("COTISATION
   CARTE", "FRAIS TENUE DE COMPTE") -- la transaction est un abonnement
   certain (confiance 1.0). Le match est normalisé sous sa Clé Marchand
   canonique (ex: "APPLE.COM/BILL 0,99" et "ITUNES.COM" deviennent tous les
   deux "Apple (App Store / iCloud)"), c'est cette clé qui sert de critère de
   regroupement.
   TESTÉE EN PREMIER : c'est ce qui permet à "Auchan Télécom" (whitelist) de
   survivre au blocage de "AUCHAN" (blacklist grande distribution), ou à
   "Crédit Agricole" (banque) de survivre aux mots-clés de crédit conso.
   Les frais bancaires (`BANK_FEE_ALIASES`) suivent la même logique : ce sont
   des prélèvements récurrents légitimes (contrairement à un loyer ou un
   remboursement de prêt), donc catégorisés et remontés comme n'importe quel
   abonnement plutôt que jetés par la liste noire.
2. Liste noire (`EXCLUSION_BLACKLIST`) : dépenses récurrentes qui ne sont PAS
   des abonnements au sens de l'app -- grande distribution, loyers,
   remboursements de prêts, impôts, virements d'épargne, retraits, énergie
   (EDF, Engie...), assurances/mutuelles (AXA, MAIF...) et eau (Veolia,
   Suez...) : des charges courantes récurrentes, pas des abonnements que
   l'utilisateur choisit et peut résilier en un clic. Bloquées ici, AVANT
   toute analyse de récurrence : un prélèvement "LOYER" tous les 30 jours ne
   doit jamais remonter, même avec un rythme parfait.
3. Heuristique marchand inconnu : ni whitelisté ni blacklisté. Retenu
   seulement si le motif est celui d'un abonnement quasi certain --
   au moins 3 occurrences, TOUS les intervalles à ~30/31 jours (tolérance
   serrée), montant fixe et < 50 € -- avec confiance 0.8 : le candidat est
   présenté à l'utilisateur pour validation, jamais intégré d'office.
   Aucun montant minimum nulle part : un prélèvement récurrent de 0,99 €
   (iCloud) est un signal fort, pas du bruit.

Regroupement et état final :
- Marchands whitelistés : groupés PAR CLÉ MARCHAND seule (un changement de
  forfait ne crée jamais de doublon), seule LA PLUS RÉCENTE transaction
  définit le prix/la date renvoyés.
- Cas particulier facturation centralisée (`STORE_BILLING_MERCHANTS`) :
  "APPLE.COM/BILL" ou "GOOGLE PLAY" agrègent PLUSIEURS services (iCloud,
  Snap+, un achat one-shot...) sous le même libellé. Ces marchands-là sont
  sous-groupés par montant, et chaque sous-groupe doit prouver une VRAIE
  récurrence mesurée (jamais l'hypothèse "1 occurrence récente = mensuel",
  qui transformerait tout achat d'app en abonnement). Chaque récurrence
  confirmée sort comme un candidat distinct ("Apple (App Store / iCloud)" à
  0,99 € + un autre à 4,49 €...) que l'utilisateur renomme ensuite dans la
  modale de validation (champ Nom éditable) en "iCloud", "Snap+", etc.

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
        "Adobe Creative Cloud", "Adobe Photoshop", "Adobe Lightroom",
    ),
    # Un seul nom canonique par service : les variantes de libellé
    # ("SNAPCHAT", "TWITTER BLUE"...) passent par BANK_LABEL_ALIASES, jamais
    # par une seconde entrée whitelist -- deux noms canoniques pour le même
    # service casseraient le regroupement par Clé Marchand.
    "Réseaux & Médias sociaux": (
        "Snap+", "X Premium", "LinkedIn Premium",
        "Telegram Premium", "Reddit Premium", "Meta Verified", "Twitch Turbo",
        "OnlyFans", "Patreon",
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
    # NB : les programmes de fidélité de la grande distribution (Carrefour+,
    # Casino Max, Monopflix...) sont volontairement ABSENTS : la grande
    # distribution est entièrement exclue par la liste noire (cf.
    # EXCLUSION_BLACKLIST), ces récurrences ne sont pas des abonnements au
    # sens de l'app.
    "Livraison & Courses": (
        "Uber One", "Deliveroo Plus", "Wolt+", "Amazon Prime", "Instacart+", "HelloFresh",
        "Quitoque", "Jow", "Too Good To Go+",
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
    "Maison & Sécurité": (
        "HomeServe", "Verisure", "Sector Alarm",
        "Orange Maison Protégée", "IKEA Family+", "Engie Home Services",
    ),
    "Investissement & Trading": (
        "Scalable Capital", "eToro", "Degiro", "Interactive Brokers", "XTB", "Saxo Bank",
        "Binance", "Coinbase One", "Kraken Pro", "Ledger Recover",
    ),
}


# ---------------------------------------------------------------------------
# Empreintes bancaires : les banques n'écrivent JAMAIS "iCloud" ou "Snap+"
# sur un relevé -- elles écrivent "APPLE.COM/BILL", "ITUNES.COM",
# "MTCH*TINDER" ou "COMUTITRES". Cette table mappe ces libellés réels vers la
# Clé Marchand canonique + sa catégorie. Chaque empreinte passe par le même
# moteur de normalisation que la whitelist (insensible casse/accents/
# ponctuation, limites de mots pour les entrées courtes), donc
# "CB APPLE.COM/BILL 0,99EUR" comme "APL*ITUNES.COM" matchent.
#
# Cas des stores (Apple/Google) : la facturation est centralisée -- un
# abonnement Snap+ souscrit sur iPhone apparaît sous "APPLE.COM/BILL", pas
# sous "SNAP". Impossible de distinguer le service depuis le relevé : on
# regroupe sous un marchand-parapluie ("Apple (App Store / iCloud)") que
# l'utilisateur renomme ensuite dans la modale de validation. Ces marchands
# sont listés dans STORE_BILLING_MERCHANTS et reçoivent un traitement
# spécial (sous-groupage par montant + récurrence mesurée obligatoire, cf.
# docstring du module).
# ---------------------------------------------------------------------------

BANK_LABEL_ALIASES: dict[str, tuple[str, str]] = {
    # --- Cloud & Logiciels ---
    "APPLE.COM/BILL": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    "APPLE.COM BILL": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    "ITUNES.COM": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    "ITUNES": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    "APL*ITUNES": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    "APPLE SERVICES": ("Apple (App Store / iCloud)", "Logiciels Pro & Productivité"),
    # Google : les libellés spécifiques (YouTube, One) sont plus longs, donc
    # testés AVANT le parapluie générique "GOOGLE PLAY" (tri par longueur).
    "GOOGLE YOUTUBE": ("YouTube Premium", "Streaming & VOD"),
    "GOOGLE YOUTUBEPREMIUM": ("YouTube Premium", "Streaming & VOD"),
    "GOOGLE STORAGE": ("Google One", "Logiciels Pro & Productivité"),
    "GOOGLE GOOGLE ONE": ("Google One", "Logiciels Pro & Productivité"),
    "GOOGLE PLAY": ("Google Play (abonnement)", "Logiciels Pro & Productivité"),
    "GOOGLE PAYMENT": ("Google Play (abonnement)", "Logiciels Pro & Productivité"),
    "MSFT": ("Microsoft 365", "Logiciels Pro & Productivité"),
    "MSBILL.INFO": ("Microsoft 365", "Logiciels Pro & Productivité"),
    "MICROSOFT*365": ("Microsoft 365", "Logiciels Pro & Productivité"),
    "ADOBE": ("Adobe Creative Cloud", "Logiciels Pro & Productivité"),
    "OPENAI": ("ChatGPT (OpenAI)", "IA & Outils Dev"),
    "CHATGPT": ("ChatGPT (OpenAI)", "IA & Outils Dev"),
    "ANTHROPIC": ("Claude Pro", "IA & Outils Dev"),
    # --- Réseaux & Médias ---
    "SNAP INC": ("Snap+", "Réseaux & Médias sociaux"),
    "SNAPCHAT": ("Snap+", "Réseaux & Médias sociaux"),
    "TWITTER": ("X Premium", "Réseaux & Médias sociaux"),
    "TWITTER BLUE": ("X Premium", "Réseaux & Médias sociaux"),
    "X CORP": ("X Premium", "Réseaux & Médias sociaux"),
    "LINKEDIN": ("LinkedIn Premium", "Réseaux & Médias sociaux"),
    "LNKD.IN": ("LinkedIn Premium", "Réseaux & Médias sociaux"),
    # Match Group : facturation Tinder par carte ("MTCH*TINDER" ou "MTCH" seul).
    "MTCH": ("Tinder", "Rencontres"),
    "DISCORD": ("Discord Nitro", "Logiciels Pro & Productivité"),
    # --- Streaming (formes bancaires spécifiques ; les noms humains sont
    # déjà dans la whitelist et matchent la plupart des libellés) ---
    "AMZNPRIME": ("Amazon Prime", "Livraison & Courses"),
    "AMZN PRIME": ("Amazon Prime", "Livraison & Courses"),
    "PRIMEVIDEO": ("Prime Video", "Streaming & VOD"),
    "DISNEYPLUS": ("Disney+", "Streaming & VOD"),
    "HELP.MAX.COM": ("Max", "Streaming & VOD"),
    # --- Transports & Mobilité ---
    # Le prélèvement Navigo n'affiche JAMAIS "Navigo" : l'organisme de
    # facturation d'Île-de-France Mobilités s'appelle Comutitres.
    "COMUTITRES": ("Navigo", "Mobilité & Transports"),
    "IDF MOBILITES": ("Navigo", "Mobilité & Transports"),
    "ILE DE FRANCE MOBILITES": ("Navigo", "Mobilité & Transports"),
    "UBER *ONE": ("Uber One", "Livraison & Courses"),
    "TGVMAX": ("TGV Max", "Mobilité & Transports"),
    "SNCF CARTE AVANTAGE": ("SNCF Carte Avantage", "Mobilité & Transports"),
    # --- Utilitaires & Télécoms (formes bancaires longues) ---
    "FREE MOBILE": ("Free", "Téléphonie Mobile"),
    "FREE HAUTDEBIT": ("Freebox", "Box Internet"),
    "FREE TELECOM": ("Free", "Téléphonie Mobile"),
    "BOUYGUES TELECOM": ("Bouygues", "Téléphonie Mobile"),
    "ORANGE SA": ("Orange", "Téléphonie Mobile"),
}

# ---------------------------------------------------------------------------
# Règle métier n°1 : frais bancaires. Une banque ne "vend" pas un service au
# sens des catégories ci-dessus -- elle prélève des frais récurrents sur son
# propre compte (cotisation carte, tenue de compte, assurance moyens de
# paiement...). Même moteur de matching que BANK_LABEL_ALIASES (libellé
# bancaire brut -> nom canonique lisible + catégorie), mais isolé dans son
# propre dict pour ne pas mélanger deux concepts différents : une empreinte
# BANK_LABEL_ALIASES route un service tiers facturé via un intermédiaire
# (Apple, Google...), alors qu'un frais bancaire est facturé PAR la banque
# elle-même, quel que soit l'établissement. Catégorie "Banque" pour
# rester aligné avec la catégorie déjà utilisée côté frontend (CATEGORIES).
# ---------------------------------------------------------------------------

BANK_FEE_ALIASES: dict[str, tuple[str, str]] = {
    "COTISATION CARTE": ("Cotisation carte bancaire", "Banque"),
    "COTISATION CARTE BANCAIRE": ("Cotisation carte bancaire", "Banque"),
    "COTIS CARTE": ("Cotisation carte bancaire", "Banque"),
    "COTISATION CB": ("Cotisation carte bancaire", "Banque"),
    "FRAIS DE TENUE DE COMPTE": ("Frais de tenue de compte", "Banque"),
    "FRAIS TENUE DE COMPTE": ("Frais de tenue de compte", "Banque"),
    "FRAIS TENUE COMPTE": ("Frais de tenue de compte", "Banque"),
    "TENUE DE COMPTE": ("Frais de tenue de compte", "Banque"),
    "FRAIS DE GESTION DE COMPTE": ("Frais de gestion de compte", "Banque"),
    "FRAIS DE GESTION": ("Frais de gestion de compte", "Banque"),
    "COTISATION ASSURANCE MOYENS DE PAIEMENT": ("Assurance moyens de paiement", "Banque"),
    "ASSURANCE MOYENS DE PAIEMENT": ("Assurance moyens de paiement", "Banque"),
    "COTISATION PACK": ("Cotisation forfait bancaire", "Banque"),
    "COTISATION FORMULE": ("Cotisation forfait bancaire", "Banque"),
}

# Marchands-parapluie de facturation centralisée : un même libellé bancaire y
# agrège plusieurs services (abonnements ET achats one-shot). Traitement
# spécial dans analyze_transactions : sous-groupage par montant + récurrence
# mesurée obligatoire (cf. docstring du module).
STORE_BILLING_MERCHANTS: frozenset[str] = frozenset(
    {"Apple (App Store / iCloud)", "Google Play (abonnement)"}
)

# ---------------------------------------------------------------------------
# Liste noire d'exclusion : dépenses récurrentes qui ne sont PAS des
# abonnements au sens de l'app. Évaluée APRÈS la whitelist (ce qui protège
# "Auchan Télécom" ou "Crédit Agricole") mais AVANT l'heuristique de
# récurrence : un loyer parfaitement mensuel ne doit jamais remonter.
# Même moteur de matching que la whitelist (mot isolé pour les entrées
# courtes, sous-chaîne fusionnée pour les longues).
# ---------------------------------------------------------------------------

EXCLUSION_BLACKLIST: dict[str, tuple[str, ...]] = {
    "Grande distribution": (
        "CARREFOUR", "AUCHAN", "LECLERC", "E.LECLERC", "LIDL", "ALDI", "INTERMARCHE",
        "SUPER U", "HYPER U", "SYSTEME U", "MONOPRIX", "FRANPRIX", "CASINO", "GEANT CASINO",
        "CORA", "NETTO", "PICARD", "GRAND FRAIS", "BIOCOOP", "NATURALIA", "LEADER PRICE",
        "SPAR", "VIVAL", "PROXI", "MATCH SUPERMARCHE",
    ),
    "Loyers & immobilier": (
        "LOYER", "FONCIA", "NEXITY", "CITYA", "ORPI", "LAFORET", "GUY HOQUET",
        "SQUARE HABITAT", "CDC HABITAT", "ICF HABITAT", "PARIS HABITAT", "SEQENS", "RIVP",
        "CROUS", "ACTION LOGEMENT",
    ),
    "Prêts & crédits": (
        "PRET", "REMBOURSEMENT PRET", "REMB PRET", "ECHEANCE", "MENSUALITE",
        "CREDIT IMMOBILIER", "CREDIT CONSO", "CREDIT RENOUVELABLE", "RACHAT DE CREDIT",
        "COFIDIS", "CETELEM", "SOFINCO", "FRANFINANCE", "YOUNITED", "FLOA", "ONEY",
    ),
    "Impôts & administrations": (
        "DGFIP", "DGFIP FINANCES PUBLIQUES", "DIRECTION GENERALE DES FINANCES",
        "TRESOR PUBLIC", "IMPOT", "IMPOTS", "TAXE FONCIERE", "TAXE HABITATION",
        "PRELEVEMENT A LA SOURCE", "URSSAF", "ANTAI", "AMENDE", "AMENDES", "TIMBRE FISCAL",
    ),
    "Épargne & virements internes": (
        "LIVRET A", "LIVRET", "PEL", "CEL", "PEA", "ASSURANCE VIE", "VERSEMENT PROGRAMME",
        "VIREMENT EPARGNE", "EPARGNE", "VIREMENT PERMANENT", "VIR PERMANENT",
        "VIREMENT INTERNE",
    ),
    "Espèces": (
        "RETRAIT", "RETRAIT DAB", "DAB",
    ),
    "Énergie": (
        "EDF", "ENGIE", "TOTALENERGIES", "EKWATEUR", "ENERCOOP", "MINT ENERGIE",
        "OHM ENERGIE", "OCTOPUS ENERGY", "VATTENFALL", "ALPIQ", "ELMY", "BARRY ENERGY",
        "GAZ DE BORDEAUX",
    ),
    "Eau": (
        "VEOLIA", "SUEZ", "SAUR",
    ),
    "Assurances & Mutuelles": (
        "AXA", "MAIF", "MACIF", "GMF", "MMA", "GROUPAMA", "MATMUT", "ALLIANZ", "SWISSLIFE",
        "DIRECT ASSURANCE", "L'OLIVIER", "LOVYS", "ACHEEL", "ALAN", "AESIO", "MALAKOFF HUMANIS",
        "HARMONIE MUTUELLE", "MGEN", "APRIL", "APIVIA", "SANTEVET", "DALMA", "ASSUR O'POIL",
        "BULLE BLEUE", "KOZOO", "TRUPANION", "FIDANIMO", "OTHERWISE",
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
    pour chaque marchand -- entrées "humaines" de la whitelist ET empreintes
    bancaires (BANK_LABEL_ALIASES, qui pointent vers leur nom canonique) --
    triés par longueur fusionnée décroissante : les motifs spécifiques
    ("GOOGLE YOUTUBE", "PC Game Pass") sont ainsi toujours testés avant les
    génériques courts qu'ils contiennent ("GOOGLE PLAY", "PC")."""
    entries: list[tuple[re.Pattern[str] | None, str, str, str]] = []

    def _add(searched_text: str, canonical: str, category: str) -> None:
        spaced = _normalize_spaced(searched_text)
        fused = spaced.replace(" ", "")
        if not fused:
            return
        pattern = re.compile(r"\b" + re.escape(spaced) + r"\b") if spaced else None
        entries.append((pattern, fused, canonical, category))

    for category, merchants in SUBSCRIPTION_WHITELIST.items():
        for merchant in merchants:
            _add(merchant, merchant, category)
    for bank_label, (canonical, category) in BANK_LABEL_ALIASES.items():
        _add(bank_label, canonical, category)
    for bank_label, (canonical, category) in BANK_FEE_ALIASES.items():
        _add(bank_label, canonical, category)

    entries.sort(key=lambda entry: len(entry[1]), reverse=True)
    return entries


_WHITELIST_INDEX = _build_whitelist_index()


def _build_blacklist_index() -> list[tuple[re.Pattern[str] | None, str]]:
    """Même machinerie que la whitelist (mot isolé + forme fusionnée) pour les
    mots-clés d'exclusion."""
    entries: list[tuple[re.Pattern[str] | None, str]] = []
    for keywords in EXCLUSION_BLACKLIST.values():
        for keyword in keywords:
            spaced = _normalize_spaced(keyword)
            fused = spaced.replace(" ", "")
            if not fused:
                continue
            pattern = re.compile(r"\b" + re.escape(spaced) + r"\b") if spaced else None
            entries.append((pattern, fused))
    entries.sort(key=lambda entry: len(entry[1]), reverse=True)
    return entries


_BLACKLIST_INDEX = _build_blacklist_index()


def is_excluded(cleaned_label: str) -> bool:
    """True si le libellé nettoyé correspond à une dépense récurrente hors
    périmètre (grande distribution, loyer, prêt, impôts, épargne, retrait) --
    à n'appeler qu'APRÈS un échec de `match_whitelist`, cf. docstring."""
    spaced_label = _normalize_spaced(cleaned_label)
    if not spaced_label:
        return False
    fused_label = spaced_label.replace(" ", "")

    for pattern, fused_keyword in _BLACKLIST_INDEX:
        if pattern is not None and pattern.search(spaced_label):
            return True
        if len(fused_keyword) >= _FUSED_MATCH_MIN_LENGTH and fused_keyword in fused_label:
            return True
    return False


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


def display_merchant_name(raw_name: str) -> str:
    """Nom de marchand normalisé pour affichage (ex: dans un menu ou une
    liste de sélection) -- passe par le moteur Clé Marchand ci-dessus, avec
    repli sur le nom brut si aucun match (abonnement ajouté manuellement,
    hors liste blanche). Réutilisé par la Lettre de résiliation et
    l'Abonnement partagé pour ne jamais afficher un libellé bancaire brut."""
    match = match_whitelist(clean_label(raw_name))
    return match[0] if match else raw_name


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
    que "FREE MOBILE" et "Free", ou deux prélèvements Prixtel à des prix
    différents (changement de forfait), tombent dans le MÊME groupe au lieu
    de générer un doublon."""

    def _accumulate(
        acc: dict[str, list[tuple[RawTransaction, str]]],
        item: tuple[RawTransaction, str, str],
    ) -> dict[str, list[tuple[RawTransaction, str]]]:
        tx, merchant_key, category = item
        acc.setdefault(merchant_key, []).append((tx, category))
        return acc

    return reduce(_accumulate, whitelisted, {})


# ---------------------------------------------------------------------------
# Heuristique "marchand inconnu" : seuils du système de score.
# Whitelist/empreinte bancaire = confiance 1.0 (abonnement certain).
# Marchand inconnu, non blacklisté, avec récurrence quasi parfaite (~30/31
# jours), montant fixe et < 50 € = confiance 0.8 (à valider par l'utilisateur
# dans la modale de détection -- jamais intégré d'office).
# ---------------------------------------------------------------------------

WHITELIST_CONFIDENCE = 1.0
HEURISTIC_CONFIDENCE = 0.8
_HEURISTIC_MIN_OCCURRENCES = 3        # 2 intervalles mesurés minimum
_HEURISTIC_MONTHLY_NOMINAL = 30       # cible "exactement 30/31 jours"...
_HEURISTIC_MONTHLY_TOLERANCE = 3      # ...soit 27-33 j (mois de 28-31 j + décalage week-end)
_HEURISTIC_MAJORITY_MIN_INTERVALS = 3  # >= 4 occurrences avant de tolérer un écart isolé
_HEURISTIC_MAX_OUTLIERS = 1            # un seul intervalle hors tolérance toléré, jamais plus
_HEURISTIC_MAX_PRICE = 50.0           # au-delà, trop risqué sans whitelist
_AMOUNT_CLUSTER_TOLERANCE = 0.50      # "montant fixe" : ± 0,50 € entre deux prélèvements consécutifs
_HEURISTIC_CATEGORY = "Autre"


def _cluster_by_amount(txs: list[RawTransaction]) -> list[list[RawTransaction]]:
    """Sous-groupe des transactions par montant quasi identique (± 0,50 €),
    chaque cluster trié par date. Utilisé pour les marchands-parapluie
    (plusieurs services sous un même libellé Apple/Google) et pour
    l'heuristique marchand inconnu (exigence de montant fixe).

    Comparaison au voisin le plus proche (dernière transaction déjà ajoutée
    au cluster), pas à la toute première : un prix qui dérive
    progressivement dans le même sens (taxe, conversion de devise) reste
    dans le même cluster tant que deux prélèvements CONSÉCUTIFS restent
    proches, même si l'écart cumulé entre le tout premier et le dernier
    dépasse la tolérance -- sinon un abonnement réel se fragmente en
    plusieurs clusters sous le seuil minimum d'occurrences au fil du temps."""
    clusters: list[list[RawTransaction]] = []
    for tx in sorted(txs, key=lambda t: t.date):
        for cluster in clusters:
            if abs(abs(cluster[-1].value) - abs(tx.value)) <= _AMOUNT_CLUSTER_TOLERANCE:
                cluster.append(tx)
                break
        else:
            clusters.append([tx])
    return clusters


def _build_candidate(
    merchant: str,
    txs: list[RawTransaction],
    frequency: str,
    confidence: float,
    category: str,
    today: date,
) -> CategorizedSubscription | None:
    """Construit un candidat à partir d'un groupe daté, en appliquant le
    filtre d'activité (occurrence récente OU prochaine échéance à venir) et
    la règle d'écrasement (prix/date = transaction la plus récente, jamais
    une moyenne -- un changement de forfait se reflète immédiatement)."""
    txs = sorted(txs, key=lambda t: t.date)
    latest_tx = txs[-1]
    last_date = _parse_date(latest_tx.date)
    nominal_days = _FREQUENCIES[frequency][0]
    next_estimated = last_date + timedelta(days=nominal_days)

    recent = _is_current_or_previous_month(last_date, today)
    still_due = next_estimated >= today
    if not (recent or still_due):
        return None  # ni occurrence récente, ni échéance à venir -> plus actif

    return CategorizedSubscription(
        merchant=merchant,
        price=round(abs(latest_tx.value), 2),
        frequency=frequency,
        occurrences=len(txs),
        last_date=last_date.isoformat(),
        next_estimated_date=next_estimated.isoformat(),
        confidence=confidence,
        source_transaction_ids=[latest_tx.id],
        category=category,
    )


def _intervals_of(txs: list[RawTransaction]) -> list[int]:
    dates = sorted(_parse_date(t.date) for t in txs)
    return [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]


def _is_strict_monthly(intervals: list[int]) -> bool:
    """True si le rythme colle à ~30/31 jours (tolérance serrée) -- le
    critère "récurrence quasi parfaite" de l'heuristique marchand inconnu,
    volontairement plus strict que `_match_frequency` (whitelist).

    Avec moins de 4 occurrences (< _HEURISTIC_MAJORITY_MIN_INTERVALS
    intervalles), TOUS les intervalles doivent coller à la tolérance : trop
    peu de mesures pour distinguer un vrai écart isolé d'un rythme
    simplement irrégulier. À partir de 4 occurrences, un unique intervalle
    hors tolérance (prélèvement en retard, jour férié, week-end) ne fait
    plus disparaître tout le candidat -- au maximum
    _HEURISTIC_MAX_OUTLIERS intervalle(s) peuvent sortir de la tolérance,
    jamais plus."""
    if not intervals:
        return False
    deviations = [abs(i - _HEURISTIC_MONTHLY_NOMINAL) for i in intervals]
    if len(intervals) < _HEURISTIC_MAJORITY_MIN_INTERVALS:
        return all(d <= _HEURISTIC_MONTHLY_TOLERANCE for d in deviations)
    outliers = sum(1 for d in deviations if d > _HEURISTIC_MONTHLY_TOLERANCE)
    return outliers <= _HEURISTIC_MAX_OUTLIERS


def analyze_transactions(transactions: list[RawTransaction]) -> list[CategorizedSubscription]:
    """Point d'entrée principal -- pipeline complet décrit dans le docstring
    du module : whitelist+empreintes (confiance 1.0) / blacklist (exclu) /
    heuristique marchand inconnu (confiance 0.8, à valider).

    Aucun montant minimum : les micro-transactions (0,99 € iCloud, 2,99 €
    Snap+) sont des signaux d'abonnement de plein droit.

    Note : une périodicité annuelle ne peut mathématiquement pas être
    confirmée par 2 occurrences dans une fenêtre de 6 mois (l'intervalle
    dépasse la fenêtre elle-même). Un abonnement annuel whitelisté n'est donc
    remonté que si sa dernière occurrence tombe dans le mois en cours ou
    précédent ; au-delà, faute de second point de mesure, on ne peut pas
    garantir qu'il est toujours actif et il est légitimement ignoré.
    """
    today = date.today()
    window_start = _shift_months(today, -ANALYSIS_WINDOW_MONTHS)

    debits = [tx for tx in transactions if tx.value < 0 and _parse_date(tx.date) >= window_start]

    # Tri des débits en trois lots : whitelistés (avec Clé Marchand), exclus
    # (blacklist, jetés ici AVANT toute analyse de récurrence), inconnus
    # (candidats heuristique). L'ordre whitelist-puis-blacklist est
    # intentionnel : "AUCHAN TELECOM" doit matcher la whitelist Téléphonie
    # avant que "AUCHAN" (blacklist grande distribution) ne puisse le bloquer.
    whitelisted: list[tuple[RawTransaction, str, str]] = []
    # Clé = libellé NORMALISÉ (accents/ponctuation/casse, cf. _normalize_spaced)
    # -- même moteur que whitelist/blacklist -- pour que deux variantes du même
    # marchand inconnu ("Kiné Dupont" / "KINE-DUPONT") tombent dans le même
    # groupe au lieu de rester chacune sous le seuil minimum d'occurrences.
    # On garde le libellé brut nettoyé (non normalisé) par transaction pour
    # l'affichage final (cf. .title() plus bas).
    unknown_by_label: dict[str, list[tuple[RawTransaction, str]]] = {}
    for tx in debits:
        label = clean_label(tx.wording)
        if not label:
            continue
        match = match_whitelist(label)
        if match is not None:
            merchant_key, category = match
            whitelisted.append((tx, merchant_key, category))
            continue
        if is_excluded(label):
            continue
        normalized_key = _normalize_spaced(label)
        if not normalized_key:
            continue
        unknown_by_label.setdefault(normalized_key, []).append((tx, label))

    results: list[CategorizedSubscription] = []

    # --- Étage 1 : marchands whitelistés (confiance 1.0) -------------------
    groups = _group_by_merchant_key(whitelisted)
    for merchant_key, entries in groups.items():
        entries_by_date = sorted(entries, key=lambda entry: entry[0].date)
        all_txs = [tx for tx, _ in entries_by_date]
        category = entries_by_date[-1][1]

        if merchant_key in STORE_BILLING_MERCHANTS:
            # Facturation centralisée Apple/Google : un même libellé mélange
            # abonnements ET achats one-shot. Chaque montant distinct doit
            # prouver une récurrence MESURÉE (jamais l'hypothèse "1
            # occurrence récente = mensuel") pour sortir comme candidat --
            # sinon tout achat d'app deviendrait un faux abonnement.
            for cluster in _cluster_by_amount(all_txs):
                if len(cluster) < 2:
                    continue
                freq_match = _match_frequency(_intervals_of(cluster))
                if freq_match is None:
                    continue
                candidate = _build_candidate(
                    merchant_key, cluster, freq_match[0], WHITELIST_CONFIDENCE, category, today
                )
                if candidate:
                    results.append(candidate)
            continue

        # Marchand whitelisté classique : groupé par Clé Marchand seule (un
        # changement de forfait ne crée jamais de doublon).
        frequency: str | None = None
        if len(all_txs) >= 2:
            freq_match = _match_frequency(_intervals_of(all_txs))
            if freq_match is not None:
                frequency = freq_match[0]

        if frequency is None:
            # Une seule occurrence (ou intervalles incohérents) : le mensuel
            # est l'hypothèse par défaut, mais seule une occurrence récente
            # justifie de garder ce candidat.
            last_date = _parse_date(all_txs[-1].date)
            if not _is_current_or_previous_month(last_date, today):
                continue
            frequency = "monthly"

        candidate = _build_candidate(
            merchant_key, all_txs, frequency, WHITELIST_CONFIDENCE, category, today
        )
        if candidate:
            results.append(candidate)

    # --- Étage 3 : marchands inconnus (confiance 0.8, à valider) -----------
    # (l'étage 2, la blacklist, a déjà éliminé ses transactions plus haut)
    for normalized_key, entries in unknown_by_label.items():
        txs = [tx for tx, _ in entries]
        raw_label_by_tx_id = {tx.id: raw_label for tx, raw_label in entries}
        for cluster in _cluster_by_amount(txs):
            if len(cluster) < _HEURISTIC_MIN_OCCURRENCES:
                continue
            if abs(cluster[-1].value) >= _HEURISTIC_MAX_PRICE:
                continue
            if not _is_strict_monthly(_intervals_of(cluster)):
                continue
            # .title() sur le libellé brut (non normalisé) de la transaction
            # la plus récente du cluster : lisible ("SELARL KINE DUPONT" ->
            # "Selarl Kine Dupont") et renommable dans la modale.
            display_label = raw_label_by_tx_id[cluster[-1].id]
            candidate = _build_candidate(
                display_label.title(), cluster, "monthly", HEURISTIC_CONFIDENCE, _HEURISTIC_CATEGORY, today
            )
            if candidate:
                results.append(candidate)

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
        # Prixtel : même marchand, casse différente ("prixtel" vs "PRIXTEL") et
        # changement de forfait (8€ -> 10€) -> UN SEUL résultat, pas de doublon.
        RawTransaction(id="8", wording="prlv sepa prixtel mobile", value=-8.00, date=_iso(33)),
        RawTransaction(id="9", wording="PRLV SEPA PRIXTEL MOBILE", value=-10.00, date=_iso(3)),
        # Marchand inconnu, seulement 2 occurrences -> ignoré (il en faut 3).
        RawTransaction(id="10", wording="CB ACHAT BOULANGERIE MARTIN", value=-4.50, date=_iso(30)),
        RawTransaction(id="11", wording="CB ACHAT BOULANGERIE MARTIN", value=-4.50, date=_iso(60)),
        # Blacklist : grande distribution, impôts, épargne, loyer, énergie,
        # eau, assurances -> exclus AVANT analyse de récurrence, même avec un
        # rythme parfait (charges courantes, pas des abonnements résiliables).
        RawTransaction(id="12", wording="CB LIDL PARIS 18", value=-32.10, date=_iso(4)),
        RawTransaction(id="13", wording="CB CARREFOUR PARIS 11", value=-64.20, date=_iso(4)),
        RawTransaction(id="14", wording="CB CARREFOUR PARIS 11", value=-64.20, date=_iso(34)),
        RawTransaction(id="15", wording="PRLV DGFIP IMPOT REVENU", value=-250.00, date=_iso(4)),
        RawTransaction(id="16", wording="VIR PERMANENT LIVRET A", value=-200.00, date=_iso(4)),
        RawTransaction(id="17", wording="PRLV SEPA LOYER AGENCE FONCIA", value=-750.00, date=_iso(2)),
        RawTransaction(id="17b", wording="PRLV SEPA EDF CLIENTS PARTICULIERS", value=-52.00, date=_iso(5)),
        RawTransaction(id="17c", wording="PRLV SEPA VEOLIA EAU", value=-18.40, date=_iso(6)),
        RawTransaction(id="17d", wording="PRLV SEPA AXA ASSURANCES", value=-32.00, date=_iso(7)),
        # Empreintes bancaires cryptiques -> résolues et détectées (100%).
        # iCloud à 0,99 € : micro-transaction, jamais filtrée sur le montant.
        RawTransaction(id="18", wording="CB APPLE.COM/BILL 0,99EUR", value=-0.99, date=_iso(63)),
        RawTransaction(id="19", wording="CB APPLE.COM/BILL 0,99EUR", value=-0.99, date=_iso(33)),
        RawTransaction(id="20", wording="CB APPLE.COM/BILL 0,99EUR", value=-0.99, date=_iso(3)),
        # Achat d'app one-shot via le même libellé Apple -> PAS un abonnement
        # (récurrence mesurée obligatoire pour les marchands-parapluie).
        RawTransaction(id="21", wording="CB APPLE.COM/BILL 19,99EUR", value=-19.99, date=_iso(10)),
        # Navigo : le prélèvement réel s'appelle COMUTITRES.
        RawTransaction(id="22", wording="PRLV SEPA COMUTITRES NAVIGO ANNUEL", value=-88.80, date=_iso(33)),
        RawTransaction(id="23", wording="PRLV SEPA COMUTITRES NAVIGO ANNUEL", value=-88.80, date=_iso(3)),
        # Tinder facturé via Match Group.
        RawTransaction(id="24", wording="CB MTCH*TINDER 421000", value=-14.99, date=_iso(32)),
        RawTransaction(id="25", wording="CB MTCH*TINDER 421000", value=-14.99, date=_iso(2)),
        # Marchand inconnu, récurrence parfaite (30 j), montant fixe < 50 € ->
        # candidat heuristique à 80%, catégorie "Autre", à valider.
        RawTransaction(id="26", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(63)),
        RawTransaction(id="27", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(33)),
        RawTransaction(id="28", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(3)),
        # Marchand inconnu récurrent mais > 50 € -> ignoré (trop risqué sans whitelist).
        RawTransaction(id="29", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(63)),
        RawTransaction(id="30", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(33)),
        RawTransaction(id="31", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(3)),
        # Ordre whitelist-avant-blacklist : Auchan Télécom survit à "AUCHAN".
        RawTransaction(id="32", wording="PRLV SEPA AUCHAN TELECOM MOBILE", value=-9.99, date=_iso(3)),
        # Transaction hors fenêtre de 6 mois -> ignorée.
        RawTransaction(id="33", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(210)),
        # Frais bancaires : cotisation carte récurrente -> détectée comme un
        # abonnement classique (catégorie "Banque"), jamais jetée.
        RawTransaction(id="34", wording="PRLV SEPA COTISATION CARTE VISA PREMIER", value=-3.00, date=_iso(63)),
        RawTransaction(id="35", wording="PRLV SEPA COTISATION CARTE VISA PREMIER", value=-3.00, date=_iso(33)),
        RawTransaction(id="36", wording="PRLV SEPA COTISATION CARTE VISA PREMIER", value=-3.00, date=_iso(3)),
    ]

    for result in analyze_transactions(sample):
        print(result)
