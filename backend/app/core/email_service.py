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
        logger.warning("SMTP non configuré — email à %s non envoyé.\nSujet: %s\n%s", to, subject, html_body)
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
        subject="Réinitialise ton mot de passe SubServer",
        html_body=_code_email_body(
            "Réinitialisation de mot de passe",
            "Voici ton code de réinitialisation :",
            code,
            footer="Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.",
        ),
    )


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
        subject=f"[Contact SubServer] {subject}",
        html_body=html_body,
        reply_to=from_email,
    )
