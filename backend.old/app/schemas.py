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


class RegisterBody(BaseModel):
    email: str
    password: str
    first_name: str


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


class MarketOfferOut(BaseModel):
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
