# 🗄️ MongoDB Atlas Setup Guide

## **Add Real Data to MongoDB Atlas**

This guide walks you through setting up MongoDB Atlas and seeding real agricultural data into MkulimaLink.

---

## **STEP 1: Connect MongoDB Atlas to Backend**

### **Get Your Connection String**

1. Go to **https://cloud.mongodb.com**
2. Log in to your MongoDB Atlas account
3. Click **"Clusters"** in the left sidebar
4. Click **"Connect"** on your cluster
5. Choose **"Connect your application"**
6. Select **"Node.js"** driver
7. Copy the connection string (looks like):
```
mongodb+srv://mkulimalink:PASSWORD@cluster.mongodb.net/mkulimalink?retryWrites=true&w=majority
```

### **Add to Heroku Environment Variables**

1. Go to **https://dashboard.heroku.com**
2. Click your **mkulimalink-api** app
3. Click **"Settings"** tab
4. Click **"Reveal Config Vars"**
5. Add/Update:
```
MONGODB_URI = mongodb+srv://mkulimalink:YOUR_PASSWORD@cluster.mongodb.net/mkulimalink?retryWrites=true&w=majority
```
6. Click **"Add"**

---

## **STEP 2: Seed Real Data**

### **Option A: Using the Seeding Script (Recommended)**

The real data is ready in `backend/utils/seedRealData.js`:

```bash
# Navigate to backend
cd backend

# Run the seeding script
node utils/seedRealData.js
```

This will seed:
- ✅ **30+ Real Products** (vegetables, grains, fruits, legumes, dairy, seeds)
- ✅ **15+ Market Prices** (regional price variations)
- ✅ **6 Weather Locations** (with forecasts)

### **Option B: Manual Data Entry**

Use MongoDB Atlas UI to add data:

1. Go to **https://cloud.mongodb.com**
2. Click your cluster
3. Click **"Collections"**
4. Click **"Insert Document"**
5. Paste JSON data from `backend/utils/seedRealData.js`

---

## **STEP 3: Real Data Included**

### **Products (30+ items)**

**Vegetables:**
- Tomatoes (2,500 TZS/kg)
- Onions (2,000 TZS/kg)
- Cabbage (1,500 TZS/kg)
- Carrots (1,800 TZS/kg)

**Grains:**
- Maize (1,800 TZS/kg)
- Rice (3,500 TZS/kg)
- Wheat (2,200 TZS/kg)

**Fruits:**
- Bananas (3,000 TZS/bunch)
- Mangoes (4,000 TZS/kg)
- Oranges (2,500 TZS/kg)
- Avocados (5,000 TZS/kg)

**Legumes:**
- Beans (3,500 TZS/kg)
- Lentils (4,000 TZS/kg)
- Chickpeas (3,800 TZS/kg)

**Dairy & Livestock:**
- Fresh Milk (1,200 TZS/liter)
- Eggs (400 TZS/dozen)

**Seeds & Inputs:**
- Maize Seeds (8,000 TZS/bag)
- Tomato Seeds (5,000 TZS/packet)
- Fertilizer NPK (45,000 TZS/bag)

### **Market Prices (15+ price points)**

Real-time pricing from different regions:
- Dar es Salaam
- Morogoro
- Arusha
- Iringa
- Mbeya
- Mwanza
- Dodoma
- Kilimanjaro

### **Weather Data (6 locations)**

Current conditions and 3-day forecasts for:
- Dar es Salaam
- Morogoro
- Arusha
- Iringa
- Mbeya
- Mwanza

---

## **STEP 4: Verify Data in MongoDB**

### **Check Collections**

1. Go to **https://cloud.mongodb.com**
2. Click your cluster
3. Click **"Collections"**
4. You should see:
   - `products` collection (30+ documents)
   - `marketprices` collection (15+ documents)
   - `weather` collection (6+ documents)

### **Test API Endpoints**

```bash
# Get products
curl https://mkulimalink-api-aa384e99a888.herokuapp.com/api/products

# Get market prices
curl https://mkulimalink-api-aa384e99a888.herokuapp.com/api/market

# Get weather
curl https://mkulimalink-api-aa384e99a888.herokuapp.com/api/weather
```

---

## **STEP 5: Update Frontend to Use Real Data**

The frontend is already configured to use the backend API. Once MongoDB is seeded, the frontend will automatically display real data:

1. Visit **https://mkulimalink.vercel.app**
2. Go to **Products** page
3. You should see real agricultural products
4. Go to **Market** page
5. You should see real market prices
6. Go to **Weather** page
7. You should see real weather data

---

## **Data Structure**

### **Product Document**
```json
{
  "_id": ObjectId,
  "name": "Organic Tomatoes",
  "category": "Vegetables",
  "description": "Fresh, locally grown organic tomatoes",
  "price": 2500,
  "quantity": 150,
  "unit": "kg",
  "region": "Morogoro",
  "quality": "premium",
  "organic": true,
  "seller": {
    "name": "Morogoro Farms",
    "rating": 4.8
  },
  "image": "https://images.unsplash.com/...",
  "createdAt": "2026-01-23T20:10:48.019Z"
}
```

### **Market Price Document**
```json
{
  "_id": ObjectId,
  "product": "Tomatoes",
  "category": "Vegetables",
  "region": "Dar es Salaam",
  "price": 2500,
  "priceChange": 5,
  "trend": "up",
  "date": "2026-01-23T20:10:48.019Z"
}
```

### **Weather Document**
```json
{
  "_id": ObjectId,
  "location": "Dar es Salaam",
  "temperature": 28,
  "humidity": 75,
  "rainfall": 15,
  "windSpeed": 12,
  "condition": "Partly Cloudy",
  "forecast": [
    {
      "day": "Tomorrow",
      "high": 29,
      "low": 24,
      "condition": "Sunny"
    }
  ]
}
```

---

## **Troubleshooting**

### **Connection Error**
- Verify MongoDB URI in Heroku config vars
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0)
- Ensure database user password is correct

### **No Data Showing**
- Run seeding script again
- Check MongoDB collections in Atlas UI
- Verify backend is connected to MongoDB

### **API Returns Empty**
- Check backend logs: `heroku logs --tail`
- Verify MONGODB_URI environment variable
- Restart Heroku app: `heroku restart`

---

## **Next Steps**

✅ **MongoDB Atlas Connected**
✅ **Real Data Seeded**
✅ **Frontend Displaying Data**

### **Coming Soon**
- User authentication with real accounts
- Product creation by farmers
- Real transactions and orders
- Live chat between buyers and sellers
- Advanced analytics and reporting

---

## **Support**

- **MongoDB Atlas**: https://cloud.mongodb.com
- **Heroku Logs**: `heroku logs --tail`
- **GitHub Issues**: https://github.com/kadioko/MkulimaLink/issues

---

**Your MkulimaLink platform now has real agricultural data!** 🌾✨
