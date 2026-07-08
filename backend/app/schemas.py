from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

Language = Literal["fr", "en", "de", "es", "sv"]
Theme = Literal["light", "dark"]
Currency = Literal["EUR", "USD", "GBP", "SEK"]
NotificationPref = Literal["all", "trials", "none"]
Importance = Literal[1, 2, 3]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    language: Language
    theme: Theme
    currency: Currency
    notification_pref: NotificationPref
    is_premium: bool
    bank_connected: bool
    is_admin: bool
    charter_accepted_at: Optional[str] = None


class RegisterBody(BaseModel):
    email: str
    password: str
    first_name: str


class RegisterResult(BaseModel):
    email: str
    message: str


class VerifyEmailBody(BaseModel):
    email: str
    code: str


class EmailBody(BaseModel):
    email: str


class ResetPasswordBody(BaseModel):
    email: str
    code: str
    new_password: str


class MessageResult(BaseModel):
    message: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    language: Optional[Language] = None
    theme: Optional[Theme] = None
    currency: Optional[Currency] = None
    notification_pref: Optional[NotificationPref] = None


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    price: float
    category: str
    domain: str
    billing_day: int
    importance: int
    start_date: Optional[str] = None
    trial_end_date: Optional[str] = None
    # Champ en lecture seule (jamais dans SubscriptionInput) : expose l'état
    # de partage pour les pages qui en ont besoin en affichage (ex: filtre
    # Personnels/Partagés de l'Analytique) sans coupler le CRUD générique
    # d'abonnement à la logique d'Abonnement partagé.
    is_shared: bool = False
    # Champ en lecture seule (jamais dans SubscriptionInput) : nom normalisé
    # (moteur Clé Marchand), jamais le libellé bancaire brut -- ex: Calendrier.
    display_name: str = ""


class SubscriptionInput(BaseModel):
    name: str
    price: float
    category: str
    domain: str
    billing_day: int
    importance: int
    start_date: Optional[str] = None
    trial_end_date: Optional[str] = None


class BankProviderOut(BaseModel):
    id: str
    name: str
    domain: str


class BankSyncBody(BaseModel):
    provider_id: str


class BankSyncResult(BaseModel):
    bank_connected: bool
    injected_subscriptions: list[SubscriptionOut]


class BankConnectUrlOut(BaseModel):
    webview_url: str


class BankCallbackBody(BaseModel):
    state: str
    connection_id: Optional[str] = None
    error: Optional[str] = None
    error_description: Optional[str] = None


class BankCallbackResult(BaseModel):
    bank_connected: bool
    connection_id: Optional[str] = None


class BankTransactionOut(BaseModel):
    id: str
    wording: str
    value: float
    date: str
    transaction_type: Optional[str] = None


class BankTransactionsSyncResult(BaseModel):
    synced_count: int
    total_stored: int


class DetectedSubscriptionOut(BaseModel):
    merchant: str
    price: float
    frequency: Literal["weekly", "monthly", "yearly"]
    occurrences: int
    last_date: str
    next_estimated_date: str
    confidence: float
    source_transaction_ids: list[str]
    category: str
    # Calculés côté serveur en comparant `merchant` (déjà la Clé Marchand
    # canonique) au nom NORMALISÉ (même moteur whitelist) de chaque
    # abonnement déjà existant de l'utilisateur -- une comparaison de texte
    # brut côté frontend ne peut pas détecter qu'un abonnement existant au
    # libellé bancaire brut ("PRLV SEPA PRIXTEL MOBILE 123456") et ce candidat
    # ("Prixtel") désignent le même marchand.
    matched_subscription_id: Optional[str] = None
    duplicate_subscription_ids: list[str] = []


class BankStatusOut(BaseModel):
    bank_connected: bool
    bank_name: Optional[str] = None
    last_sync_at: Optional[str] = None
    total_transactions: int


class MarketOfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    name: str
    price: float
    promo: Optional[str] = None
    score: float
    engagement: str
    pros: list[str]
    cons: list[str]
    link: str
    price_checked_at: str


class FamilyMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: Optional[str] = None
    is_owner: bool


class FamilyMemberBody(BaseModel):
    name: str
    email: Optional[str] = None


class FamilyGroupOut(BaseModel):
    id: str
    name: str
    members: list[FamilyMemberOut]


