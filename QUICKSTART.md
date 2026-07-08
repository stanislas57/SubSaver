# 🚀 QuickStart — SMS OTP SubServer

## ⚡ Lancer le projet en 5 minutes

### Prérequis
- Docker Desktop (ou PostgreSQL 15)
- Node.js 18+
- Python 3.9+
- Git

---

## 📦 Installation

### 1. Cloner et installer dépendances

```bash
# Frontend
cd frontend  # ou simplement src selon votre structure
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

### 2. Base de données (PostgreSQL)

**Option A : Docker** (rapide)
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# Créer la base de données
docker exec postgres psql -U postgres -c "CREATE DATABASE subserver;"
```

**Option B : PostgreSQL local** (déjà installé)
```bash
createdb -U postgres subserver
```

### 3. Configuration variables d'environnement

Backend (`.env`):
```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/subserver
ENVIRONMENT=development
SECRET_KEY=test-secret-key-for-development-only
CORS_ORIGINS=["http://localhost:5173"]
SMS_PROVIDER=dev
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

Frontend (`.env`):
```env
VITE_API_URL=http://localhost:8000
```

### 4. Appliquer les migrations

```bash
cd backend
alembic upgrade head
```

---

## 🎯 Lancer le projet

### Terminal 1 : Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
# → Backend sur http://localhost:8000
```

### Terminal 2 : Frontend
```bash
cd frontend  # ou src
npm run dev
# → Frontend sur http://localhost:5173
```

### Terminal 3 : Regarder les logs (optionnel)
```bash
# Pour voir les codes OTP en dev mode
tail -f backend.log
```

---

## ✅ Tester le flux complet

### Option 1 : Via l'interface web (E2E)

1. Ouvrir http://localhost:5173/register
2. Remplir le formulaire :
   - Prénom: `Jean`
   - Email: `test@example.com`
   - Téléphone: `+33612345678`
   - Mot de passe: `SecureP@ss123`
3. Click "Continuer"
4. Chercher le code OTP dans les logs backend
   ```
   📱 [DEV MODE] SMS OTP to +33612345678: 123456
   ```
5. Entrer le code et click "Vérifier"
6. ✅ Redirigé vers `/dashboard`

### Option 2 : Via API (cURL)

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

# 🔍 Récupérer le code OTP depuis les logs

# Étape 2 : Vérification
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+33612345678",
    "otp_code": "123456"
  }'
```

### Option 3 : Script automatisé

```bash
chmod +x test_otp_api.sh
./test_otp_api.sh
# Suivre les instructions interactives
```

---

## 📱 Tester sur mobile

```bash
# Dans le terminal frontend
npm run dev -- --host

# Accéder depuis votre téléphone
http://<IP_DE_VOTRE_ORDINATEUR>:5173

# Ex: http://192.168.1.100:5173
```

---

## 🔍 Débogage

### Logs backend
```bash
# Terminal backend doit afficher :
[INFO] 📱 [DEV MODE] SMS OTP to +33612345678: 123456
[INFO] User verified: test@example.com
```

### Logs frontend (Console du navigateur)
```javascript
// Ouvrir DevTools (F12)
// Console tab

// Vérifier le token
localStorage.getItem('token')

// Vérifier les appels API
// Network tab → filtrer par /auth
```

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| `Connection refused` (PostgreSQL) | Démarrer Docker ou PostgreSQL |
| `CORS error` | Vérifier CORS_ORIGINS dans .env backend |
| `OTP code not found in logs` | S'assurer que SMS_PROVIDER=dev |
| `Module not found` | `pip install -r requirements.txt` ou `npm install` |
| `Port 5173/8000 already in use` | Changer port ou tuer le processus |

---

## 📊 Vérifier l'état du système

```bash
# Base de données
psql -U postgres -d subserver -c "SELECT COUNT(*) FROM users;"

# Tables créées
psql -U postgres -d subserver -c "\dt"

# Vérifier le schéma User
psql -U postgres -d subserver -c "DESCRIBE users;" # ou \d users

# Vérifier les migrations appliquées
psql -U postgres -d subserver -c "SELECT * FROM alembic_version;"
```

---

## 🎨 Tester les thèmes

Frontend supporte light/dark mode:

```javascript
// Dans la console du navigateur
localStorage.setItem('theme', 'dark')  // Basculer dark
localStorage.setItem('theme', 'light') // Basculer light
```

---

## 📚 Documentation complète

- **Frontend OTP Architecture:** `OTP_ARCHITECTURE.md`
- **Backend Implementation:** `backend/SMS_OTP_IMPLEMENTATION.md`
- **Plan de test:** `TEST_PLAN.md`
- **Architecture générale:** Voir README.md principal

---

## 🚀 Déploiement (production)

### Checklist avant production

- [ ] SMS_PROVIDER configuré (`twilio`, `vonage`, ou `brevo`)
- [ ] Credentials SMS configurés (clés API, tokens)
- [ ] DATABASE_URL pointant vers une vraie base de données
- [ ] SECRET_KEY générée (min 32 caractères)
- [ ] ENVIRONMENT=production
- [ ] CORS_ORIGINS contient votre domaine
- [ ] HTTPS activé
- [ ] Monitoring/alertes configurés

### Configurer SMS réel

```env
# .env production
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155552671
```

---

## ✨ Résumé

| Composant | URL | Commande |
|-----------|-----|----------|
| Frontend | http://localhost:5173 | `npm run dev` |
| Backend API | http://localhost:8000 | `uvicorn app.main:app --reload` |
| API Docs | http://localhost:8000/docs | Auto (Swagger) |
| PostgreSQL | localhost:5432 | Docker ou local |

---

**Durée estimée:** 5-10 minutes  
**Problèmes?** Vérifier les logs et QUICKSTART.md  
**Questions?** Lire OTP_ARCHITECTURE.md et SMS_OTP_IMPLEMENTATION.md
