# MkulimaLink Railway and Vercel Deployment

## Live targets

- Backend: `https://web-production-04667.up.railway.app`
- Frontend: `https://mkulima-link.vercel.app`
- Railway service: `mkulimalink`

## Backend environment

Required Railway variables:

- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: long random secret. Rotate after any accidental exposure.
- `NODE_ENV`: `production`.
- `FRONTEND_URL`: production frontend origin.

Optional Railway variables:

- `REDIS_URL`: enables Redis-backed cache middleware. Leave unset until Redis is provisioned.
- `SEED_SECRET`: temporary seed endpoint secret. Disable or rotate after seeding.
- `LISTING_EXPIRY_DAYS`: listing lifetime before active products expire. Defaults to `45`.
- `SENTRY_DSN`: enables Sentry reporting.
- `COMMISSION_RATE`: marketplace commission decimal. Defaults to `0.05`.

## Backend deploy

```powershell
railway link
railway service mkulimalink
railway up --detach
railway status
```

Health checks:

```powershell
Invoke-RestMethod https://web-production-04667.up.railway.app/api/health
Invoke-RestMethod https://web-production-04667.up.railway.app/api/ready
Invoke-RestMethod https://web-production-04667.up.railway.app/api/health/detailed
```

## Seeding

Only set `SEED_SECRET` while seeding demo data, then rotate or remove it.

```powershell
$headers = @{ "x-seed-secret" = "<temporary-seed-secret>" }
Invoke-RestMethod -Method Post -Headers $headers https://web-production-04667.up.railway.app/api/seed/demo
```

## Frontend environment

Required Vercel variables:

- `VITE_API_URL=https://web-production-04667.up.railway.app`
- `VITE_WS_URL=wss://web-production-04667.up.railway.app`

Deploy:

```powershell
vercel --prod
```

## Production smoke test

1. Check `/api/ready` returns `ready`.
2. Log in with seeded demo users.
3. Browse products and market prices.
4. Create a transaction from a buyer account.
5. Confirm seller and buyer transaction views update.
6. Confirm admin `/api/admin/system` works for an admin token.
