# Plan de test OTP — SubServer

## 🎯 Objectif
Valider le flux complet d'inscription + vérification OTP (front + back)

---

## 📋 Environnement de test

### Configuration locale
```env
# Backend
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/subserver
ENVIRONMENT=development
SMS_PROVIDER=dev  # Mode logs
SECRET_KEY=test-secret-key-for-development
CORS_ORIGINS=["http://localhost:5173"]

# Frontend (déjà configuré)
VITE_API_URL=http://localhost:8000
```

### Services à lancer
```bash
# Terminal 1 : Backend
cd backend
alembic upgrade head  # Appliquer les migrations
python -m uvicorn app.main:app --reload

# Terminal 2 : Frontend
cd src
npm install
npm run dev

# Terminal 3 : Base de données (optionnel si déjà running)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
```

---

## ✅ Scénario de test 1 : Inscription valide

### Prérequis
- Backend actif sur `http://localhost:8000`
- Frontend actif sur `http://localhost:5173`
- Base de données accessible

### Étapes

#### 1️⃣ Accéder à la page d'inscription
```
Action: Ouvrir http://localhost:5173/register
Attendre: Formulaire avec champs (Prénom, Email, Téléphone, Mot de passe)
Vérifier:
  ✅ Le formulaire s'affiche
  ✅ Le champ "Téléphone" est visible
  ✅ Texte "format international" présent
```

#### 2️⃣ Remplir le formulaire avec données valides
```
Prénom: Jean
Email: test@example.com
Téléphone: +33612345678
Mot de passe: SecureP@ss123

Attendre: Validation côté front
Vérifier:
  ✅ Pas d'erreur de validation
  ✅ Format téléphone accepté (commence par +33)
  ✅ Bouton "Continuer" activé
```

#### 3️⃣ Cliquer sur "Continuer"
```
Action: Click bouton "Continuer"
Attendre: Transition vers écran de vérification OTP

Logs API attendus:
  [INFO] 📱 [DEV MODE] SMS OTP to +33612345678: 123456

Vérifier:
  ✅ Page change vers "Vérifier votre téléphone"
  ✅ Affiche: "+33 6**** ****78"
  ✅ Champ d'input pour code à 6 chiffres
```

#### 4️⃣ Saisir le code OTP
```
Action: Chercher le code dans les logs API
         Copier le code (ex: 123456)
         Entrer dans le champ OTP

Attendre: Validation du code

Vérifier:
  ✅ Le champ accepte les 6 chiffres
  ✅ Bouton "Vérifier" devient actif
```

#### 5️⃣ Cliquer sur "Vérifier"
```
Action: Click bouton "Vérifier"
Attendre: ~1-2 secondes (appel API)

Logs API attendus:
  [INFO] User verified: test@example.com
  [INFO] JWT token created

Vérifier:
  ✅ Redirection vers /dashboard (utilisateur authentifié)
  ✅ Token JWT stocké en localStorage
  ✅ Utilisateur affiché dans le header
```

---

## ❌ Scénario de test 2 : Validation du téléphone (format invalide)

### Cas d'erreur
```
Téléphone invalide: "0612345678"  (format France sans +)
Téléphone invalide: "+33-612-345-678"  (avec tirets)
Téléphone invalide: "+336123456"  (trop court)

Attendre: Message d'erreur côté front
Vérifier:
  ✅ "Format international requis (ex: +33612345678)"
  ✅ Bouton "Continuer" désactivé
  ✅ Aucun appel API n'est fait
```

---

## ❌ Scénario de test 3 : OTP invalide

### Étapes
```
1. Compléter l'inscription (scénario 1, étapes 1-3)
2. Saisir un mauvais code (ex: 000000 au lieu de 123456)
3. Click "Vérifier"

Attendre: Erreur API
Vérifier:
  ✅ Message: "Code OTP invalide. 2 tentatives restantes."
  ✅ Compteur d'tentatives décrémenté
  ✅ Utilisateur peut réessayer
```

---

## ❌ Scénario de test 4 : Trop de tentatives

### Étapes
```
1. Compléter l'inscription
2. Saisir 3 mauvais codes consécutifs (ex: 000000)
3. À la 3e tentative échouée

Attendre: Erreur de lockout
Vérifier:
  ✅ Message: "Trop de tentatives échouées. Demande un nouveau code."
  ✅ Bouton "Vérifier" désactivé ou masqué
  ✅ Lien "Renvoyer le code" affiche un message de succès
```

---

## ⏰ Scénario de test 5 : Code expiré

### Étapes (simulation)
```
1. Compléter l'inscription (obtenir un code OTP)
2. Attendre 10+ minutes (durée de vie OTP)
3. Saisir le code et cliquer "Vérifier"

Attendre: Erreur d'expiration
Vérifier:
  ✅ Message: "Code expiré. Demande un nouveau code."
  ✅ Lien "Renvoyer le code" fonctionne
```

---

## 🔄 Scénario de test 6 : Renvoyer le code OTP

### Étapes
```
1. Compléter l'inscription
2. Click "Vous n'avez pas reçu le code ? Renvoyer"

Attendre: 2-3 secondes (appel API /resend-otp)

Logs API attendus:
  [INFO] 📱 [DEV MODE] SMS OTP to +33612345678: 789456
  (nouveau code généré, ancien invalidé)

Vérifier:
  ✅ Nouveau code dans les logs
  ✅ Compteur d'tentatives réinitialisé (3)
  ✅ Utilisateur peut entrer le nouveau code
```

