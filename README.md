# 🌾 MkulimaLink — Agriculture Super-App for East Africa

[![Live](https://img.shields.io/badge/Frontend-Live-brightgreen)](https://mkulimalink.vercel.app)
[![API](https://img.shields.io/badge/API-Live-brightgreen)](https://mkulimalink-api-aa384e99a888.herokuapp.com/api/health)
[![GitHub](https://img.shields.io/badge/GitHub-kadioko%2FMkulimaLink-blue)](https://github.com/kadioko/MkulimaLink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.1.0-blue)](docs/CHANGELOG.md)

**MkulimaLink** is a comprehensive agriculture super-app for East African farmers — combining a marketplace, AI insights, real-time chat, live auctions, and a full **livestock management system** in one platform.

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | [mkulimalink.vercel.app](https://mkulimalink.vercel.app) | ✅ Live |
| **Backend API** | [mkulimalink-api-aa384e99a888.herokuapp.com](https://mkulimalink-api-aa384e99a888.herokuapp.com) | ✅ Live |
| **Health Check** | [/api/health](https://mkulimalink-api-aa384e99a888.herokuapp.com/api/health) | ✅ Running |

**Try it now** — no login required to browse products, market prices, and weather.

## ✨ Features

### Core Platform
- **Product Marketplace** — Browse 19+ agricultural products with search, category/region filters
- **Market Prices** — Real-time commodity prices across 6+ regions with trend indicators
- **Weather Forecasts** — Current conditions for Dar es Salaam, Morogoro, Arusha, Iringa, Mbeya, Mwanza
- **User Authentication** — Register/login with JWT, role-based access (farmer, buyer, supplier)
- **Dashboard** — Personalized overview for logged-in users
- **AI Insights** — Crop recommendations and market analysis
- **Premium Tier** — Subscription plans for advanced features
- **Responsive Design** — Mobile-first, works on all devices

### 🐄 Livestock Management (v2.1 — New)
- **Herd Management** — Animal profiles with photos, vital metrics, species, breed, parentage lineage
- **Life Events Timeline** — Log nutrition, births, vaccinations, medical events and milestones with reminders
- **Smart Inventory** — Track feed, medications, vaccines and equipment with automatic low-stock alerts
- **Reproduction Tracking** — Record heat cycles, mating, pregnancy status and birth outcomes
- **Breeds Library** — Comprehensive East African breed database with care requirements and metrics
- **Farm Workspaces** — Manage multiple farms, invite team members, assign roles and permissions

### 🆕 Platform Features
- **🌙 Dark Mode** — Full dark mode with system preference detection
- **💫 Animations** — Framer Motion throughout (page transitions, hover, scroll)
- **💝 Wishlist** — Persistent wishlist with collections, priority levels, and notes
- **⚖️ Product Comparison** — Compare up to 4 products side-by-side
- **🔍 Advanced Search** — Debounced search, URL-persisted filters, fuzzy matching, NLP
- **🔔 Toast Notifications** — Animated success/error/info notifications
- **🔄 Real-time Chat** — WebSocket messaging with typing indicators
- **🏷️ Live Auctions** — Real-time bidding with auto-bid and countdown timers
- **📊 Price History** — Historical price charts with trend analysis
- **💱 Multi-Currency** — Live exchange rates (TZS, KES, USD, EUR, GBP)
- **🗺️ Interactive Maps** — Leaflet product location maps with clustering
- **📤 Drag & Drop Upload** — Image uploads with previews and validation
- **♿ Accessibility** — Keyboard navigation, skip links, focus management
- **📱 PWA Support** — Service worker, offline capabilities, installable app
- **📈 Analytics** — Comprehensive tracking, Web Vitals monitoring
- **⚡ Performance** — Image optimization, lazy loading, skeleton states, virtual scrolling

### Frontend Pages
| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Home | `/` | No | Landing page with feature overview |
| Products | `/products` | No | Browse & filter all products |
| Product Detail | `/products/:id` | No | Individual product view |
| Market Prices | `/market` | No | Real-time commodity prices |
| Weather | `/weather` | No | Regional weather forecasts |
| Login / Register | `/login`, `/register` | No | Authentication |
| Dashboard | `/dashboard` | ✅ | Personalized user dashboard |
| Add Product | `/add-product` | ✅ | List a product for sale |
| Transactions | `/transactions` | ✅ | Order history |
| AI Insights | `/ai-insights` | ✅ | AI analysis & recommendations |
| Premium | `/premium` | No | Subscription plans |
| Profile | `/profile` | ✅ | User profile |
| **Livestock Hub** | **`/livestock`** | ✅ | **Herd overview & stats** |
| Animal Profile | `/livestock/:id` | ✅ | Full animal profile & events timeline |
| Livestock Inventory | `/livestock/inventory` | ✅ | Stock levels & movement logs |
| Reproduction Tracker | `/livestock/reproduction` | ✅ | Heat cycles, mating, pregnancy |
| Breeds Library | `/livestock/breeds` | No | Searchable breed database |
| Farm Workspaces | `/livestock/workspace` | ✅ | Multi-farm & team management |

### Core API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with data counts |
| GET | `/api/products` | List all products |
| GET | `/api/market` | Market prices |
| GET | `/api/weather` | Weather data (6 regions) |
| GET | `/api/auctions` | List active auctions |
| POST | `/api/auctions` | Create new auction |
| POST | `/api/auctions/:id/bid` | Place bid on auction |
| GET | `/api/wishlist` | Get user's wishlist |
| POST | `/api/wishlist/items` | Add to wishlist |
| DELETE | `/api/wishlist/items/:id` | Remove from wishlist |
| GET | `/api/exchange-rates` | Get all exchange rates |
| POST | `/api/exchange-rates/convert` | Convert currency |
| GET | `/api/products/:id/price-history` | Price history data |

### Livestock API Endpoints (`/api/livestock/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/livestock/animals` | List herd (filterable by species, gender, status) |
| POST | `/api/livestock/animals` | Add new animal |
| GET | `/api/livestock/animals/:id` | Animal profile |
| PUT | `/api/livestock/animals/:id` | Update animal |
| DELETE | `/api/livestock/animals/:id` | Remove animal |
| GET | `/api/livestock/animals/:id/offspring` | List offspring |
| GET | `/api/livestock/stats` | Herd summary stats |
| GET | `/api/livestock/events` | Life events (filterable) |
| POST | `/api/livestock/events` | Log new event |
| GET | `/api/livestock/reminders` | Upcoming reminders |
| GET | `/api/livestock/inventory` | Stock list |
| POST | `/api/livestock/inventory` | Add inventory item |
| POST | `/api/livestock/inventory/:id/movement` | Log stock movement |
| GET | `/api/livestock/reproduction` | Reproduction records |
| POST | `/api/livestock/reproduction` | Add record |
| GET | `/api/livestock/reproduction/upcoming-births` | Upcoming due dates |
| GET | `/api/livestock/breeds` | Breed library (public) |
| GET | `/api/livestock/workspaces` | User's farm workspaces |
| POST | `/api/livestock/workspaces` | Create workspace |
| POST | `/api/livestock/workspaces/:id/members` | Invite team member |
| DELETE | `/api/livestock/workspaces/:id/members/:uid` | Remove team member |

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|--------|
| React | 18.3 | UI framework |
| Vite | 7.x | Dev server & production build |
| React Router | 6.30 | Client-side routing |
| TanStack Query | 5.x | Data fetching & caching |
| Zustand | 4.5 | State management |
| TailwindCSS | 3.4 | Styling |
| Lucide React | 0.436 | Icons |
| Axios | 1.17 | HTTP client |
| Framer Motion | 11.x | Animations |
| i18next | 23.x | Internationalization (EN/SW) |
| Recharts | 2.12 | Charts & data visualization |
| Leaflet / React-Leaflet | 1.9 / 4.2 | Interactive maps |
| Socket.io-client | 4.7 | Real-time communication |
| date-fns | 3.6 | Date formatting |
| Vitest + Testing Library | 3.x / 16.x | Frontend tests |

### New Custom Hooks (25+)
| Hook | Purpose |
|------|---------|
| `useAIRecommendations` | ML-powered product recommendations |
| `usePricePrediction` | Price forecasting with historical data |
| `useSmartSearch` | NLP search with intent detection |
| `useChat` | Real-time messaging |
| `useBidding` | Auction bidding management |
| `useMultiCurrency` | Currency conversion & formatting |
| `usePriceHistory` | Price trend analysis |
| `useDebounce` | Debounced search input |
| `useVirtualScroll` | Efficient list rendering |
| `useFuzzySearch` | Fuzzy text matching |
| `useWebSocket` | WebSocket connection management |
| `useKeyboardNavigation` | Keyboard accessibility |
| `useAnalytics` | Event tracking & Web Vitals |
| `useTheme` | Dark mode management |
| `useToast` | Notification system |

### Backend
| Technology | Version | Purpose |
|------------|---------|--------|
| Node.js | 20+ | Runtime |
| Express | 4.22 | Web framework |
| MongoDB Atlas | — | Cloud database |
| Mongoose | 9.7 | ODM for MongoDB |
| Socket.io | 4.8 | Real-time WebSocket server |
| JWT | 9.x | Authentication tokens |
| Helmet | 7.x | Security headers |
| Express Rate Limit | 8.x | API rate limiting |
| Multer | 2.x | File uploads |
| Sharp | 0.34 | Image processing |
| Winston | 3.x | Logging |
| node-cron | 4.x | Scheduled tasks |
| Sentry | 10.x | Error monitoring |
| Jest + mongodb-memory-server | 30.x / 11.x | Backend tests |

### Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting + CI/CD |
| **Heroku** | Backend API hosting |
| **MongoDB Atlas** | Cloud database |
| **GitHub** | Source control + auto-deploy triggers |

## 📁 Project Structure

```
MkulimaLink/
├── frontend/                    # React SPA (Vite)
│   ├── index.html               # Vite HTML entry
│   ├── vite.config.js           # Vite configuration
│   ├── public/
│   │   ├── manifest.json        # PWA config
│   │   └── sw.js                # Service worker
│   └── src/
│       ├── api/axios.js          # API client (auth interceptors)
│       ├── config/env.js         # Environment config
│       ├── components/           # 60+ UI components
│       │   ├── Layout.js         # Main layout with nav
│       │   ├── ErrorBoundary.js  # Error handling
│       │   └── ToastContainer.js # Notifications
│       ├── pages/
│       │   ├── Home.js           # Landing page
│       │   ├── Products.js       # Product marketplace
│       │   ├── Market.js         # Market prices
│       │   ├── Weather.js        # Weather forecasts
│       │   ├── Dashboard.js      # User dashboard
│       │   ├── AIInsights.js     # AI analysis
│       │   ├── Premium.js        # Subscription plans
│       │   ├── Profile.js        # User profile
│       │   └── Livestock/        # 🐄 Livestock module
│       │       ├── LivestockDashboard.js
│       │       ├── AnimalProfile.js
│       │       ├── LivestockInventory.js
│       │       ├── ReproductionTracker.js
│       │       ├── BreedsLibrary.js
│       │       └── FarmWorkspace.js
│       ├── hooks/                # 25+ custom hooks
│       ├── store/                # Zustand stores
│       ├── i18n/                 # Translations (EN/SW)
│       └── App.js                # Routes & providers
├── backend/                     # Express API
│   ├── models/                  # 43 Mongoose schemas
│   │   ├── Livestock.js         # Animal profiles
│   │   ├── LivestockEvent.js    # Events timeline
│   │   ├── LivestockInventory.js# Stock management
│   │   ├── Reproduction.js      # Breeding records
│   │   ├── BreedsLibrary.js     # Breed database
│   │   └── FarmWorkspace.js     # Multi-farm/team
│   ├── routes/                  # 47 API route files
│   │   └── livestock.js         # Livestock API
│   ├── middleware/              # Auth, validation, caching
│   ├── services/                # Business logic
│   └── server.js                # Express app entry
├── ai-ml/                       # Python ML services
├── mobile/                      # React Native app
├── docs/                        # Documentation
├── index-final.js               # Production server (Heroku)
├── vercel.json                  # Vercel build config
├── Procfile                     # Heroku process config
├── docker-compose.yml           # Docker setup
└── package.json                 # Root dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

### Local Development

```bash
# Clone
git clone https://github.com/kadioko/MkulimaLink.git
cd MkulimaLink

# Install dependencies
npm run install-all

# Start backend + frontend
npm run dev
# Opens at http://localhost:3000
```

The frontend is pre-configured to connect to the live backend API at `https://mkulimalink-api-aa384e99a888.herokuapp.com`.

### Environment Variables

**Frontend** (Vercel):
```
VITE_API_URL=https://mkulimalink-api-aa384e99a888.herokuapp.com
```

**Backend** (Heroku):
```
MONGODB_URI=<MongoDB Atlas connection string>
NODE_ENV=production
PORT=<assigned by Heroku>
```

## 🚢 Deployment

### Frontend → Vercel
Automatic deployment on push to `main` branch.
- **Build command**: `cd frontend && npm ci && npm run build`
- **Output directory**: `frontend/dist`
- **SPA rewrites**: All routes → `index.html`

### Backend → Heroku
Automatic deployment via GitHub integration.
- **Procfile**: `web: node index-final.js`
- **CORS**: Configured for `https://mkulimalink.vercel.app`

## 🌍 Data Available

### Products (19+ items)
Vegetables, Grains, Fruits, Legumes, Dairy, Seeds, Inputs — across Dar es Salaam, Morogoro, Arusha, Iringa, Dodoma, Mwanza, Mbeya, Kilimanjaro.

### Market Prices (8+ price points)
Tomatoes, Maize, Onions, Bananas, Beans, Rice — with trend indicators (up/down/stable).

### Weather (6 regions)
Temperature, humidity, and conditions for major farming regions.

### Auctions
Live bidding marketplace for premium products with real-time updates.

### Exchange Rates
Live rates for TZS, KES, USD, EUR, GBP with automatic conversion.

## 🧪 Testing

### Run Tests
```bash
# Backend tests, using in-memory MongoDB by default
npm test

# Frontend tests
npm run test:frontend

# Mobile tests
npm run test:mobile

# Security audit across root, frontend, and mobile
npm run audit:all
```

### Test Structure
- **Unit Tests**: Components, hooks, utilities
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: User flows (login → browse → purchase)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kadioko/MkulimaLink/issues)
- **Email**: support@mkulimalink.co.tz

---

<p align="center">
  Made with ❤️ for Tanzania's Farmers
</p>
