# Seeds

Project-wise seed files for TechZunction Central Backend.

## Structure

```
seeds/
├── Shared/              # Shared helpers & global seeds (plans, super admin, platform configs)
├── Settings/            # OrgSettings defaults for all orgs
├── BurgerEmpire/        # F&B Commerce — menu, orders, loyalty, coupons
├── ViCity/              # Hospitality — property types, bookings, reviews
├── PlayFlix/            # OTT — movies, series, co-viewing
├── Aurum/               # FinTech — KYC, bank accounts, transactions, cards, FDs
├── SubRadar/            # SaaS — subscription tracking, alerts, suggestions
├── TechZunction/        # Internal — contact messages
├── GlamourWaves/        # Beauty & Salon — services, bookings
├── SideKaam/            # Part-time jobs marketplace
├── AutoCareHub/         # Car service marketplace
├── BloomBox/            # Flower delivery platform
├── Datrift/             # Cloud data migration SaaS
├── DesignNest/          # Interior design marketplace
├── DineEase/            # Restaurant discovery & ordering
├── EventCraft/          # Event planning marketplace
├── FitZone/             # Fitness platform — gyms, classes, trainers
├── FurnishNow/          # Handcrafted furniture e-commerce
├── LearnProAcademy/     # EdTech SaaS for coaching institutes
├── MediConnect/         # Digital health platform
├── PawPalace/           # All-in-one pet care platform
├── QuickApps/           # Website-to-app converter SaaS
├── StyleVault/          # Indian fashion marketplace
├── Velvet/              # Unisex salon (Gwalior)
└── ZenMat/              # Yoga & wellness platform
```

Each project folder follows the same pattern:

| File               | Purpose                                     |
|--------------------|---------------------------------------------|
| `index.ts`         | Barrel — runs all seeds for that project    |
| `organisation.ts`  | Org creation, settings, base data           |
| `demo.ts`          | Demo users, sample orders/bookings          |
| `menu.ts`          | Catalog items (BurgerEmpire only)           |
| `data.ts`          | Standalone data seed (Aurum banking data)   |

## Usage

```bash
# Seed everything
SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts

# Seed a single project
SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts --aurum

# Seed multiple projects
SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts --burgerempire --vicity

# Only seed org settings
SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts --settings
```

### Available flags

`--burgerempire` `--vicity` `--playflix` `--aurum` `--subradar` `--techzunction` `--glamourwaves` `--sidekaam` `--autocarehub` `--bloombox` `--datrift` `--designnest` `--dineease` `--eventcraft` `--fitzone` `--furnishnow` `--learnproacademy` `--mediconnect` `--pawpalace` `--quickapps` `--stylevault` `--velvet` `--zenmat` `--settings`

> Shared seeds (plans, super admin, platform configs) always run first regardless of flags.
> Settings should run after orgs are created.

## Adding a new project

1. Create `seeds/NewProject/` with `organisation.ts` and `index.ts`
2. Export a `seedNewProjectOrg(prisma, plans, superAdminPassword)` from `index.ts`
3. Import and wire it in `prisma/seed.ts`
4. Add the flag to `PROJECT_FLAGS` array

## Credentials

All generated credentials (admin emails, passwords, storefront keys) are stored in `Backend/seed-credentials.json` (gitignored). Each project's `.env` file contains `NEXT_PUBLIC_TZ_ORG_KEY` for SDK access.

Admin emails follow the pattern: `{slug}@techzunction.com`
