> This project is made with the help of Claude (1M context).

# Backend

Enterprise multi-tenant commerce platform — a unified backend for e-commerce, food delivery, rentals, streaming, POS, marketplace, loyalty, billing, and analytics.

## Overview

A NestJS-based REST + WebSocket backend with 60+ feature modules, multi-tenant organization isolation, real-time notifications, payment processing, scheduled jobs, and comprehensive admin tooling. Powers diverse business models from a single codebase.

## Features

### Core Infrastructure
- Multi-tenant architecture (organizations, settings, RBAC)
- JWT auth + Passport OAuth (Google, GitHub, Facebook)
- WebSocket gateway with Socket.io and Ably pub/sub
- Background workers (email, notifications, webhooks, campaigns)
- Scheduled cron jobs (cleanup, aggregation, plan expiry)

### Commerce
- Catalog, cart, orders, inventory, suppliers, purchase orders
- Razorpay integration (payments, billing, subscriptions, refunds)
- Loyalty programs, coupons, referrals, gift cards
- Delivery tracking, property reservations, vacation rentals

### Verticals
- Food service: meal plans, subscriptions, POS
- Media: movies, watch sessions, streaming analytics
- Analytics: usage tracking, campaigns, segments
- Compliance: audit logs, KYC, super-admin controls

## Tech Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL via Prisma 6.19
- **Realtime:** Socket.io 4.8, Ably 2.20
- **Payments:** Razorpay 2.9
- **Email:** Resend 6.10
- **Auth:** JWT + Passport.js (Google/GitHub/Facebook)
- **Testing:** Jest
- **Deploy:** Docker + Vercel

## Getting Started

```bash
npm install
cp .env.example .env
docker-compose up -d         # PostgreSQL
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

## Scripts

- `npm run start:dev` — dev server with hot reload
- `npm run build` — production build
- `npm run start:prod` — start production server
- `npm run test` — run Jest tests
- `npm run test:e2e` — end-to-end tests
- `npx prisma migrate dev` — apply migrations
- `npx prisma studio` — DB GUI

## Project Structure

```
src/
├── modules/      # 60+ feature modules (auth, catalog, payments, billing, ...)
├── workers/      # Background processors
├── jobs/         # Scheduled crons
├── gateways/     # WebSocket gateways
└── main.ts       # App bootstrap

prisma/
├── schema.prisma # Full data model (~184KB)
├── migrations/   # 28+ migration files
└── seed.ts       # Seed data
```
