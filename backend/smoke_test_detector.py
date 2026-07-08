"""Smoke test du moteur de détection d'abonnements (transaction_analyzer) --
module pur, aucune dépendance DB/FastAPI/TestClient.

Couvre les trois étages du pipeline : whitelist + empreintes bancaires
(confiance 1.0), blacklist d'exclusion, heuristique marchand inconnu
(confiance 0.8), plus les cas limites (facturation centralisée Apple/Google,
micro-transactions, ordre whitelist-avant-blacklist).

Usage: python3 smoke_test_detector.py
"""
import sys
from datetime import date, timedelta

from app.core.subscription_detector import RawTransaction
from app.core.transaction_analyzer import (
    analyze_transactions,
    display_merchant_name,
    is_excluded,
    match_whitelist,
)

today = date.today()


def _iso(days_ago: int) -> str:
    return (today - timedelta(days=days_ago)).isoformat()


results_log = []


def check(label, condition, extra=""):
    status = "\033[92m✅" if condition else "\033[91m❌"
    print(f"{status} {label}{(' — ' + str(extra)) if extra and not condition else ''}\033[0m")
    results_log.append(condition)


print("=" * 70)
print("SMOKE TEST — Moteur de détection d'abonnements")
print("=" * 70)

# ---------------------------------------------------------------------------
print("\n[1] Empreintes bancaires (match_whitelist sur libellés cryptiques)")
# ---------------------------------------------------------------------------
cases = {
    "APPLE.COM/BILL": "Apple (App Store / iCloud)",
    "ITUNES.COM": "Apple (App Store / iCloud)",
    "APL*ITUNES.COM": "Apple (App Store / iCloud)",
    "GOOGLE *YOUTUBEPREMIUM": "YouTube Premium",
    "GOOGLE *GOOGLE ONE": "Google One",
    "GOOGLE PLAY": "Google Play (abonnement)",
    "MSFT *E0400": "Microsoft 365",
    "MSBILL.INFO": "Microsoft 365",
    "ADOBE SYSTEMS": "Adobe Creative Cloud",
    "OPENAI *CHATGPT SUBSCR": "ChatGPT (OpenAI)",
    "SNAP INC. SUBSCRIPTION": "Snap+",
    "SNAPCHAT": "Snap+",
    "TWITTER PAID FEATURES": "X Premium",
    "LINKEDIN PRE 123": "LinkedIn Premium",
    "MTCH*TINDER": "Tinder",
    "DISCORD* NITRO": "Discord Nitro",
    "COMUTITRES": "Navigo",
    "EDF CLIENTS PARTICULIERS": "EDF",
    "PAYPAL *SPOTIFY": "Spotify",  # wrapper PayPal transparent (match fusionné)
    "NETFLIX.COM": "Netflix",
    "TGVMAX SNCF": "TGV Max",
}
for bank_label, expected in cases.items():
    m = match_whitelist(bank_label)
    check(f'"{bank_label}" -> {expected}', m is not None and m[0] == expected, m)

# ---------------------------------------------------------------------------
print("\n[2] Blacklist (is_excluded)")
# ---------------------------------------------------------------------------
excluded_cases = [
    "CARREFOUR PARIS 11", "AUCHAN SUPERMARCHE", "E.LECLERC DRIVE", "LIDL 1180",
    "LOYER MR DUPONT", "AGENCE FONCIA LYON", "REMBOURSEMENT PRET IMMOBILIER",
    "ECHEANCE CREDIT 04/12", "COFIDIS", "DGFIP IMPOT REVENU", "TRESOR PUBLIC AMENDE",
    "URSSAF ILE DE FRANCE", "VIREMENT PERMANENT LIVRET A", "VERSEMENT PROGRAMME PEL",
    "RETRAIT DAB SG PARIS",
]
for label in excluded_cases:
    check(f'"{label}" exclu', is_excluded(label))

