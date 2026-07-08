# Implémentation SMS OTP — Guide d'intégration

## 📋 Résumé des changements

### 1. **Modèle User** (`app/models/user.py`)
- ✅ Ajout du champ `phone: str` (unique, indexed)
- ✅ Remplacement du système email par OTP SMS :
  - `otp_code: str | None` — Code 6 chiffres
  - `otp_expires_at: str | None` — Expiration (10 min par défaut)
  - `otp_attempts: int` — Compteur de tentatives échouées
- ✅ Conservation legacy des colonnes email (pour compatibilité)

### 2. **Schémas** (`app/schemas.py`)
- ✅ `UserOut` — ajout du champ `phone`
- ✅ `RegisterBody` — ajout du `phone` avec validation regex
- ✅ `RegisterResult` — remplacé par `phone_masked` + `attempts_remaining`
- ✅ `VerifyOtpBody` — nouveau schéma (email, phone, otp_code)
- ✅ Validateurs Pydantic pour phone et otp_code

### 3. **Configuration** (`app/core/config.py`)
- ✅ Variables SMS :
  - `SMS_PROVIDER` — "dev" | "twilio" | "vonage" | "brevo"
  - `OTP_TTL_MINUTES` — 10 (par défaut)
  - `OTP_MAX_ATTEMPTS` — 3 (par défaut)
- ✅ Paramètres Twilio, Vonage, Brevo

### 4. **Service SMS** (`app/core/sms_service.py` — NOUVEAU)
- ✅ `send_otp_sms()` — dispatcher selon le provider
- ✅ Support Twilio (recommandé)
- ✅ Support Vonage
- ✅ Support Brevo
- ✅ Mode dev : logs à la place d'envoi réel
- ✅ `mask_phone()` — masquage du téléphone pour affichage sûr

### 5. **Endpoints d'authentification** (`app/api/v1/auth.py`)
- ✅ `POST /api/v1/auth/register` — Étape 1
  - Valide email + phone
  - Génère OTP 6 chiffres
  - Envoie SMS
  - Retourne `phone_masked` + `attempts_remaining`
  
- ✅ `POST /api/v1/auth/verify-otp` — Étape 2 (NOUVEAU)
  - Vérifie le code
  - Crée le compte si valide
  - Retourne JWT token + utilisateur

- ✅ `POST /api/v1/auth/resend-otp` (NOUVEAU)
  - Renvoie le code OTP par SMS

- ℹ️ `POST /api/v1/auth/verify-email` — Legacy (maintenu)

### 6. **Migration Alembic**
- ✅ Fichier : `alembic/versions/a7b3c2d1e4f5_add_phone_and_otp_columns.py`
- Ajoute les colonnes sans casser les comptes existants
- À exécuter : `alembic upgrade head`

---

## 🚀 Déploiement local (dev mode)

### Prérequis
```bash
cd backend
pip install -r requirements.txt
```

### Configuration .env
```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/subserver
ENVIRONMENT=development
SECRET_KEY=change-me-in-production
SMS_PROVIDER=dev  # Mode logs uniquement
```

### Lancer les migrations
```bash
alembic upgrade head
```

### Démarrer l'API
```bash
python -m uvicorn app.main:app --reload
```

### Tester les endpoints
```bash
# Étape 1 : Inscription
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecureP@ss123",
    "first_name": "Jean",
    "phone": "+33612345678"
  }'

# Réponse :
# {
#   "phone_masked": "+33 6**** ****78",
#   "attempts_remaining": 3
# }

# 🚨 VÉRIFIER LES LOGS API pour voir le code OTP !
# [INFO] 📱 [DEV MODE] SMS OTP to +33612345678: 123456

# Étape 2 : Vérification OTP
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+33612345678",
    "otp_code": "123456"
  }'

# Réponse :
# {
#   "access_token": "eyJhbGc...",
#   "token_type": "bearer",
#   "user": {
#     "id": "uuid",
#     "email": "test@example.com",
#     "first_name": "Jean",
#     "phone": "+33612345678",
#     ...
#   }
# }
```

---

## 📱 Configuration SMS en production

### Option 1 : Twilio (Recommandé)

1. Créer un compte sur https://www.twilio.com
2. Vérifier un numéro de téléphone de test
3. Récupérer les credentials :
   - Account SID
   - Auth Token
   - Phone Number (ex: +14155552671)

4. Configurer les variables d'env :
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155552671
```

5. Installer la SDK :
```bash
pip install twilio
```

### Option 2 : Vonage

1. Créer un compte sur https://dashboard.nexmo.com
2. Récupérer l'API Key et API Secret
3. Configurer :
```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=xxxxx
VONAGE_API_SECRET=xxxxx
```

4. Installer :
```bash
pip install vonage
```

### Option 3 : Brevo

1. Créer un compte sur https://www.brevo.com
2. Récupérer l'API Key (SMS)
3. Configurer :
```env
SMS_PROVIDER=brevo
BREVO_API_KEY=xxxxx
```

4. Installer :
```bash
pip install sib-api-v3-sdk
```

---

## 🔒 Sécurité — Checklist

- ✅ Rate limiting : `@limiter.limit("5/hour")` sur `/register`
- ✅ Rate limiting : `@limiter.limit("10/minute")` sur `/verify-otp`
- ✅ Tentatives limitées : max 3 tentatives de code
- ✅ OTP expire après 10 minutes
- ✅ Masquage du phone en réponse pour éviter les fuites
- ✅ Pas de création d'utilisateur avant vérification du code
- ✅ Validation stricte du phone (regex E.164 international)
- ✅ Validation stricte du OTP (6 chiffres uniquement)

À faire en production :
- [ ] Activer HTTPS obligatoire
- [ ] Ajouter CORS strict à la liste des origines frontend
- [ ] Augmenter OTP_TTL_MINUTES à 15-20 min (tolérance réseau)
- [ ] Monitoring des tentatives échouées (alertes à 10+)
- [ ] Audit logs pour les créations de compte

---

## 🐛 Débogage & Logs

Les logs SMS sont toujours écoutés pour déboguer :

```python
import logging
logger = logging.getLogger("app.core.sms_service")
```

En dev mode, le code OTP apparaît dans les logs :
```
📱 [DEV MODE] SMS OTP to +33612345678: 123456
```

En production, remplacez `SMS_PROVIDER=dev` par le vrai provider.

---

## ✅ Checklist avant déploiement

- [ ] Migration Alembic appliquée (`alembic upgrade head`)
- [ ] SMS provider configuré et testé
- [ ] Variables d'env définies sur Render
- [ ] Frontend mis à jour (voir SubServer-frontend)
- [ ] Tests d'intégration passants
- [ ] Rate limiting en place
- [ ] Monitoring/alertes configuré

---

## 📞 Support & Dépannage

### Le SMS ne s'envoie pas
→ Vérifier SMS_PROVIDER dans les logs  
→ Vérifier les credentials du provider  
→ Vérifier que le numéro est au format E.164 (ex: +33612345678)

### Erreur "Trop de tentatives"
→ La limite est OTP_MAX_ATTEMPTS (3)  
→ Utiliser `/resend-otp` pour réinitialiser le compteur

### Code OTP expiré
→ TTL par défaut : 10 minutes  
→ Augmenter OTP_TTL_MINUTES si besoin

---

**Date de création :** Juillet 2026  
**Dernière révision :** Juillet 2026  
**Responsable :** Lead Full-Stack Developer
