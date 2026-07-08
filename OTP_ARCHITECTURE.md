# Architecture OTP (One-Time Password) — SMS Verification

## Vue d'ensemble du flux

```
┌─────────────────┐
│   Inscription   │
│    (Étape 1)    │
│                 │
│ • Prénom        │
│ • Email         │
│ • Téléphone     │
│ • Mot de passe  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  POST /auth/register     │
│                          │
│ • Valider les données    │
│ • Générer OTP (6 chiffres)
│ • Envoyer SMS via Twilio/
│   Vonage/Brevo           │
│ • Retourner phone_masked │
│   + attempts_remaining   │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────┐
│  Vérification OTP   │
│    (Étape 2)        │
│                     │
│ Saisir code SMS     │
│ (6 chiffres)        │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│  POST /auth/verify-otp   │
│                          │
│ • Valider le code        │
│ • Créer l'utilisateur    │
│ • Retourner token JWT    │
│   + utilisateur complet  │
└────────┬─────────────────┘
         │
         ▼
┌────────────────────┐
│  Authentifié ✅    │
│                    │
│ Token stocké       │
│ localStorage       │
└────────────────────┘
```

## Communication Front-end ↔ Back-end

### 1️⃣ Étape 1 : Inscription + Envoi OTP

**Request (Front → Back)**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "first_name": "Jean",
  "phone": "+33612345678"
}
```

**Response (Back → Front) — 200 OK**
```json
{
  "phone_masked": "+33 6**** ****78",
  "attempts_remaining": 3
}
```

**Flux back-end :**
1. Valider les données (email unique, phone valide)
2. Créer une session d'enregistrement temporaire en cache (Redis recommandé)
   - Clé : `otp_session:{email}:{phone_hash}`
   - Valeur : `{ password_hash, first_name, otp_code, attempts: 3, created_at, expires_at }`
   - TTL : 10 minutes
3. Générer OTP 6 chiffres aléatoires
4. Envoyer SMS via prestataire (voir section SMS Provider)
5. Retourner `phone_masked` pour affichage au front
6. **Ne pas créer l'utilisateur en DB avant la vérification du code**

---

### 2️⃣ Étape 2 : Vérification OTP

**Request (Front → Back)**
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+33612345678",
  "otp_code": "123456"
}
```

**Response (Back → Front) — 200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Jean",
    "phone": "+33612345678",
    "language": "fr",
    "theme": "light",
    "currency": "EUR",
    "notification_pref": "all",
    "is_premium": false,
    "bank_connected": false
  }
}
```

**Flux back-end :**
1. Récupérer la session OTP depuis cache `otp_session:{email}:{phone_hash}`
2. Vérifier :
   - La session existe et n'est pas expirée
   - Le code OTP fourni correspond
   - Tentatives restantes > 0
3. Si **erreur** :
   - Décrémenter `attempts`
   - Retourner `400 Bad Request` avec message d'erreur
   - Si attempts = 0 → Retourner `429 Too Many Requests`
4. Si **succès** :
   - Créer l'utilisateur en base de données
   - Générer JWT token
   - Supprimer la session OTP du cache
   - Retourner `access_token` + `user` complet

---

## Provider SMS : Options & Configuration

### Option 1 : Twilio (Recommandé)
```python
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_otp_sms(phone: str, otp_code: str):
    try:
        client.messages.create(
            body=f"Votre code de vérification SubServer est: {otp_code}",
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
    except Exception as e:
        logger.error(f"Twilio SMS error: {e}")
        raise HTTPException(status_code=500, detail="Erreur d'envoi SMS")
```

### Option 2 : Vonage (ex-Nexmo)
```python
from vonage import Client as VonageClient

vonage_client = VonageClient(
    api_key=os.getenv("VONAGE_API_KEY"),
    api_secret=os.getenv("VONAGE_API_SECRET")
)

def send_otp_sms(phone: str, otp_code: str):
    try:
        response = vonage_client.sms.send_message({
            "to": phone,
            "from": "SubServer",
            "text": f"Votre code de vérification SubServer est: {otp_code}"
        })
        if response["messages"][0]["status"] != "0":
            raise Exception("Vonage API error")
    except Exception as e:
        logger.error(f"Vonage SMS error: {e}")
        raise HTTPException(status_code=500, detail="Erreur d'envoi SMS")
```

### Option 3 : Brevo (ex-Sendinblue)
```python
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")

api_instance = sib_api_v3_sdk.TransactionalSmsApi(
    sib_api_v3_sdk.ApiClient(configuration)
)

def send_otp_sms(phone: str, otp_code: str):
    try:
        send_sms = sib_api_v3_sdk.SendTransacSms(
            sender="SubServer",
            recipient=phone,
            content=f"Votre code de vérification SubServer est: {otp_code}"
        )
        api_instance.send_transac_sms(send_sms)
    except ApiException as e:
        logger.error(f"Brevo SMS error: {e}")
        raise HTTPException(status_code=500, detail="Erreur d'envoi SMS")
```

---

## Implémentation FastAPI (Back-end)

### 1. Modèles Pydantic

```python
# schemas.py
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., regex=r"^\+?[1-9]\d{1,14}$")

