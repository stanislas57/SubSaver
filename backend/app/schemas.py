from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict

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
