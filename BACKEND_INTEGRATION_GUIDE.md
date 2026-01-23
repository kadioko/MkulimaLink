# Backend Integration Guide 🚀

## ✅ **Current Status**

**Frontend**: https://mkulimalink.vercel.app ✅ LIVE
**Backend**: https://mkulimalink-api.herokuapp.com ✅ LIVE
**Database**: MongoDB Atlas ✅ CONNECTED

---

## 🔗 **Step 1: Connect Frontend to Backend**

### **Add Environment Variable to Vercel**

1. Go to **https://vercel.com/dashboard**
2. Click **MkulimaLink** project
3. Go to **"Settings"** tab
4. Click **"Environment Variables"**
5. Add this variable:

```
Name: REACT_APP_API_URL
Value: https://mkulimalink-api.herokuapp.com
```

6. Click **"Save"**
7. Go to **"Deployments"** tab
8. Click **"Redeploy"** to apply changes

---

## 🧪 **Step 2: Test API Connection**

### **Health Check Endpoint**

**URL**: `https://mkulimalink-api.herokuapp.com/api/health`

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T19:41:00.000Z",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

### **Test in Browser**

1. Open **https://mkulimalink-api.herokuapp.com/api/health**
2. You should see the JSON response above
3. If you see an error, check Heroku logs

---

## 📊 **Step 3: Test API Endpoints**

### **Products Endpoint**

**URL**: `https://mkulimalink-api.herokuapp.com/api/products`

**Expected Response**:
```json
{
  "products": [],
  "totalPages": 0,
  "currentPage": 1,
  "totalProducts": 0
}
```

### **Authentication Endpoint**

**URL**: `https://mkulimalink-api.herokuapp.com/api/auth/register`

**Test POST Request**:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "farmer"
}
```

---

## 🔧 **Step 4: Verify Frontend Integration**

### **Check Frontend Network Requests**

1. Open **https://mkulimalink.vercel.app**
2. Open browser **DevTools** (F12)
3. Go to **"Network"** tab
4. Navigate to **Products** page
5. Look for requests to:
   - `https://mkulimalink-api.herokuapp.com/api/products`
   - `https://mkulimalink-api.herokuapp.com/api/health`

### **Expected Behavior**

- ✅ Products page shows loading state
- ✅ API calls go to Heroku backend
- ✅ If API fails, demo data appears as fallback
- ✅ No CORS errors in console

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. CORS Error**
**Problem**: `Access-Control-Allow-Origin` error
**Solution**: Backend CORS middleware should handle this
**Check**: Heroku logs for CORS configuration

#### **2. API Not Found**
**Problem**: 404 errors on API calls
**Solution**: Verify backend URL is correct
**Check**: Environment variable in Vercel settings

#### **3. Database Connection Failed**
**Problem**: Database connection errors
**Solution**: Check MongoDB Atlas connection string
**Check**: Heroku config vars for MONGODB_URI

#### **4. Empty Response**
**Problem**: API returns empty data
**Solution**: Database may be empty (normal for new deployment)
**Check**: Add sample data via API endpoints

---

## 📱 **Step 5: Test Mobile Integration**

### **Mobile Testing**

1. Open **https://mkulimalink.vercel.app** on mobile
2. Test responsive design
3. Verify API calls work on mobile
4. Check touch interactions

### **Performance Testing**

1. Check page load times
2. Monitor API response times
3. Test on slow connections
4. Verify image optimization

---

## 🎯 **Step 6: Full Integration Test**

### **Complete User Flow**

1. **Homepage**: Loads correctly
2. **Products Page**: Fetches from API or shows demo data
3. **Product Detail**: Loads individual product
4. **Authentication**: Login/Signup works
5. **Mobile**: Responsive on all devices

### **Success Indicators**

- ✅ Frontend loads without errors
- ✅ API calls succeed (or gracefully fail to demo data)
- ✅ Mobile design works properly
- ✅ No console errors
- ✅ Fast page load times

---

## 📈 **Step 7: Monitor Performance**

### **Key Metrics**

- **Page Load Time**: < 3 seconds
- **API Response Time**: < 1 second
- **Mobile Performance**: > 90 Lighthouse score
- **Error Rate**: < 1%

### **Monitoring Tools**

- **Vercel Analytics**: Frontend performance
- **Heroku Metrics**: Backend performance
- **MongoDB Atlas**: Database performance
- **Browser DevTools**: Real-time debugging

---

## 🎉 **Integration Complete Checklist**

- [ ] Backend deployed to Heroku ✅
- [ ] MongoDB Atlas connected ✅
- [ ] Frontend environment variables set
- [ ] API health check working
- [ ] Frontend calling backend API
- [ ] Mobile responsive design working
- [ ] Error handling in place
- [ ] Performance optimized

---

## 🚀 **Next Steps**

1. **Add Real Data**: Populate database with sample products
2. **User Authentication**: Test login/signup flow
3. **File Uploads**: Test image uploads
4. **Real-time Features**: WebSocket integration
5. **Analytics**: Set up user tracking

---

**Status**: Ready for full integration testing! 🌾✨