class FamilyBalanceOut(BaseModel):
    member_id: str
    member_name: str
    share_percent: float
    amount_owed: float


class ShareableSubscriptionOut(BaseModel):
    """Version allégée de SubscriptionOut pour la sélection Abonnement
    partagé -- volontairement un schéma séparé plutôt que d'ajouter
    is_shared à SubscriptionOut/SubscriptionInput, qui sont utilisés par le
    CRUD abonnements générique (SubscriptionForm) sans rapport avec le
    partage de groupe.

    `display_name` passe par le même moteur Clé Marchand que la Lettre de
    résiliation (`match_whitelist`) : jamais un libellé bancaire brut, la
    liste est aussi dédupliquée sur cette base (cf.
    list_shareable_subscriptions)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    price: float
    category: str
    is_shared: bool


class SharedSubscriptionSelectionBody(BaseModel):
    subscription_ids: list[str]


SplitMode = Literal["equal", "percentage", "fixed"]


class SubscriptionSplitMemberOut(BaseModel):
    member_id: str
    member_name: str
    # Valeur brute stockée (pourcentage ou montant fixe) -- None en mode "equal".
    share_value: Optional[float] = None
    # Montant réellement dû par ce membre pour cet abonnement, déjà calculé.
    computed_amount: float


class SubscriptionSplitOut(BaseModel):
    subscription_id: str
    display_name: str
    price: float
    split_mode: SplitMode
    members: list[SubscriptionSplitMemberOut]


class SubscriptionSplitMemberInput(BaseModel):
    member_id: str
    # Requis en mode percentage/fixed, ignoré en mode equal.
    share_value: Optional[float] = None


class SubscriptionSplitUpdateBody(BaseModel):
    split_mode: SplitMode
    members: list[SubscriptionSplitMemberInput]


class DebtEdgeOut(BaseModel):
    """Une dette simplifiée : "from" doit "amount" à "to". La liste renvoyée
    par GET /family/debts est déjà le résultat de l'algorithme de
    simplification (nombre minimal de transactions pour tout solder)."""

    from_member_id: str
    from_member_name: str
    to_member_id: str
    to_member_name: str
    amount: float


class SettleDebtBody(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: float


class SettlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    from_member_id: str
    from_member_name: str
    to_member_id: str
    to_member_name: str
    amount: float
    period: str
    created_at: str


class CancellableSubscriptionOut(BaseModel):
    """Version dédupliquée et normalisée des abonnements pour le menu de la
    Lettre de résiliation -- `display_name` passe par le même moteur de
    reconnaissance de marchand (`match_whitelist`/Clé Marchand) que l'analyse
    bancaire, pour ne jamais afficher un libellé brut ("EDF CLIENTS
    PARTICULIERS...") ni un doublon (deux entrées "Prixtel") dans le menu."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    price: float
    domain: str


class ContactBody(BaseModel):
    """Corps de POST /contact (formulaire public, non authentifié). `name`,
    `email` et `subject` finissent dans des en-têtes SMTP (Reply-To, Subject)
    -- on y interdit tout retour à la ligne pour empêcher une injection
    d'en-tête (ex: ajout frauduleux d'un Bcc:)."""

    name: str = Field(max_length=100)
    email: str = Field(max_length=254)
    subject: str = Field(max_length=200)
    message: str = Field(max_length=5000)

    @field_validator("name", "email", "subject")
    @classmethod
    def _no_newlines(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Ce champ ne peut pas être vide.")
        if "\n" in stripped or "\r" in stripped:
            raise ValueError("Ce champ ne peut pas contenir de retour à la ligne.")
        return stripped

    @field_validator("message")
    @classmethod
    def _message_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Le message ne peut pas être vide.")
        return stripped


# ---------------------------------------------------------------------------
# Back-Office Super Admin (cf. app/api/v1/admin.py)
# ---------------------------------------------------------------------------

class AdminUserOut(BaseModel):
    id: str
    email: str
    first_name: str
    is_premium: bool
    is_admin: bool
    bank_connected: bool
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None
    subscriptions_count: int


class AdminUserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    is_premium: Optional[bool] = None
    is_admin: Optional[bool] = None


class AdminUsersPage(BaseModel):
    items: list[AdminUserOut]
    total: int
    page: int
    page_size: int


class AdminAnalyticsOut(BaseModel):
    total_users: int
    new_users_today: int
    premium_users: int
    premium_conversion_rate: float
