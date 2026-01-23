# Vercel Environment Variables Setup Guide

## 🔐 Your Credentials (Ready to Add)

### Firebase Configuration
```
REACT_APP_FIREBASE_CONFIG = {"apiKey":"AIzaSyC_4XJgrfKC0ALBcwW2jh-62ENyIb4OJpg","authDomain":"mkulimalink.firebaseapp.com","projectId":"mkulimalink","storageBucket":"mkulimalink.firebasestorage.app","messagingSenderId":"711411966579","appId":"1:711411966579:web:24a259f79bae1a06cb0006","measurementId":"G-1293K0F2VS"}
```

### Mapbox Token
```
REACT_APP_MAPBOX_TOKEN = pk.eyJ1Ijoia2FkaW9rbyIsImEiOiJja3JweXRkdngyaHd4MnZydjNsc3RpNmdyIn0.gdAy5iD7-rwddWTyqUBSNQ
```

---

## 📋 Complete Environment Variables for Vercel

### Frontend Variables (Required)
```
REACT_APP_API_URL = https://mkulimalink-api-aa384e99a888.herokuapp.com
REACT_APP_MAPBOX_TOKEN = pk.eyJ1Ijoia2FkaW9rbyIsImEiOiJja3JweXRkdngyaHd4MnZydjNsc3RpNmdyIn0.gdAy5iD7-rwddWTyqUBSNQ
REACT_APP_FIREBASE_CONFIG = {"apiKey":"AIzaSyC_4XJgrfKC0ALBcwW2jh-62ENyIb4OJpg","authDomain":"mkulimalink.firebaseapp.com","projectId":"mkulimalink","storageBucket":"mkulimalink.firebasestorage.app","messagingSenderId":"711411966579","appId":"1:711411966579:web:24a259f79bae1a06cb0006","measurementId":"G-1293K0F2VS"}
```

### Backend Variables (For Heroku - Not Vercel)
```
NODE_ENV = production
JWT_SECRET = <generate: openssl rand -hex 32>
MONGODB_URI = <from MongoDB Atlas>
PAYMENT_API_KEY = <your-stripe-key>
STRIPE_KEY = <your-stripe-key>
MPESA_KEY = <your-mpesa-key>
AIRTEL_KEY = <your-airtel-key>
SENDGRID_API_KEY = <your-sendgrid-key>
FIREBASE_KEY = <your-firebase-key>
MAPBOX_TOKEN = pk.eyJ1Ijoia2FkaW9rbyIsImEiOiJja3JweXRkdngyaHd4MnZydjNsc3RpNmdyIn0.gdAy5iD7-rwddWTyqUBSNQ
```

---

## ✅ Steps to Add to Vercel

### Step 1: Go to Vercel Settings
1. Open https://vercel.com/dashboard
2. Click on **MkulimaLink** project
3. Click **Settings** tab
4. Click **Environment Variables** on left sidebar

### Step 2: Add Frontend Variables

**Variable 1: REACT_APP_API_URL** (CRITICAL - This fixes the Products/Market/Weather pages)
- Key: `REACT_APP_API_URL`
- Value: `https://mkulimalink-api-aa384e99a888.herokuapp.com`
- Click **Add**

**Variable 2: REACT_APP_MAPBOX_TOKEN**
- Key: `REACT_APP_MAPBOX_TOKEN`
- Value: `pk.eyJ1Ijoia2FkaW9rbyIsImEiOiJja3JweXRkdngyaHd4MnZydjNsc3RpNmdyIn0.gdAy5iD7-rwddWTyqUBSNQ`
- Click **Add**

**Variable 3: REACT_APP_FIREBASE_CONFIG**
- Key: `REACT_APP_FIREBASE_CONFIG`
- Value: `{"apiKey":"AIzaSyC_4XJgrfKC0ALBcwW2jh-62ENyIb4OJpg","authDomain":"mkulimalink.firebaseapp.com","projectId":"mkulimalink","storageBucket":"mkulimalink.firebasestorage.app","messagingSenderId":"711411966579","appId":"1:711411966579:web:24a259f79bae1a06cb0006","measurementId":"G-1293K0F2VS"}`
- Click **Add**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for build to complete (2-3 minutes)

---

## 🎯 What's Next

Once frontend is deployed with these env vars:

1. **Frontend will be live at**: https://mkulimalink.vercel.app
2. **Next**: Deploy backend to Heroku
3. **Then**: Connect frontend to backend API

---

## 📝 Notes

- Firebase config is stored as JSON string in env var
- Mapbox token is your public API key
- Backend will be deployed to Heroku separately
- API URL will point to Heroku backend once deployed