---

## 🚫 Scénario de test 7 : Erreurs de validation back-end

### Cas d'erreur
```
Email existant:
  Action: S'inscrire 2x avec le même email
  Attendre: "Un compte existe déjà avec cet email."
  Vérifier: ✅ Code 400 + message clair

Téléphone existant:
  Action: S'inscrire 2x avec le même téléphone
  Attendre: "Un compte existe déjà avec ce téléphone."
  Vérifier: ✅ Code 400 + message clair

Données invalides (back-end):
  Mot de passe < 8 caractères
  Email invalide (ex: "notanemail")
  Téléphone format invalide côté API
  
  Vérifier: ✅ Erreurs visibles côté front
```

---

## 🧪 Tests API directs (Postman/cURL)

### Test 1 : POST /api/v1/auth/register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "SecureP@ss123",
    "first_name": "API Test",
    "phone": "+33612345678"
  }'

Attendre:
  Status: 201 Created
  Body:
  {
    "phone_masked": "+33 6**** ****78",
    "attempts_remaining": 3
  }
```

### Test 2 : POST /api/v1/auth/verify-otp
```bash
# Récupérer le code depuis les logs API

curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "phone": "+33612345678",
    "otp_code": "123456"
  }'

Attendre:
  Status: 200 OK
  Body:
  {
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "apitest@example.com",
      "first_name": "API Test",
      "phone": "+33612345678",
      "is_premium": false,
      "bank_connected": false,
      ...
    }
  }
```

### Test 3 : POST /api/v1/auth/verify-otp (code invalide)
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "phone": "+33612345678",
    "otp_code": "000000"
  }'

Attendre:
  Status: 400 Bad Request
  Body:
  {
    "detail": "Code OTP invalide. 2 tentatives restantes."
  }
```

### Test 4 : POST /api/v1/auth/resend-otp
```bash
curl -X POST http://localhost:8000/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com"
  }'

Attendre:
  Status: 200 OK
  Body:
  {
    "message": "Si un compte existe avec cet email, un code a été envoyé."
  }

Logs API:
  [INFO] 📱 [DEV MODE] SMS OTP to +33612345678: NOUVEAU_CODE
```

---

## 🔄 Tests de flux (E2E)

### Test 1 : Flux complet inscription → vérification → login
```
1. ✅ S'inscrire sur /register
2. ✅ Vérifier OTP sur /register?step=verify
3. ✅ Redirigé vers /dashboard
4. ✅ Vérifier que le token JWT est persisté
5. ✅ Rafraîchir la page → rester connecté
6. ✅ Logout → revenir à /login
7. ✅ Login avec email/password → accès au dashboard
```

### Test 2 : UI responsivité (mobile)
```
Viewport: 375x812 (iPhone SE)

Vérifier:
  ✅ Formulaire s'affiche correctement
  ✅ Champs s'empilent verticalement
  ✅ Boutons sont cliquables (taille >= 48px)
  ✅ Messages d'erreur lisibles
  ✅ Écran OTP adapté au mobile
```

### Test 3 : Thème (light/dark mode)
```
Vérifier que le formulaire :
  ✅ Utilise les variables CSS globales
  ✅ Change de couleurs en dark mode
  ✅ Respect le contraste AA (WCAG)
  ✅ Inputs sont visibles dans les deux thèmes
```

---

## 📊 Métriques de succès

| Métrique | Seuil | Status |
|----------|-------|--------|
| Temps inscription → vérification | < 5s | ⏱️ |
| Temps vérification OTP → login | < 2s | ⏱️ |
| Taux d'erreur API | 0% | ✅/❌ |
| Code OTP s'affiche en logs (dev) | 100% | ✅/❌ |
| Validation front-end | 100% | ✅/❌ |
| Validation back-end | 100% | ✅/❌ |
| Rate limiting appliqué | ✅ | ✅/❌ |
| Token JWT stocké | ✅ | ✅/❌ |

---

## 🐛 Bugs à surveiller

- [ ] Phone field masqué/non visible
- [ ] Validation regex phone trop stricte/laxe
- [ ] OTP code ne s'affiche pas en logs
- [ ] Transition écran pas smooth
- [ ] Erreurs API non affichées côté front
- [ ] Token JWT pas persisté après fermeture tab
- [ ] SMS rate limiting pas appliqué
- [ ] Ancien système email toujours actif

---

## ✅ Checklist avant déploiement

- [ ] Tous les scénarios de test passent
- [ ] Pas d'erreurs en console (front + back)
- [ ] Logs API clairs et informatifs
- [ ] UI responsive (mobile/tablet/desktop)
- [ ] Thème light/dark respecté
- [ ] Sécurité validée (rate limiting, validation)
- [ ] Performance acceptable (< 2s par action)
- [ ] Base de données clean (migration OK)
- [ ] Configuration SMS dev mode en place
- [ ] Documentation mise à jour

---

**Date:** Juillet 2026  
**Responsable:** Lead Full-Stack Developer  
**Durée estimée:** 30-45 minutes
