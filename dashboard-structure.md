# Dashboard Structure

## Sidebar (Menu latéral gauche)

```
SubSaver [Logo]
├── Tableau de bord (active)
├── Abonnements
├── Analytique
├── Calendrier
├── Premium
└── [Profil utilisateur]
    ├── mama (logged in)
    └── Déconnexion
```

---

## Main Content Area (Tableau de bord)

### Page Header
- **Title**: "Tableau de bord"
- **Language**: Français (changeable via dropdown)
- **Notifications**: Bell icon
- **Theme toggle**: Dark/Light mode
- **User avatar**: Profile shortcut

---

## Dashboard Sections

### 1. Stats Cards Row (Statistiques)
Affichée en grille responsive (4 colonnes sur desktop)

| Card | Value | Icon/Style |
|------|-------|-----------|
| **Dépense mensuelle** | 23,02 € | Budget icon |
| **Abonnements actifs** | 3 | List icon |
| **Essais qui se terminent** | 0 | Warning icon (red) |
| **Statut** | Gratuit | Crown icon |

---

### 2. Derniers abonnements (Section)

**Header**: 
- Title: "Derniers abonnements"
- Link: "Voir tout" (top-right)

**List Items** (carte/row par abonnement):

```
[Avatar] AMAZON PRIME
         Autre | Utile | Le 1 du mois
                                    6,99 €

[Avatar] DEEZERR DEEZER
         Autre | Utile | Le 12 du mois
                                    5,99 €

[Avatar] LIDL
         Autre | Utile | Le 11 du mois
                                   10,04 €
```

**Champ par item**:
- Avatar (first letter / brand logo)
- Name (subscription name)
- Category badge: "Autre" (tag gris)
- Status badge: "Utile" (tag bleu)
- Renewal date: "Le X du mois"
- Price: right-aligned, bold

---

## Responsive Behavior
- **Desktop (1280px+)**: Sidebar fixed, main content full-width
- **Tablet (768px-1279px)**: Sidebar collapsible, stats 2-3 columns
- **Mobile (<768px)**: Sidebar drawer/hamburger, stats stacked 1 column

---

## Notes
- Stats cards seem to have a tilt/3D effect (TiltCard component from Phase D)
- Each subscription item may be clickable (navigate to detail/edit)
- Empty state or loading states not shown in current screenshot
