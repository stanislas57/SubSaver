"""Envoi de codes OTP par SMS via Twilio.
Fonctionne en mode dev (logs) ou production (SMS réel).
"""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_sms(phone: str, otp_code: str) -> None:
    """Envoie le code OTP par SMS."""
    if not settings.SMS_PROVIDER or settings.SMS_PROVIDER == "dev":
        # Mode développement : log le code au lieu d'envoyer
        logger.info("📱 [DEV MODE] SMS OTP to %s: %s", phone, otp_code)
        return

    if settings.SMS_PROVIDER == "twilio":
        _send_twilio(phone, otp_code)
    elif settings.SMS_PROVIDER == "vonage":
        _send_vonage(phone, otp_code)
    elif settings.SMS_PROVIDER == "brevo":
        _send_brevo(phone, otp_code)
    else:
        logger.error("SMS provider non supporté: %s", settings.SMS_PROVIDER)
        raise ValueError(f"SMS provider non supporté: {settings.SMS_PROVIDER}")


def _send_twilio(phone: str, otp_code: str) -> None:
    """Envoie via Twilio."""
    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Votre code de vérification SubServer est: {otp_code}",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone,
        )
        logger.info("SMS OTP envoyé via Twilio à %s", phone)
    except Exception as e:
        logger.error("Twilio SMS error: %s", str(e))
        raise


def _send_vonage(phone: str, otp_code: str) -> None:
    """Envoie via Vonage (ex-Nexmo)."""
    try:
        from vonage import Client as VonageClient

        vonage_client = VonageClient(
            api_key=settings.VONAGE_API_KEY,
            api_secret=settings.VONAGE_API_SECRET,
        )
        response = vonage_client.sms.send_message(
            {
                "to": phone,
                "from": "SubServer",
                "text": f"Votre code de vérification SubServer est: {otp_code}",
            }
        )
        if response["messages"][0]["status"] != "0":
            raise Exception("Vonage API returned error status")
        logger.info("SMS OTP envoyé via Vonage à %s", phone)
    except Exception as e:
        logger.error("Vonage SMS error: %s", str(e))
        raise


def _send_brevo(phone: str, otp_code: str) -> None:
    """Envoie via Brevo (ex-Sendinblue)."""
    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException

        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = settings.BREVO_API_KEY

        api_instance = sib_api_v3_sdk.TransactionalSmsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
        send_sms = sib_api_v3_sdk.SendTransacSms(
            sender="SubServer",
            recipient=phone,
            content=f"Votre code de vérification SubServer est: {otp_code}",
        )
        api_instance.send_transac_sms(send_sms)
        logger.info("SMS OTP envoyé via Brevo à %s", phone)
    except Exception as e:
        logger.error("Brevo SMS error: %s", str(e))
        raise


def mask_phone(phone: str) -> str:
    """Masque le téléphone pour affichage sécurisé (ex: +33 6**** ****78)."""
    if len(phone) < 8:
        return phone
    # Garder les 3 premiers et 2 derniers caractères
    masked = f"{phone[:3]}{'*' * (len(phone) - 6)}{phone[-2:]}"
    # Ajouter un espace pour lisibilité
    return f"{masked[:6]} {masked[6:]}"
