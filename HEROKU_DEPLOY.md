# Heroku Deployment Instructions

## Quick Deploy (Recommended)

### Option 1: Deploy via GitHub (Automatic)
If you have GitHub connected to Heroku:
1. Go to https://dashboard.heroku.com/apps/mkulimalink-api-aa384e99a888
2. Click **Deploy** tab
3. Click **Deploy Branch** button
4. Wait 2-3 minutes for deployment

### Option 2: Deploy via Heroku CLI
```bash
# Install Heroku CLI if not already installed
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Add Heroku remote
heroku git:remote -a mkulimalink-api-aa384e99a888

# Deploy
git push heroku main
```

### Option 3: Manual Redeploy
1. Go to https://dashboard.heroku.com/apps/mkulimalink-api-aa384e99a888
2. Click **More** (top right)
3. Click **Restart all dynos**
4. Then click **Deploy** tab
5. Click **Deploy Branch**

## What Was Changed

✅ Added CORS support to backend API
✅ Now allows requests from https://mkulimalink.vercel.app
✅ This fixes the cross-origin request blocking issue

## Verification

After deployment, visit:
- https://mkulimalink-api-aa384e99a888.herokuapp.com/api/health

Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "Real Data (Static)",
  "dataCount": {
    "products": 19,
    "marketPrices": 8,
    "weather": 6
  }
}
```

## Next Steps

1. **Deploy to Heroku** using one of the options above
2. **Wait 2-3 minutes** for deployment to complete
3. **Refresh** https://mkulimalink.vercel.app/products
4. **All 19 products** should now display correctly