class RegisterResponse(BaseModel):
    phone_masked: str
    attempts_remaining: int

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    phone: str = Field(..., regex=r"^\+?[1-9]\d{1,14}$")
    otp_code: str = Field(..., regex=r"^\d{6}$")

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    phone: str
    language: str = "fr"
    theme: str = "light"
    currency: str = "EUR"
    notification_pref: str = "all"
    is_premium: bool = False
    bank_connected: bool = False

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

### 2. Service OTP

```python
# services/otp_service.py
import secrets
import hashlib
import redis
from datetime import datetime, timedelta

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def generate_otp() -> str:
    """Générer un code OTP 6 chiffres"""
    return str(secrets.randbelow(1000000)).zfill(6)

def mask_phone(phone: str) -> str:
    """Masquer le téléphone pour affichage sécurisé"""
    if len(phone) < 8:
        return phone
    return f"{phone[:3]}{'*' * (len(phone) - 6)}{phone[-2:]}"

def hash_phone(phone: str) -> str:
    """Hash du téléphone pour la clé Redis"""
    return hashlib.sha256(phone.encode()).hexdigest()

def store_otp_session(email: str, phone: str, password_hash: str, first_name: str):
    """Stocker la session OTP en cache Redis (TTL 10 min)"""
    otp_code = generate_otp()
    phone_hash = hash_phone(phone)
    key = f"otp_session:{email}:{phone_hash}"
    
    session_data = {
        "password_hash": password_hash,
        "first_name": first_name,
        "otp_code": otp_code,
        "phone": phone,
        "attempts": 3,
        "created_at": datetime.utcnow().isoformat()
    }
    
    redis_client.setex(
        key,
        timedelta(minutes=10),
        json.dumps(session_data)
    )
    
    return otp_code

def verify_otp_session(email: str, phone: str, otp_code: str) -> dict | None:
    """Vérifier le code OTP et retourner la session"""
    phone_hash = hash_phone(phone)
    key = f"otp_session:{email}:{phone_hash}"
    
    session_data = redis_client.get(key)
    if not session_data:
        return None
    
    session = json.loads(session_data)
    
    # Vérifier le code
    if session["otp_code"] != otp_code:
        session["attempts"] -= 1
        if session["attempts"] > 0:
            redis_client.setex(key, timedelta(minutes=10), json.dumps(session))
        return None
    
    # Code correct → Supprimer la session
    redis_client.delete(key)
    return session
```

### 3. Routes FastAPI

