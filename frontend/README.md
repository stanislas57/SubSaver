# SubSaver

Application de gestion d'abonnements (mode famille, comparateur d'offres, connexion bancaire simulée).

- **Frontend** : React 19 + Vite + TypeScript + Tailwind + React Query - `subsaver/`
- **Backend** : FastAPI + SQLAlchemy + Alembic + PostgreSQL - `subsaver-backend/`

---

## Prérequis

- Node.js ≥ 20
- Python ≥ 3.11
- PostgreSQL ≥ 14 (local ou Docker)

---

## 1. Base de données

```bash
# Installer PostgreSQL localement (Ubuntu/Debian), ou lancer un conteneur :
docker run --name subsaver-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=subsaver -p 5432:5432 -d postgres:16

# Si install locale (sans Docker) :
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE subsaver;"
```

---

## 2. Backend (FastAPI)

```bash
cd subsaver-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Édite .env si besoin (DATABASE_URL, SECRET_KEY, CORS_ORIGINS)

alembic upgrade head        # applique les migrations
uvicorn app.main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`, documentation interactive sur `http://localhost:8000/docs`.

**Variables d'environnement** (`subsaver-backend/.env.example`) :

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql+psycopg2://postgres:postgres@localhost:5432/subsaver` |
| `SECRET_KEY` | Clé de signature JWT - **à changer en production** | `change-me-in-production` |
| `ALGORITHM` | Algorithme JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité du token | `10080` (7 jours) |
| `CORS_ORIGINS` | Origines autorisées (JSON list) | `["http://localhost:5173"]` |

---

## 3. Frontend (Vite + React)

```bash
cd subsaver
npm install
cp .env.example .env
# Édite .env si l'API tourne ailleurs qu'en localhost:8000

npm run dev      # développement, http://localhost:5173
npm run build    # build de production -> dist/
npm run preview  # sert le build de production localement
```

**Variables d'environnement** (`subsaver/.env.example`) :

| Variable | Description | Défaut |
|---|---|---|
| `VITE_API_BASE_URL` | URL de base de l'API backend | `http://localhost:8000/api/v1` |
| `VITE_STRIPE_BILLING_URL` | Lien du portail de facturation Stripe | lien de test |

---

## 4. Lancer l'ensemble (DB + backend + frontend)

Trois terminaux :

```bash
# Terminal 1 - base de données (si non déjà lancée en service/Docker)
sudo service postgresql start

# Terminal 2 - backend
cd subsaver-backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 3 - frontend
cd subsaver && npm run dev
```

Ouvre `http://localhost:5173`, crée un compte via `/register`, puis utilise l'application normalement.

---

## Structure du projet

```
subsaver/                          # Frontend
├── .env.example
├── index.html
├── package.json
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── src/
    ├── main.tsx, App.tsx, index.css, types.ts, vite-env.d.ts
    ├── api/            axiosClient.ts, config.ts
    ├── services/       authService, userService, subscriptionService,
    │                   bankService, marketService, familyService
    ├── hooks/          useSubscriptions, useBank, useProfile, useMarket, useFamily
    ├── contexts/       AuthContext.tsx
    ├── routes/         ProtectedRoute.tsx
    ├── layouts/        AppLayout.tsx, AuthLayout.tsx
    ├── lib/            format.ts, utils.ts, cancellationLetter.ts
    ├── pages/          Dashboard, Subscriptions, SubscriptionAdd, Analytics,
    │                   Calendar, Lab(+Comparator/Cancellation), Premium,
    │                   Profile, Login, Register, NotFound
    └── components/
        ├── ui/         primitives (button, card, dialog, input, select, tabs…)
        ├── shared/      StatCard, EmptyState, NotificationCenter, ThemeToggle…
        ├── auth/        LoginForm, RegisterForm
        ├── subscriptions/  SubscriptionForm, SubscriptionList, SubscriptionListItem
        ├── bank/        BankGrid
        ├── calendar/    CalendarGrid
        ├── analytics/   ChartCard
        ├── lab/         ComparatorOfferCard
        ├── family/      FamilyTabs, FamilyModal, FamilyMemberRow, FamilyBalanceCard
        ├── profile/     ProfileForm
        └── layout/      Sidebar, Topbar, NavLink

subsaver-backend/                  # Backend
├── .env.example
├── requirements.txt
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/9109338c326b_initial_schema.py
└── app/
    ├── main.py                     point d'entrée FastAPI
    ├── schemas.py                  schémas Pydantic (miroir de src/types.ts)
    ├── core/        config.py (Settings), security.py (JWT, hash)
    ├── db/          session.py (engine, Base, get_db)
    ├── models/      user.py, subscription.py, family_member.py
    └── api/
        ├── deps.py                 get_current_user
        └── v1/      router.py + auth, users, subscriptions, bank, market, family
```

---

## Notes

- Les endpoints `bank/providers` et `market/offers` renvoient actuellement un catalogue statique de démonstration (pas d'intégration bancaire/partenaire réelle branchée).
- Migrations : toute évolution de modèle passe par `alembic revision --autogenerate -m "message"` puis `alembic upgrade head`.
- Le token JWT est stocké côté frontend dans `localStorage` (clé `subsaver_token`).