not_excluded_cases = ["NETFLIX.COM", "SALLE ESCALADE VERTICAL", "APPLE.COM/BILL"]
for label in not_excluded_cases:
    check(f'"{label}" non exclu', not is_excluded(label))

# ---------------------------------------------------------------------------
print("\n[3] Ordre whitelist-avant-blacklist")
# ---------------------------------------------------------------------------
m = match_whitelist("AUCHAN TELECOM MOBILE")
check("'AUCHAN TELECOM' matche la whitelist (survit au blocage AUCHAN)", m is not None and m[0] == "Auchan Télécom", m)
m = match_whitelist("CREDIT AGRICOLE COTISATION")
check("'CREDIT AGRICOLE' matche la whitelist (survit aux mots-clés crédit)", m is not None and m[0] == "Crédit Agricole", m)
check("'Carrefour+' n'est PLUS whitelisté (grande distribution)", match_whitelist("CARREFOUR+ ABONNEMENT") is None)

# ---------------------------------------------------------------------------
print("\n[4] Pipeline complet (analyze_transactions)")
# ---------------------------------------------------------------------------
sample = [
    # iCloud 0,99 € via facturation Apple : micro-transaction, 3 occurrences ~30 j.
    RawTransaction(id="a1", wording="CB APPLE.COM/BILL", value=-0.99, date=_iso(63)),
    RawTransaction(id="a2", wording="CB APPLE.COM/BILL", value=-0.99, date=_iso(33)),
    RawTransaction(id="a3", wording="CB APPLE.COM/BILL", value=-0.99, date=_iso(3)),
    # Achat one-shot 19,99 € via le même libellé Apple -> ne doit PAS sortir.
    RawTransaction(id="a4", wording="CB APPLE.COM/BILL", value=-19.99, date=_iso(10)),
    # Snap+ souscrit sur iPhone : second abonnement via la même empreinte Apple,
    # montant distinct -> second candidat Apple séparé.
    RawTransaction(id="s1", wording="CB APPLE.COM/BILL", value=-4.49, date=_iso(62)),
    RawTransaction(id="s2", wording="CB APPLE.COM/BILL", value=-4.49, date=_iso(32)),
    RawTransaction(id="s3", wording="CB APPLE.COM/BILL", value=-4.49, date=_iso(2)),
    # Netflix classique.
    RawTransaction(id="n1", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(35)),
    RawTransaction(id="n2", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date=_iso(5)),
    # Récurrences hors périmètre : blacklistées malgré un rythme parfait.
    RawTransaction(id="c1", wording="CB CARREFOUR PARIS 11", value=-64.20, date=_iso(64)),
    RawTransaction(id="c2", wording="CB CARREFOUR PARIS 11", value=-64.20, date=_iso(34)),
    RawTransaction(id="c3", wording="CB CARREFOUR PARIS 11", value=-64.20, date=_iso(4)),
    RawTransaction(id="l1", wording="PRLV SEPA LOYER AGENCE CITYA", value=-750.00, date=_iso(62)),
    RawTransaction(id="l2", wording="PRLV SEPA LOYER AGENCE CITYA", value=-750.00, date=_iso(32)),
    RawTransaction(id="l3", wording="PRLV SEPA LOYER AGENCE CITYA", value=-750.00, date=_iso(2)),
    RawTransaction(id="i1", wording="PRLV DGFIP IMPOT REVENU", value=-250.00, date=_iso(32)),
    RawTransaction(id="i2", wording="PRLV DGFIP IMPOT REVENU", value=-250.00, date=_iso(2)),
    RawTransaction(id="e1", wording="VIR PERMANENT LIVRET A", value=-200.00, date=_iso(32)),
    RawTransaction(id="e2", wording="VIR PERMANENT LIVRET A", value=-200.00, date=_iso(2)),
    # Marchand inconnu : récurrence parfaite, montant fixe < 50 € -> 80%.
    RawTransaction(id="u1", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(63)),
    RawTransaction(id="u2", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(33)),
    RawTransaction(id="u3", wording="PRLV SEPA SALLE ESCALADE VERTICAL", value=-24.90, date=_iso(3)),
    # Marchand inconnu récurrent mais >= 50 € -> ignoré.
    RawTransaction(id="o1", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(63)),
    RawTransaction(id="o2", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(33)),
    RawTransaction(id="o3", wording="PRLV SEPA CABINET OSTEO DURAND", value=-65.00, date=_iso(3)),
    # Marchand inconnu, 2 occurrences seulement -> ignoré (minimum 3).
    RawTransaction(id="b1", wording="CB BOULANGERIE MARTIN", value=-4.50, date=_iso(32)),
    RawTransaction(id="b2", wording="CB BOULANGERIE MARTIN", value=-4.50, date=_iso(2)),
    # Marchand inconnu, 3 occurrences mais rythme irrégulier (12/47 j) -> ignoré.
    RawTransaction(id="r1", wording="CB PIZZERIA LUIGI", value=-18.00, date=_iso(61)),
    RawTransaction(id="r2", wording="CB PIZZERIA LUIGI", value=-18.00, date=_iso(49)),
    RawTransaction(id="r3", wording="CB PIZZERIA LUIGI", value=-18.00, date=_iso(2)),
]

