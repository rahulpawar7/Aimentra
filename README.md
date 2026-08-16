# Aimentra — AI-Powered Learning Platform

Monorepo layout:

- `frontend/` — Next.js 16 + React + TypeScript + Tailwind + TanStack Query
- `backend/` — Node.js + Express + TypeScript + MongoDB

## Quick start

```bash
# Backend
cd backend
cp .env.example .env   # fill MongoDB + secrets
npm install
npm run seed
npm run dev            # http://localhost:5000

# Frontend
cd frontend
# set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 in .env.local
npm install
npm run dev            # http://localhost:3000
```

Seed admin: `admin@aimentra.com` / `Admin@123`

Demo student: `student1@demo.aimentra.com` / `Student@123`

If login fails after a rebrand, run `npm run seed:accounts` in `backend/` to refresh dev credentials.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 1 Foundations | Done | Auth JWT+refresh cookie, sessions, RBAC, models, rate limits, mongo-sanitize, admin audience |
| 2 Public site & CMS | Mostly done | CMS API + home fetches plans/courses/testimonials/CMS; some marketing sections still have fallbacks |
| 3 Payments | Done | Razorpay create/verify/webhook + mock test mode, coupons, entitlement grant |
| 4 Courses & progress | Done | Curriculum entitlement gating, continue/completed split, mark course complete |
| 5 Video security | Done (deterrent stack) | Signed stream tokens, HLS proxy stubs, AES key endpoint, ffmpeg worker, SecureVideoPlayer (watermark + DevTools deterrent) |
| 6 Admin panel | Partial | Users/plans/courses + orders/refunds/coupons/CMS/analytics/audit APIs; some admin UI pages still thin |
| 7 Polish | Partial | SEO meta on home/checkout, email service hooks, cron expiry, .env.example; deploy/Sentry/load-test remaining |

## Honest video security note

Studio DRM (Widevine/FairPlay) is paid. This stack uses free deterrents: no direct file URLs, short-lived signed HLS tokens, AES-128 when ffmpeg has processed assets, watermark, DevTools pause overlay. Screen recording / phone cameras cannot be stopped without hardware DRM.

## Key API prefixes

- `/api/v1/auth` — signup/login/refresh/forgot/reset/verify
- `/api/v1/plans`, `/api/v1/courses`, `/api/v1/cms`
- `/api/v1/orders` — create, verify, webhook, apply-coupon
- `/api/v1/progress` — my-courses, continue-learning, completed, mark complete
- `/api/v1/stream` — token, manifest, segment, key
- `/api/v1/admin/*` — back office

## What's left (highest value)

1. Wire remaining admin UI pages (CMS editor, coupons, analytics charts) to new APIs
2. Run ffmpeg worker on upload in production storage (B2/R2)
3. Legal/About/Contact CMS pages on frontend
4. Access token memory-only (drop localStorage) once refresh-cookie flow is rock solid
5. Deploy to free-tier hosts + Sentry + robots/sitemap
