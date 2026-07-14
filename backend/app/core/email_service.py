"""Envoi d'e-mails transactionnels (codes de vérification / réinitialisation)
via SMTP standard (équivalent Python de nodemailer). Fonctionne avec n'importe
quel relais SMTP (Proton Mail Bridge, Gmail, SendGrid...), configuré via les
variables d'environnement SMTP_*.
"""

import html
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str, reply_to: str | None = None) -> None:
    if not settings.SMTP_HOST:
        # Pas de SMTP configuré (dev local) : log au lieu d'échouer silencieusement.
        logger.warning("SMTP non configuré - email à %s non envoyé.\nSujet: %s\n%s", to, subject, html_body)
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
    if reply_to:
        message["Reply-To"] = reply_to
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, [to], message.as_string())


def _code_email_body(title: str, intro: str, code: str, footer: str = "") -> str:
    return f"""
    <div style="font-family: -apple-system, sans-serif; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">{title}</h2>
      <p style="color: #475569;">{intro}</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">{code}</p>
      <p style="color: #94a3b8; font-size: 13px;">Ce code expire dans {settings.VERIFICATION_CODE_TTL_MINUTES} minutes.</p>
      {f'<p style="color: #94a3b8; font-size: 13px;">{footer}</p>' if footer else ""}
    </div>
    """


def send_password_reset_email(to: str, code: str) -> None:
    send_email(
        to,
        subject="Réinitialise ton mot de passe SubSaver",
        html_body=_code_email_body(
            "Réinitialisation de mot de passe",
            "Voici ton code de réinitialisation :",
            code,
            footer="Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.",
        ),
    )


_CURRENCY_SYMBOLS = {"EUR": "€", "USD": "$", "GBP": "£", "SEK": "kr"}


def format_price(amount: float, currency: str) -> str:
    """Formatage simple, cohérent avec `formatPrice` côté frontend (cf.
    frontend/src/lib/format.ts) sans dépendre des locales système (pas
    toujours installées sur l'hébergeur) : "2,99 €", "$2.99", "2,99 kr"..."""
    symbol = _CURRENCY_SYMBOLS.get(currency, currency)
    has_cents = abs(amount - round(amount)) > 0.001
    value = f"{amount:,.2f}".replace(",", " ").replace(".", ",") if has_cents else f"{round(amount):,}".replace(",", " ")
    if currency == "USD":
        value = value.replace(",", ".").replace(" ", ",")
        return f"{symbol}{value}"
    return f"{value} {symbol}"


def send_debt_reminder_email(
    to: str, member_first_name: str, owner_name: str, amount: float, currency: str, period_label: str, request_date: str
) -> None:
    """Relance de paiement envoyée par le propriétaire du groupe Abonnement
    partagé à un membre débiteur (cf. POST /family/debts/remind). Purement
    informatif -- pas de lien de paiement, l'app ne fait que suivre des
    dettes entre proches, elle n'encaisse rien."""
    safe_first_name = html.escape(member_first_name)
    safe_owner_name = html.escape(owner_name)
    safe_period = html.escape(period_label)
    price = format_price(amount, currency)

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc;">
      <div style="background: #0A1128; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <span style="color: #D4AF37; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">SubSaver</span>
      </div>
      <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; color: #0f172a; font-size: 15px;">Bonjour {safe_first_name},</p>
        <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
          {safe_owner_name} te rappelle ta part sur les abonnements partagés SubSaver.
        </p>

        <div style="background: #FAF6EA; border: 1px solid #D4AF37; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 13px;">Montant dû</p>
          <p style="margin: 0; color: #0A1128; font-size: 32px; font-weight: 700;">{price}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Raison</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">Abonnements partagés - {safe_period}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Date de la demande</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">{request_date}</td>
          </tr>
        </table>

        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          Ce message a été envoyé automatiquement depuis SubSaver à la demande de {safe_owner_name}.
          Réglez directement avec cette personne (virement, espèces...) -- SubSaver ne gère aucun paiement.
        </p>
      </div>
    </div>
    """
    send_email(to, subject=f"{owner_name} te rappelle {price} pour vos abonnements partagés", html_body=html_body)


def send_contact_email(name: str, from_email: str, subject: str, message: str) -> None:
    """Transfère un message du formulaire de contact public vers
    `settings.CONTACT_EMAIL`, avec `Reply-To` positionné sur l'adresse du
    visiteur : répondre depuis la boîte Proton Mail répond donc directement
    au visiteur, sans avoir à copier-coller son adresse.

    Tous les champs viennent d'un formulaire public non authentifié : ils
    sont échappés (`html.escape`) avant interpolation pour empêcher une
    injection HTML dans le corps du mail (ex: faux lien de phishing intégré
    au message)."""
    safe_name = html.escape(name)
    safe_email = html.escape(from_email)
    safe_subject = html.escape(subject)
    safe_message = html.escape(message)

    html_body = f"""
    <div style="font-family: -apple-system, sans-serif; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Nouveau message de contact</h2>
      <p style="color: #475569;"><strong>De :</strong> {safe_name} ({safe_email})</p>
      <p style="color: #475569;"><strong>Sujet :</strong> {safe_subject}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="white-space: pre-wrap;">{safe_message}</p>
    </div>
    """
    send_email(
        settings.CONTACT_EMAIL,
        subject=f"[Contact SubSaver] {subject}",
        html_body=html_body,
        reply_to=from_email,
    )