detected = analyze_transactions(sample)
by_merchant: dict[str, list] = {}
for d in detected:
    by_merchant.setdefault(d.merchant, []).append(d)

apple = sorted(by_merchant.get("Apple (App Store / iCloud)", []), key=lambda d: d.price)
check("2 candidats Apple distincts (0,99 iCloud + 4,49 Snap+), pas l'achat 19,99",
      len(apple) == 2 and apple[0].price == 0.99 and apple[1].price == 4.49,
      [(a.price, a.confidence) for a in apple])
check("Candidats Apple à confiance 1.0", all(a.confidence == 1.0 for a in apple))

check("Netflix détecté à 100%", "Netflix" in by_merchant and by_merchant["Netflix"][0].confidence == 1.0)

check("Carrefour absent (blacklist)", not any("CARREFOUR" in m.upper() for m in by_merchant))
check("Loyer absent (blacklist)", not any("LOYER" in m.upper() or "CITYA" in m.upper() for m in by_merchant))
check("Impôts absents (blacklist)", not any("DGFIP" in m.upper() for m in by_merchant))
check("Épargne absente (blacklist)", not any("LIVRET" in m.upper() for m in by_merchant))

vertical = by_merchant.get("Salle Escalade Vertical", [])
check("Marchand inconnu récurrent < 50 € détecté à 80%",
      len(vertical) == 1 and vertical[0].confidence == 0.8 and vertical[0].category == "Autre",
      vertical)
check("Marchand inconnu >= 50 € absent", not any("OSTEO" in m.upper() for m in by_merchant))
check("Marchand inconnu à 2 occurrences absent", not any("BOULANGERIE" in m.upper() for m in by_merchant))
check("Marchand inconnu à rythme irrégulier absent", not any("PIZZERIA" in m.upper() for m in by_merchant))

# ---------------------------------------------------------------------------
print("\n[5] Non-régression display_merchant_name (Lettre de résiliation, Partagé)")
# ---------------------------------------------------------------------------
check("'PRLV SEPA EDF CLIENTS PARTICULIERS' -> 'EDF'",
      display_merchant_name("PRLV SEPA EDF CLIENTS PARTICULIERS") == "EDF")
check("'APPLE.COM/BILL' -> nom canonique Apple",
      display_merchant_name("APPLE.COM/BILL") == "Apple (App Store / iCloud)")
check("Nom hors whitelist inchangé (repli brut)",
      display_merchant_name("Mon abonnement perso") == "Mon abonnement perso")

print("\n" + "=" * 70)
total, passed = len(results_log), sum(results_log)
print(f"RÉSULTAT : {passed}/{total} assertions passées")
print("=" * 70)
sys.exit(0 if passed == total else 1)
