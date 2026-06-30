# MkulimaLink Changelog

## v2.1.0 (July 2026) - Livestock Management Module

### 🐄 Livestock Management

#### Herd Management
- **Animal Profiles** — Detailed records with photos, species, breed, DOB, weight history, gender, status (active/sold/deceased/transferred)
- **Parentage & Lineage** — Link sire and dam, view full offspring lists per animal
- **Group & Location Tracking** — Assign animals to groups and farm locations
- **Acquisition Records** — Track purchase date, price, and source

#### Life Events Timeline
- **Event Logging** — Record nutrition, births, health checks, vaccinations, milestones, treatments, sales
- **Medication Tracking** — Log dosage, route, withdrawal periods, veterinarian info
- **Reminders** — Set event-based reminders with configurable lead time
- **Filtering** — Filter events by type, date range, or animal

#### Smart Inventory
- **Stock Tracking** — Feed, medications, vaccines, equipment with current quantities
- **Movement Logs** — Record purchases, usage, disposal with running balances
- **Low Stock Alerts** — Automatic alerts when stock falls below reorder point
- **Expiry Tracking** — Flag items approaching or past expiry date

#### Reproduction Management
- **Heat Cycle Records** — Log cycles with predicted next heat date
- **Mating Records** — Natural, AI, or embryo transfer with sire identification
- **Pregnancy Tracking** — Suspected/confirmed status, confirmation method, expected due date
- **Birth Outcomes** — Record live births, stillbirths, offspring count, complications
- **Upcoming Births Dashboard** — Colour-coded countdown for all pregnant animals

#### Breeds Library
- **Comprehensive Database** — East African and international breeds across all species
- **Production Metrics** — Milk yield, eggs/year, wool/year
- **Reproduction Metrics** — Gestation days, average litter size
- **Care Requirements** — Feeding notes, housing, common vaccinations
- **Built-in Fallback** — 8 pre-loaded East African breeds (Boran, Galla, Red Maasai, Kuroiler, etc.)

#### Farm Workspaces
- **Multi-farm Support** — Create and manage multiple farm locations
- **Team Collaboration** — Invite team members by user ID
- **Role-Based Access** — Owner, Manager, Worker, Vet, Viewer roles with appropriate permissions
- **Per-farm Settings** — Currency, weight unit, notification preferences

### 🔧 Technical (v2.1)
- 6 new Mongoose models: `Livestock`, `LivestockEvent`, `LivestockInventory`, `Reproduction`, `BreedsLibrary`, `FarmWorkspace`
- `backend/routes/livestock.js` — 21 new RESTful endpoints under `/api/livestock/*`
- 6 new React pages under `frontend/src/pages/Livestock/`
- 🐄 Livestock navigation added to desktop and mobile nav in `Layout.js`
- React Router routes registered in `App.js` with `PrivateRoute` guards
- Static sub-routes ordered before dynamic `/:id` param to prevent route conflicts

---

## v2.0.0 (January 2026) - Major Update

### 🚀 New Features

#### Real-Time Communication
- **Live Chat**: Direct messaging between buyers and sellers with Socket.io
- **Real-time Notifications**: Instant push notifications for orders, messages, and alerts
- **Typing Indicators**: See when others are typing in chat
- **Price Negotiation**: In-chat offer/counter-offer system

#### Logistics & Delivery
- **Delivery Tracking**: Real-time GPS tracking for shipments
- **Route Optimization**: Smart delivery route planning
- **Proof of Delivery**: Photo/signature confirmation
- **Delivery Pricing Calculator**: Automatic cost estimation based on distance and weight

#### Financial Services
- **Micro-Loans**: AI credit scoring and instant loan approval (10K-5M TZS)
- **Crop Insurance**: Protection against drought, floods, pests, and diseases
- **Weather Index Insurance**: Automatic payouts based on satellite data
- **Equipment Insurance**: Coverage for farming machinery

#### Group Buying
- **Bulk Purchases**: Join group buys for better prices
- **Milestone Discounts**: Unlock additional savings as more farmers join
- **Community Deals**: Region and crop-specific group offers

#### Farm Management
- **Crop Calendar**: Plan planting, fertilizing, and harvesting schedules
- **Task Management**: Track farm activities with reminders
- **Expense Tracking**: Record costs and calculate profitability
- **Yield Recording**: Track actual vs expected yields

