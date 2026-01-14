# App Store Submission Guide

## 📱 MkulimaLink Mobile App

### App Information

**App Name:** MkulimaLink  
**Bundle ID:** com.mkulimalink.mobile  
**Version:** 1.0.0  
**Minimum iOS Version:** 12.0  
**Minimum Android Version:** API 21 (Android 5.0)  

---

## 🎯 App Store Connect (iOS)

### 1. App Information
- **Name:** MkulimaLink - Agriculture Super-App
- **Subtitle:** Connect Farmers & Buyers in East Africa
- **Primary Language:** English
- **Category:** Business > Agriculture

### 2. Description
```
MkulimaLink is Tanzania's leading agriculture marketplace, connecting farmers directly with buyers across East Africa.

🌾 **For Farmers:**
• List and sell fresh produce at fair prices
• Access micro-loans for farming inputs
• Get crop insurance protection
• Connect with verified buyers instantly

🛒 **For Buyers:**
• Source fresh, quality produce directly
• Transparent pricing and quality assurance
• Reliable delivery tracking
• Build long-term supplier relationships

🚀 **Key Features:**
• Real-time marketplace with live pricing
• Secure mobile payments (M-Pesa, Tigo Pesa, Airtel Money)
• Weather forecasts and farming insights
• Offline functionality for rural areas
• Biometric authentication for security
• Push notifications for updates

Join thousands of farmers and buyers already using MkulimaLink to transform agriculture in East Africa!
```

### 3. Keywords
```
agriculture, farming, marketplace, tanzania, farmers, buyers, produce, crops, livestock, microfinance, insurance, weather, east africa
```

### 4. Support Information
- **Support URL:** https://mkulimalink.co.tz/support
- **Marketing URL:** https://mkulimalink.co.tz
- **Privacy Policy URL:** https://mkulimalink.co.tz/privacy
- **App Support Email:** support@mkulimalink.co.tz

### 5. App Screenshots (iOS)

#### 5.5-inch Display (iPhone 6s Plus/7 Plus/8 Plus)
- **Screenshot 1:** Home screen with quick actions (1242 x 2208)
- **Screenshot 2:** Product marketplace (1242 x 2208)
- **Screenshot 3:** Market prices dashboard (1242 x 2208)
- **Screenshot 4:** Product detail with seller info (1242 x 2208)
- **Screenshot 5:** Chat interface (1242 x 2208)

#### 6.5-inch Display (iPhone XS Max/XR/11)
- **Screenshot 1:** Home screen (1242 x 2688)
- **Screenshot 2:** Product listing (1242 x 2688)
- **Screenshot 3:** Market intelligence (1242 x 2688)
- **Screenshot 4:** User profile (1242 x 2688)
- **Screenshot 5:** Transaction history (1242 x 2688)

### 6. App Icons (iOS)

**App Store Icon:** 1024 x 1024 pixels (with transparency)  
**Spotlight/Icon:** 120 x 120 pixels  
**Settings:** 87 x 87 pixels  
**Notification:** 40 x 40 pixels  

---

## 🤖 Google Play Console (Android)

### 1. Store Listing
- **App Name:** MkulimaLink - Agriculture Marketplace
- **Short Description:** Connect farmers & buyers in East Africa
- **Full Description:** [Same as iOS]

### 2. Graphic Assets

#### App Icons
- **Adaptive Icon:** 108 x 108 dp (432 x 432 px)
- **Legacy Icon:** 512 x 512 px
- **Google Play Icon:** 512 x 512 px (with transparency)

#### Feature Graphic
- **Size:** 1024 x 500 px
- **Content:** App screenshots + key features

#### Screenshots
- **Phone:** 1080 x 1920 px (minimum 2, maximum 8)
- **Tablet (7-inch):** 1200 x 1920 px (optional)
- **Tablet (10-inch):** 1600 x 2560 px (optional)

### 3. Screenshots Content
1. **Welcome/Login Screen** - App introduction
2. **Home Dashboard** - Quick actions menu
3. **Product Marketplace** - Browse available products
4. **Market Prices** - Real-time pricing data
5. **Product Details** - Seller information and purchase
6. **Chat Interface** - Communication with sellers
7. **Profile Management** - User account settings
8. **Transaction History** - Order management

