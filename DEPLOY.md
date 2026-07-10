# MkulimaLink Deployment Guide

This document explains how to deploy the MkulimaLink platform to production.

## Prerequisites

- Node.js >= 20
- MongoDB Atlas cluster or self-managed MongoDB
- Redis instance (Upstash, Redis Cloud, or self-managed)
- Railway/Vercel/Netlify accounts
- Domain name (optional but recommended)

## 1. Environment Variables

Copy `.env.production.example` to `.env.production` and fill in real values:

```bash
cp .env.production.example .env.production
```

Required minimum variables:
- `NODE_ENV=production`
- `PORT=5000`
- `FRONTEND_URL` (your frontend URL)
- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET` (long random string)
- `CORS_ORIGINS` (comma-separated allowed frontend origins)
- `WEBHOOK_SECRET` (for payment callbacks)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (generate with `npx web-push generate-vapid-keys`)
- `SEED_ON_START=false` (set to `true` only for first deployment)

## 2. Backend Deployment (Railway)

1. Create a new project on Railway.
2. Add a service from your GitHub repository.
3. Set environment variables from `.env.production`.
4. Railway will use the existing `Procfile`:
   ```
   web: cd backend && node server.js
   ```
5. Add MongoDB and Redis services (or use external providers).
6. Deploy.

Verify the backend health endpoint after deployment:
```bash
curl https://your-railway-url/api/health
```

## 3. Frontend Deployment (Vercel)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. From the project root, run:
   ```bash
   vercel --prod
   ```
3. Vercel will use the existing `vercel.json` configuration.
4. Set environment variables in the Vercel dashboard if needed (e.g., `VITE_VAPID_PUBLIC_KEY`).

Alternatively, deploy to Netlify:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=frontend/dist
```

## 4. Database Seeding

For the first deployment only, run the seed endpoint:
```bash
curl -X POST https://your-railway-url/api/seed/run \
  -H "Content-Type: application/json" \
  -d '{"secret": "mkulima-seed-2024"}'
```

After seeding, set `SEED_ON_START=false`.

## 5. Mobile App Configuration

Update the mobile app API URL in `mobile/MkulimaLink/src/config/env.ts` or via build config:
```typescript
export const API_BASE_URL = 'https://your-railway-url/api';
```

Build and test the mobile app:
```bash
cd mobile/MkulimaLink
npx react-native run-android
# or
npx react-native run-ios
```

## 6. Smoke Tests

Run the backend test suite locally before each release:
```bash
cd backend
npm test
```

For live production smoke tests:
```bash
curl https://your-railway-url/api/health
```

## 7. Post-Deployment Checklist

- [ ] `/api/health` returns OK
- [ ] Auth register/login works
- [ ] Product listing and creation works
- [ ] Auctions endpoint returns data
- [ ] Exchange rates endpoint returns currencies
- [ ] Mobile app can connect and authenticate
- [ ] Push notification subscription works (if VAPID keys are set)