#### Equipment Marketplace
- **Equipment Rental**: Rent tractors, harvesters, and farm tools
- **Availability Calendar**: Check and book equipment in advance
- **Operator Services**: Option to hire with trained operator
- **Reviews & Ratings**: Verified renter feedback

#### Supplier Directory
- **Input Sourcing**: Find seeds, fertilizers, and pesticides
- **Verified Suppliers**: Certified and trusted vendors
- **Product Catalog**: Browse supplier inventories
- **Direct Orders**: Contact suppliers through the platform

#### Price Intelligence
- **Price Alerts**: Get notified when prices hit your target
- **Watchlist**: Track products and sellers you're interested in
- **Price History**: View historical price trends
- **Market Predictions**: AI-powered price forecasting

#### Analytics Dashboard
- **Sales Analytics**: Track revenue and order trends
- **Product Performance**: See your best-selling items
- **Market Insights**: Regional demand analysis
- **Financial Reports**: Exportable business reports

### 🔧 Technical Improvements

#### Backend
- Updated to Node.js 20+ with latest Express 4.21
- Mongoose 9 with improved performance and updated middleware compatibility
- Socket.io 4.8 for real-time features
- Redis caching for faster responses
- BullMQ for background job processing
- Winston logging for better debugging
- Enhanced security with XSS protection and rate limiting

#### Frontend
- React 18.3 with latest features
- Vite 7 build tooling replacing Create React App
- TanStack Query v5 for data fetching
- Framer Motion for smooth animations
- React Leaflet for maps
- PWA with offline support via a Vite-compatible service worker
- IndexedDB for offline data storage
- Self-contained backend tests using mongodb-memory-server
- Modular AWS SDK v3 usage replacing AWS SDK v2

#### Infrastructure
- Service worker for offline functionality
- Background sync for pending actions
- Image optimization pipeline
- Gzip compression
- CDN-ready architecture

### 💰 Revenue Enhancements

- **Dynamic Commission**: 3-7% based on volume and category
- **Featured Listings**: Premium product placement (5K-35K TZS)
- **Loan Origination Fees**: 2% on approved loans
- **Insurance Commissions**: 10% on premiums
- **Delivery Fees**: Platform cut on logistics
- **Equipment Rental Fees**: 10% platform commission
- **Premium Subscriptions**: Enhanced features for subscribers

### 🌍 Localization

- Swahili voice commands
- Multi-language support ready
- Tanzania-specific regions and markets
- Local payment methods (M-Pesa, Tigo Pesa, Airtel Money)

### 📱 Mobile Optimization

- Offline-first architecture
- Low-bandwidth optimized
- Touch-friendly UI
- SMS fallback for notifications
- PWA installable on Android

---

## v1.0.0 (Initial Release)

### Features
- User registration with farmer/buyer roles
- Product listings with photo uploads
- AI pest detection on images
- Market price tracking
- Weather forecasts
- M-Pesa payment integration
- SMS notifications
- Premium subscriptions
- Basic search and filtering
- Transaction management
- User ratings and reviews

---

## Roadmap

### v2.1.0 (Q2 2026) ✅ Complete
- [x] Livestock management module (herd, events, inventory, reproduction, breeds, workspaces)
- [ ] Video product listings
- [ ] AI crop disease diagnosis from photos
- [ ] Multi-language support (Swahili, English, French)
- [ ] Integration with agricultural extension services

### v2.2.0 (Q3 2026)
- [ ] Livestock calendar — unified view of all herd events and farm tasks
- [ ] Veterinary visit scheduling and records
- [ ] Feed cost & profitability calculator per animal
- [ ] Livestock marketplace — sell directly from herd profile
- [ ] Blockchain traceability for organic products
- [ ] Carbon credit marketplace
- [ ] Integration with cooperative societies
- [ ] Advanced analytics with ML predictions

### v3.0.0 (Q4 2026)
- [ ] Expansion to Kenya and Uganda
- [ ] B2B wholesale marketplace
- [ ] Export facilitation services
- [ ] Agricultural input financing
- [ ] IoT sensor integration (weight scales, temperature monitors)
