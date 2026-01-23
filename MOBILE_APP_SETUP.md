# MkulimaLink Mobile App - Setup & Development Guide

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Initialize Project

```bash
# Create React Native project with Expo
npx create-expo-app MkulimaLink

# Navigate to project
cd MkulimaLink

# Install core dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @reduxjs/toolkit react-redux
npm install axios
npm install react-native-paper
npm install expo-camera expo-location expo-notifications
npm install expo-image-picker
npm install @react-native-async-storage/async-storage
```

### Project Structure Setup

```bash
# Create directory structure
mkdir -p src/screens/Auth
mkdir -p src/screens/Home
mkdir -p src/screens/Search
mkdir -p src/screens/Seller
mkdir -p src/screens/Orders
mkdir -p src/screens/Payments
mkdir -p src/screens/Profile
mkdir -p src/screens/Dashboard
mkdir -p src/navigation
mkdir -p src/services
mkdir -p src/store/slices
mkdir -p src/components
mkdir -p src/utils
mkdir -p src/styles
```

---

## Project Structure

```
mobile/
├── app.json                          # Expo configuration
├── App.js                            # Root component
├── package.json
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── SplashScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── Home/
│   │   │   ├── HomeScreen.js
│   │   │   └── ProductDetailsScreen.js
│   │   ├── Search/
│   │   │   ├── SearchScreen.js
│   │   │   └── FilterScreen.js
│   │   ├── Seller/
│   │   │   ├── ListProductScreen.js
│   │   │   ├── MyProductsScreen.js
│   │   │   └── SalesScreen.js
│   │   ├── Orders/
│   │   │   ├── OrdersScreen.js
│   │   │   ├── OrderDetailsScreen.js
│   │   │   └── CheckoutScreen.js
│   │   ├── Payments/
│   │   │   ├── PaymentMethodScreen.js
│   │   │   └── PaymentStatusScreen.js
│   │   ├── Profile/
│   │   │   ├── ProfileScreen.js
│   │   │   ├── EditProfileScreen.js
│   │   │   └── SettingsScreen.js
│   │   └── Dashboard/
│   │       ├── DashboardScreen.js
│   │       └── AnalyticsScreen.js
│   ├── navigation/
│   │   ├── AuthNavigator.js
│   │   ├── MainNavigator.js
│   │   ├── SellerNavigator.js
│   │   └── RootNavigator.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── paymentService.js
│   │   └── analyticsService.js
│   ├── store/
│   │   ├── store.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── productSlice.js
│   │       ├── orderSlice.js
│   │       └── uiSlice.js
│   ├── components/
│   │   ├── ProductCard.js
│   │   ├── ProductGrid.js
│   │   ├── SearchBar.js
│   │   ├── FilterPanel.js
│   │   ├── OrderCard.js
│   │   ├── PaymentMethod.js
│   │   └── AnalyticsChart.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── storage.js
│   └── styles/
│       ├── colors.js
│       ├── typography.js
│       └── spacing.js
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

---

## Core Configuration Files

### app.json
```json
{
  "expo": {
    "name": "MkulimaLink",
    "slug": "mkulimalink",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.mkulimalink.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.mkulimalink.app"
    },
    "plugins": [
      ["expo-camera"],
      ["expo-location"],
      ["expo-notifications"]
    ]
  }
}
```

### src/services/api.js
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://mkulimalink-api-aa384e99a888.herokuapp.com';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### src/store/store.js
```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    orders: orderReducer,
    ui: uiReducer,
  },
});
```

---

## Development Workflow

### Start Development Server
```bash
npx expo start
```

### Run on iOS Simulator
```bash
npx expo start --ios
```

### Run on Android Emulator
```bash
npx expo start --android
```

### Run on Physical Device
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from terminal
3. App loads on device

---

## Key Screens Implementation

### Authentication Flow

#### SplashScreen.js
- Check if user is logged in
- Redirect to Login or Home
- Load app configuration

#### LoginScreen.js
- Email and password input
- Login button
- Link to register
- Error handling

#### RegisterScreen.js
- 3-step registration
- Form validation
- Role selection
- Location setup

### Product Browsing

#### HomeScreen.js
- Featured products
- Recent products
- Quick search
- Category navigation

#### SearchScreen.js
- Search input
- Filters panel
- Product grid
- Pagination

#### ProductDetailsScreen.js
- Product images carousel
- Product information
- Seller details
- Add to cart button
- Reviews section

### Selling

#### ListProductScreen.js
- Product form
- Image picker
- Category selection
- Price and quantity
- Submit button

#### MyProductsScreen.js
- List of user's products
- Edit/delete options
- Product status
- Sales metrics

### Orders & Payments

#### CheckoutScreen.js
- Cart summary
- Delivery address
- Payment method selection
- Order confirmation

#### PaymentMethodScreen.js
- TigoPesa option
- HaloPesa option
- Airtel Money option
- Phone number input

#### OrdersScreen.js
- List of orders
- Order status
- Tracking information
- Order details

---

## Testing on Mobile

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
npm test
```

### E2E Tests
```bash
npm install --save-dev detox detox-cli
detox build-framework-cache
detox build-app --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

---

## Building for Production

### iOS Build
```bash
eas build --platform ios
```

### Android Build
```bash
eas build --platform android
```

### Submission to App Stores

#### App Store (iOS)
1. Create Apple Developer account
2. Create app in App Store Connect
3. Upload build via Xcode or Transporter
4. Fill in app details
5. Submit for review

#### Google Play (Android)
1. Create Google Play Developer account
2. Create app in Google Play Console
3. Upload signed APK/AAB
4. Fill in app details
5. Submit for review

---

## Performance Optimization

### Image Optimization
```javascript
import { Image } from 'react-native';

Image.getSize(uri, (width, height) => {
  // Resize image before upload
});
```

### List Optimization
```javascript
import { FlatList } from 'react-native';

<FlatList
  data={products}
  renderItem={({ item }) => <ProductCard item={item} />}
  keyExtractor={(item) => item._id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
/>
```

### Bundle Size
```bash
# Analyze bundle size
npx expo-optimize
```

---

## Offline Support

### AsyncStorage Setup
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('products', JSON.stringify(products));

// Retrieve data
const products = await AsyncStorage.getItem('products');
```

### Sync Strategy
- Cache API responses
- Queue offline actions
- Sync when online
- Handle conflicts

---

## Push Notifications

### Setup
```javascript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
```

### Send Notification
```javascript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Order Update',
    body: 'Your order has been shipped',
  },
  trigger: { seconds: 2 },
});
```

---

## Deployment Checklist

- [ ] All screens implemented
- [ ] Navigation working
- [ ] API integration complete
- [ ] Authentication working
- [ ] Payment integration tested
- [ ] Offline mode working
- [ ] Push notifications configured
- [ ] Performance optimized
- [ ] Security implemented
- [ ] Testing complete
- [ ] App Store build ready
- [ ] Google Play build ready
- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] App submitted for review

---

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

#### Metro Bundler Issues
```bash
# Reset metro cache
npx expo start --clear
```

#### Permissions Issues
- Check app.json permissions
- Request permissions at runtime
- Handle permission denials

#### API Connection Issues
- Check API_URL configuration
- Verify network connectivity
- Check CORS settings
- Review API error responses

---

## Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Native Paper](https://callstack.github.io/react-native-paper)
