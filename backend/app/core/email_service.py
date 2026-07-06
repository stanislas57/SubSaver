"""Envoi d'e-mails transactionnels (codes de vérification / réinitialisation)
via SMTP standard (équivalent Python de nodemailer). Fonctionne avec n'importe
quel relais SMTP (Proton Mail Bridge, Gmail, SendGrid...), configuré via les
variables d'environnement SMTP_*.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_HOST:
        # Pas de SMTP configuré (dev local) : log au lieu d'échouer silencieusement.
        logger.warning("SMTP non configuré — email à %s non envoyé.\nSujet: %s\n%s", to, subject, html_body)
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
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


def send_verification_code_email(to: str, code: str) -> None:
    send_email(
        to,
        subject="Ton code de vérification SubServer",
        html_body=_code_email_body(
            "Vérifie ton adresse e-mail",
            "Voici ton code de vérification pour activer ton compte SubServer :",
            code,
        ),
    )


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
