# MkulimaLink API Documentation v2.0

Base URL: `http://localhost:5000/api`

## Authentication

### Register User
```
POST /auth/register
Body: { name, email, phone, password, role: 'farmer'|'buyer', location }
Response: { token, user }
```

### Login
```
POST /auth/login
Body: { email, password }
Response: { token, user }
```

## Products

### List Products
```
GET /products?category=&region=&minPrice=&maxPrice=&page=&limit=
Response: { products, totalPages, currentPage, total }
```

### Create Product (Farmer)
```
POST /products
Headers: Authorization: Bearer <token>
Body: FormData { name, category, description, price, quantity, unit, images[] }
Response: { product }
```

### Get Product
```
GET /products/:id
Response: { product, seller, aiInsights }
```

## Transactions

### Create Transaction
```
POST /transactions
Headers: Authorization: Bearer <token>
Body: { productId, quantity, deliveryAddress }
Response: { transaction }
```

### Get My Purchases/Sales
```
GET /transactions/my/purchases
GET /transactions/my/sales
Response: { transactions }
```

## Chat (Real-time)

### Start Chat
```
POST /chat/start
Body: { recipientId, productId, initialMessage }
Response: { chat }
```

### Send Message
```
POST /chat/:chatId/messages
Body: { content, type: 'text'|'offer'|'image' }
Response: { message }
```

### WebSocket Events
- `join_chat` - Join a chat room
- `send_message` - Send message
- `new_message` - Receive message
- `typing` / `stop_typing` - Typing indicators

## Delivery

### Create Delivery
```
POST /delivery/create
Body: { transactionId, pickup, dropoff, package }
Response: { delivery, trackingNumber }
```

### Track Delivery
```
GET /delivery/track/:trackingNumber
Response: { status, currentLocation, trackingHistory }
```

### WebSocket Events
- `track_delivery` - Subscribe to delivery updates
- `location_update` - Real-time GPS updates
- `delivery_update` - Status changes

## Financial Services

### Apply for Loan
```
POST /loans/apply
Body: { amount, purpose, duration }
Response: { loan, creditScore, approvedAmount }
```

### Get Credit Score
```
GET /loans/credit-score
Response: { score, maxLoanAmount, interestRate, eligible }
```

### Get Insurance Quote
```
POST /insurance/quote
Body: { type, coverageAmount, region, farmSize }
Response: { annualPremium, monthlyPremium, rate }
```

### Purchase Insurance
```
POST /insurance/purchase
Body: { type, coverageAmount, coverage, period }
Response: { policy }
```

### Submit Claim
```
POST /insurance/policy/:id/claim
Body: { type, description, amount, evidence[] }
Response: { claim }
```

## Group Buying

### Create Group Buy
```
POST /groupbuy/create
Body: { title, type, product, pricing, quantity, timeline, location }
Response: { groupBuy }
```

### Join Group Buy
```
POST /groupbuy/:id/join
Body: { quantity }
Response: { groupBuy, yourOrder }
```

### List Group Buys
```
GET /groupbuy?region=&type=&status=
Response: { groupBuys, totalPages }
```

## Price Alerts

### Create Alert
```
POST /alerts/price-alert
Body: { product, region, condition: { type, value } }
Response: { alert }
```

### Get Watchlist
```
GET /alerts/watchlist
Response: { watchlist }
```

### Add to Watchlist
```
POST /alerts/watchlist/add
Body: { type, referenceId, name }
Response: { watchlist }
```

## Crop Calendar

### Create Calendar
```
POST /calendar
Body: { name, crop, season, year, farm, timeline }
Response: { calendar }
```

### Add Task
```
POST /calendar/:id/tasks
Body: { title, type, scheduledDate, priority }
Response: { task }
```

### Record Expense
```
POST /calendar/:id/expenses
Body: { category, description, amount }
Response: { expense }
```

### Get Report
```
GET /calendar/:id/report
Response: { summary, inputs, expenses, yields, profitability }
```

## Equipment Rental

### List Equipment
```
GET /equipment?category=&region=&available=true
Response: { equipment, totalPages }
```

### Book Equipment
```
POST /equipment/:id/book
Body: { startDate, endDate, delivery, withOperator }
Response: { booking, pricing }
```

## Suppliers

### List Suppliers
```
GET /suppliers?type=&region=&verified=true
Response: { suppliers, totalPages }
```

### Get Supplier
```
GET /suppliers/:id
Response: { supplier, products, reviews }
```

## Market Data

### Get Prices
```
GET /market/prices?region=&category=
Response: { prices }
```

### Get Trends
```
GET /market/prices/trends/:product
Response: { trend, history }
```

## Weather

### Current Weather
```
GET /weather/current/:region
Response: { temperature, humidity, rainfall, condition }
```

### Forecast
```
GET /weather/forecast/:region
Response: { forecast[] }
```

### Alerts
```
GET /weather/alerts/:region
Response: { alerts[] }
```

## AI Features (Premium)

### Yield Prediction
```
POST /ai/yield-prediction
Body: { cropType, farmSize, soilType, region, plantingDate }
Response: { predictedYield, confidence, recommendations }
```

### Price Prediction
```
POST /ai/price-prediction
Body: { product, region, quantity, targetDate }
Response: { predictedPrice, trend, recommendation }
```

### Crop Recommendations
```
POST /ai/recommendations/crop
Body: { region, farmSize, soilType, budget }
Response: { recommendations[] }
```

## Gamification

### Get Profile
```
GET /gamification/profile
Response: { level, experience, achievements, streak }
```

### Daily Check-in
```
POST /gamification/daily-checkin
Response: { streak, xpGained, newAchievement }
```

### Leaderboard
```
GET /gamification/leaderboard?type=level|xp|streak
Response: { leaderboard[] }
```

## Referrals

### Get My Code
```
GET /referrals/my-code
Response: { referralCode, referralLink, stats }
```

### Apply Code
```
POST /referrals/apply-code
Body: { referralCode }
Response: { reward, newBalance }
```

## Analytics

### Dashboard Stats
```
GET /analytics/dashboard
Response: { totalSales, monthlyRevenue, pendingOrders }
```

### Sales Chart
```
GET /analytics/sales-chart?period=30
Response: { salesData[] }
```

## Payments

### Initiate M-Pesa
```
POST /payments/mpesa/initiate
Body: { phone, amount, reference }
Response: { checkoutRequestId }
```

### Subscribe Premium
```
POST /payments/premium/subscribe
Body: { plan: 'monthly'|'yearly', phoneNumber }
Response: { subscription }
```

### Get Balance
```
GET /payments/balance
Response: { balance, pendingWithdrawals }
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

## Rate Limits

- General: 200 requests per 15 minutes
- Auth: 10 requests per minute
- Payments: 20 requests per minute

## WebSocket Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('new_message', (msg) => console.log(msg));
socket.on('notification', (notif) => console.log(notif));
```
