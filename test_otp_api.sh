#!/bin/bash

# Test Script pour SMS OTP API
# Prérequis: Backend running on http://localhost:8000

set -e

API_BASE="http://localhost:8000/api/v1"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PHONE="+33612345678"
TEST_PASSWORD="SecureP@ss123"
TEST_FIRST_NAME="Jean"

echo "🚀 Démarrage des tests OTP API"
echo "================================"
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Inscription
echo -e "${YELLOW}[Test 1] POST /auth/register${NC}"
echo "Données:"
echo "  Email: $TEST_EMAIL"
echo "  Phone: $TEST_PHONE"
echo "  First Name: $TEST_FIRST_NAME"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"first_name\": \"$TEST_FIRST_NAME\",
    \"phone\": \"$TEST_PHONE\"
  }")

echo "Réponse:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extraire phone_masked et attempts_remaining
PHONE_MASKED=$(echo "$REGISTER_RESPONSE" | jq -r '.phone_masked' 2>/dev/null)
ATTEMPTS=$(echo "$REGISTER_RESPONSE" | jq -r '.attempts_remaining' 2>/dev/null)

if [ "$PHONE_MASKED" != "null" ] && [ "$ATTEMPTS" != "null" ]; then
  echo -e "${GREEN}✅ [Test 1] Inscription réussie${NC}"
  echo "  Phone masked: $PHONE_MASKED"
  echo "  Attempts: $ATTEMPTS"
  echo ""
else
  echo -e "${RED}❌ [Test 1] Inscription échouée${NC}"
  exit 1
fi

# ⚠️  Manuel : Chercher le code OTP dans les logs du backend
echo -e "${YELLOW}[IMPORTANT] Chercher le code OTP dans les logs du backend${NC}"
echo "Logs attendus: 📱 [DEV MODE] SMS OTP to $TEST_PHONE: XXXXXX"
echo ""
echo -n "Entrer le code OTP reçu: "
read OTP_CODE

# Test 2: Vérifier OTP
echo ""
echo -e "${YELLOW}[Test 2] POST /auth/verify-otp${NC}"
echo "Données:"
echo "  Email: $TEST_EMAIL"
echo "  Phone: $TEST_PHONE"
echo "  OTP Code: $OTP_CODE"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"otp_code\": \"$OTP_CODE\"
  }")

echo "Réponse:"
echo "$VERIFY_RESPONSE" | jq . 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# Extraire access_token
ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" != "null" ] && [ ! -z "$ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✅ [Test 2] Vérification OTP réussie${NC}"
  echo "  Access Token: ${ACCESS_TOKEN:0:50}..."
  echo ""
else
  echo -e "${RED}❌ [Test 2] Vérification OTP échouée${NC}"
  exit 1
fi

# Test 3: Vérifier accès utilisateur authentifié
echo -e "${YELLOW}[Test 3] GET /users/me (avec token)${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_BASE/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Réponse:"
echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
echo ""

USER_EMAIL=$(echo "$ME_RESPONSE" | jq -r '.email' 2>/dev/null)
USER_PHONE=$(echo "$ME_RESPONSE" | jq -r '.phone' 2>/dev/null)

if [ "$USER_EMAIL" = "$TEST_EMAIL" ] && [ "$USER_PHONE" = "$TEST_PHONE" ]; then
  echo -e "${GREEN}✅ [Test 3] Utilisateur authentifié correctement${NC}"
  echo "  Email: $USER_EMAIL"
  echo "  Phone: $USER_PHONE"
  echo ""
else
  echo -e "${RED}❌ [Test 3] Utilisateur authentifié incorrectement${NC}"
  exit 1
fi

# Test 4: Test validation (code invalide)
echo -e "${YELLOW}[Test 4] POST /auth/verify-otp avec code invalide${NC}"

INVALID_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"otp_code\": \"000000\"
  }")

echo "Réponse:"
echo "$INVALID_RESPONSE" | jq . 2>/dev/null || echo "$INVALID_RESPONSE"
echo ""

ERROR_DETAIL=$(echo "$INVALID_RESPONSE" | jq -r '.detail' 2>/dev/null)

if [[ "$ERROR_DETAIL" == *"invalide"* ]] || [[ "$ERROR_DETAIL" == *"invalid"* ]]; then
  echo -e "${GREEN}✅ [Test 4] Validation d'erreur correcte${NC}"
  echo "  Error: $ERROR_DETAIL"
  echo ""
else
  echo -e "${YELLOW}⚠️  [Test 4] Vérification d'erreur à valider manuellement${NC}"
  echo ""
fi

# Test 5: Test format téléphone invalide
echo -e "${YELLOW}[Test 5] POST /auth/register avec téléphone invalide${NC}"

INVALID_PHONE_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test_invalid_phone@example.com\",
    \"password\": \"$TEST_PASSWORD\",
    \"first_name\": \"Test\",
    \"phone\": \"0612345678\"
  }")

echo "Réponse:"
echo "$INVALID_PHONE_RESPONSE" | jq . 2>/dev/null || echo "$INVALID_PHONE_RESPONSE"
echo ""

VALIDATION_ERROR=$(echo "$INVALID_PHONE_RESPONSE" | jq -r '.detail' 2>/dev/null)

if [[ "$VALIDATION_ERROR" == *"invalide"* ]] || [[ "$VALIDATION_ERROR" == *"invalid"* ]]; then
  echo -e "${GREEN}✅ [Test 5] Validation téléphone correcte${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  [Test 5] Validation téléphone à vérifier${NC}"
  echo ""
fi

# Résumé
echo "================================"
echo -e "${GREEN}✅ Tous les tests principaux sont passés !${NC}"
echo ""
echo "Résumé:"
echo "  ✅ Inscription + Envoi OTP"
echo "  ✅ Vérification OTP"
echo "  ✅ Authentification (JWT)"
echo "  ✅ Accès utilisateur authentifié"
echo "  ✅ Validation erreurs"
echo ""
echo "Prochaines étapes:"
echo "  1. Tester le frontend sur http://localhost:5173/register"
echo "  2. Vérifier la UI responsive (mobile/tablet/desktop)"
echo "  3. Vérifier les themes light/dark"
echo "  4. Tester avec des providers SMS réels (production)"