```python
# routes/auth.py
from fastapi import APIRouter, HTTPException
from services.otp_service import store_otp_session, verify_otp_session, mask_phone, send_otp_sms

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=RegisterResponse)
async def register(req: RegisterRequest):
    """
    Étape 1 : Inscription + Envoi OTP
    - Valider les données
    - Générer OTP et envoyer SMS
    - Retourner phone_masked
    """
    
    # Vérifier que l'email n'existe pas
    existing_user = await db.users.find_one({"email": req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Hash du password
    password_hash = get_password_hash(req.password)
    
    # Générer et stocker OTP en cache
    otp_code = store_otp_session(req.email, req.phone, password_hash, req.first_name)
    
    # Envoyer SMS
    try:
        send_otp_sms(req.phone, otp_code)
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi du SMS")
    
    return RegisterResponse(
        phone_masked=mask_phone(req.phone),
        attempts_remaining=3
    )

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(req: VerifyOtpRequest):
    """
    Étape 2 : Vérification OTP + Création utilisateur
    - Vérifier le code OTP
    - Créer l'utilisateur en DB
    - Retourner JWT token
    """
    
    # Vérifier le code OTP
    session = verify_otp_session(req.email, req.phone, req.otp_code)
    if not session:
        raise HTTPException(status_code=400, detail="Code OTP invalide ou expiré")
    
    # Créer l'utilisateur
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": req.email,
        "first_name": session["first_name"],
        "phone": req.phone,
        "password_hash": session["password_hash"],
        "language": "fr",
        "theme": "light",
        "currency": "EUR",
        "notification_pref": "all",
        "is_premium": False,
        "bank_connected": False,
        "created_at": datetime.utcnow(),
    }
    
    await db.users.insert_one(user_doc)
    
    # Générer token JWT
    access_token = create_access_token(data={"sub": req.email})
    
    user_response = UserResponse(**user_doc)
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )
```

---

## Sécurité & Bonnes pratiques

### ✅ À faire :

1. **Rate limiting** sur `/auth/register` et `/auth/verify-otp`
   ```python
   from slowapi import Limiter
   limiter.limit("3/minute")(verify_otp)
   ```

2. **Hashing du password** avec bcrypt/argon2
   ```python
   from passlib.context import CryptContext
   pwd_context = CryptContext(schemes=["bcrypt"])
   password_hash = pwd_context.hash(req.password)
   ```

3. **JWT token** avec expiration court
   ```python
   access_token = create_access_token(
       data={"sub": email},
       expires_delta=timedelta(hours=24)
   )
   ```

4. **HTTPS obligatoire** en production
   - Protège les tokens et OTP en transit
   - Certificat SSL/TLS

5. **Validation stricte** de format téléphone
   - Utiliser `phonenumbers` library
   ```python
   import phonenumbers
   
   def validate_phone(phone: str) -> bool:
       try:
           parsed = phonenumbers.parse(phone, None)
           return phonenumbers.is_valid_number(parsed)
       except:
           return False
   ```

### ❌ À éviter :

- ❌ Ne pas exposer les détails OTP dans les erreurs
- ❌ Ne pas stocker OTP en plaintext en DB
- ❌ Ne pas envoyer OTP par email (vulnérable)
- ❌ Ne pas réutiliser le même OTP
- ❌ Ne pas accepter OTP expiré

---

## Variables d'environnement (.env)

```env
# SMS Provider
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# OU Vonage
VONAGE_API_KEY=xxxxx
VONAGE_API_SECRET=xxxxx

# OU Brevo
BREVO_API_KEY=xxxxx

# Redis (pour cache OTP)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-prod
JWT_ALGORITHM=HS256
```

---

## Testing & Debugging

### Test local avec code statique

Pour développer sans vraiment envoyer de SMS :

```python
if os.getenv("ENV") == "development":
    def send_otp_sms(phone: str, otp_code: str):
        logger.info(f"[DEV] SMS to {phone}: {otp_code}")
        # En dev, log le code au lieu d'envoyer
else:
    def send_otp_sms(phone: str, otp_code: str):
        # Production : vrai appel SMS
```

### Logs importants

```python
logger.info(f"OTP requested for: {email}, phone: {mask_phone(phone)}")
logger.info(f"OTP verified successfully for: {email}")
logger.warning(f"OTP attempt failed for: {email}, attempts left: {attempts}")
logger.error(f"SMS send failed: {e}")
```

---

## Résumé des endpoints

| Méthode | Route | Étape | Request | Response |
|---------|-------|-------|---------|----------|
| `POST` | `/auth/register` | 1️⃣ | `RegisterRequest` | `RegisterResponse` |
| `POST` | `/auth/verify-otp` | 2️⃣ | `VerifyOtpRequest` | `AuthResponse` |
| `POST` | `/auth/login` | Login | Email + Password | `AuthResponse` |

---

**Dernière mise à jour:** Juillet 2026  
**Framework Back-end:** FastAPI + MongoDB (ou PostgreSQL)  
**Cache:** Redis (recommandé pour OTP)  
**SMS Provider:** Twilio / Vonage / Brevo