---

## 🔧 Build Configuration

### iOS Build Setup

#### Xcode Configuration
```xml
<!-- ios/MkulimaLink/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>MkulimaLink</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>com.mkulimalink.mobile</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>MkulimaLink</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
    <key>NSCameraUsageDescription</key>
    <string>MkulimaLink needs camera access to take photos of your products</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>MkulimaLink needs location access to show nearby products and weather</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>MkulimaLink needs photo library access to upload product images</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleDefault</string>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
</dict>
</plist>
```

#### Build Commands
```bash
# Install dependencies
npm install

# iOS specific setup
cd ios && pod install && cd ..

# Build for iOS
npm run build:ios

# Or using Xcode
# Open ios/MkulimaLink.xcworkspace
# Select device/simulator
# Build and run
```

### Android Build Setup

#### Gradle Configuration
```gradle
// android/app/build.gradle
android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"
    
    defaultConfig {
        applicationId "com.mkulimalink.mobile"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        
        // Enable multidex for large apps
        multiDexEnabled true
        
        // Signing config (replace with your keystore)
        signingConfig signingConfigs.release
    }
    
    signingConfigs {
        release {
            storeFile file('path/to/keystore.jks')
            storePassword 'store_password'
            keyAlias 'key_alias'
            keyPassword 'key_password'
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

#### Android Manifest
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mkulimalink.mobile">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### Build Commands
```bash
# Install dependencies
npm install

# Android specific setup
# Create local.properties with SDK path
echo "sdk.dir=/path/to/Android/SDK" > android/local.properties

# Build APK
npm run build:android

# Or using Android Studio
# Open android/ folder
# Build > Generate Signed Bundle/APK
```

---

## 📋 Pre-Submission Checklist

### iOS Checklist
- [ ] App icons in all required sizes
- [ ] Screenshots for all device sizes
- [ ] Privacy policy URL configured
- [ ] App Transport Security configured
- [ ] Push notification certificates
- [ ] TestFlight beta testing completed
- [ ] App Store Connect account configured
- [ ] Build uploaded via Xcode or Transporter
- [ ] In-app purchases configured (if applicable)
- [ ] Age rating determined

### Android Checklist
- [ ] App icons and adaptive icons
- [ ] Feature graphic created
- [ ] Screenshots for phone/tablet
- [ ] Privacy policy and terms configured
- [ ] Google Play Console account set up
- [ ] App signing key generated
- [ ] Closed and open testing completed
- [ ] Content rating questionnaire completed
- [ ] Store listing optimized for ASO

### Common Checklist
- [ ] App tested on multiple devices
- [ ] Crash reporting configured (Firebase Crashlytics)
- [ ] Analytics configured (Firebase Analytics)
- [ ] Offline functionality tested
- [ ] Push notifications tested
- [ ] Biometric authentication tested
- [ ] Camera and file upload tested
- [ ] Memory and performance optimized
- [ ] Network security configured

---

## 🚀 Launch Strategy

### Beta Testing
1. **Internal Testing:** Test with development team
2. **Closed Beta:** Limited user group testing
3. **Open Beta:** Public testing via TestFlight/Google Play Beta

### Launch Timeline
- **Week 1:** Final testing and bug fixes
- **Week 2:** App Store submission and review
- **Week 3:** Marketing preparation
- **Week 4:** Official launch and monitoring

### Marketing Assets
- Press release
- Social media graphics
- Website updates
- Farmer outreach materials
- Demo videos

---

## 📞 Support & Maintenance

### Post-Launch Monitoring
- Crash reporting analysis
- User feedback collection
- Performance monitoring
- Update release planning

### Version Update Process
1. Feature development
2. Testing and QA
3. App Store submission
4. User communication
5. Release monitoring

---

## 🎯 Success Metrics

### Key Performance Indicators
- App downloads and installs
- User retention rates
- Transaction volume
- User engagement metrics
- Crash-free users percentage
- App store ratings and reviews

### Business Impact
- Farmer adoption rate
- Transaction value growth
- Market expansion
- Revenue generation
- User satisfaction scores

---

*This guide ensures MkulimaLink mobile app meets all platform requirements and provides an excellent user experience for farmers and buyers across East Africa.*
