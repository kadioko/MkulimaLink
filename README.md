# 🌾 MkulimaLink — Agriculture Marketplace for Tanzania

[![Live](https://img.shields.io/badge/Frontend-Live-brightgreen)](https://mkulimalink.vercel.app)
[![API](https://img.shields.io/badge/API-Live-brightgreen)](https://mkulimalink-api-aa384e99a888.herokuapp.com/api/health)
[![GitHub](https://img.shields.io/badge/GitHub-kadioko%2FMkulimaLink-blue)](https://github.com/kadioko/MkulimaLink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**MkulimaLink** connects farmers, buyers, and suppliers across Tanzania through a modern web marketplace with real-time market prices, weather data, and AI-powered insights.

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | [mkulimalink.vercel.app](https://mkulimalink.vercel.app) | ✅ Live |
| **Backend API** | [mkulimalink-api-aa384e99a888.herokuapp.com](https://mkulimalink-api-aa384e99a888.herokuapp.com) | ✅ Live |
| **Health Check** | [/api/health](https://mkulimalink-api-aa384e99a888.herokuapp.com/api/health) | ✅ Running |

**Try it now** — no login required to browse products, market prices, and weather.

## ✨ Features

### Live & Working
- **Product Marketplace** — Browse 19+ agricultural products with search, category/region filters
- **Market Prices** — Real-time commodity prices across 6+ regions with trend indicators
- **Weather Forecasts** — Current conditions for Dar es Salaam, Morogoro, Arusha, Iringa, Mbeya, Mwanza
- **User Authentication** — Register/login with JWT, role-based access (farmer, buyer, supplier)
- **Dashboard** — Personalized overview for logged-in users
- **AI Insights** — Crop recommendations and market analysis
- **Premium Tier** — Subscription plans for advanced features
- **Responsive Design** — Mobile-first, works on all devices

### Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with feature overview |
| Products | `/products` | Browse & filter all products |
| Product Detail | `/products/:id` | Individual product view |
| Market Prices | `/market` | Real-time commodity prices |
| Weather | `/weather` | Regional weather forecasts |
| Login / Register | `/login`, `/register` | Authentication |
| Dashboard | `/dashboard` | User dashboard (auth required) |
| Add Product | `/add-product` | List a product (auth required) |
| Transactions | `/transactions` | Order history (auth required) |
| AI Insights | `/ai-insights` | AI analysis (auth required) |
| Premium | `/premium` | Subscription plans (auth required) |
| Profile | `/profile` | User profile (auth required) |

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with data counts |
| GET | `/api/products` | List all products (19 items) |
| GET | `/api/market` | Market prices (8 price points) |
| GET | `/api/weather` | Weather data (6 regions) |

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI framework |
| React Router 6 | Client-side routing |
| React Query 3 | Data fetching & caching |
| Zustand 4.5 | State management |
| TailwindCSS 3.4 | Styling |
| Lucide React | Icons |
| Axios | HTTP client |
| Framer Motion | Animations |
| i18next | Internationalization (EN/SW) |
| Recharts | Charts & data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Express 4.21 | Web framework |
| CORS | Cross-origin support |
| MongoDB Atlas | Database (connected) |
| Helmet | Security headers |

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
├── frontend/                    # React SPA
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json       # PWA config
│   └── src/
│       ├── api/axios.js         # API client (baseURL config)
│       ├── components/
│       │   ├── Layout.js        # Main layout with nav
│       │   ├── ErrorBoundary.js # Error handling
│       │   └── Toast.js         # Notifications
│       ├── pages/
│       │   ├── Home.js          # Landing page
│       │   ├── Products.js      # Product marketplace
│       │   ├── ProductDetail.js # Single product view
│       │   ├── Market.js        # Market prices
│       │   ├── Weather.js       # Weather forecasts
│       │   ├── Dashboard.js     # User dashboard
│       │   ├── Login.js         # Authentication
│       │   ├── Register.js      # Registration
│       │   ├── AddProduct.js    # Product listing form
│       │   ├── Transactions.js  # Order management
│       │   ├── AIInsights.js    # AI analysis
│       │   ├── Premium.js       # Subscription plans
│       │   └── Profile.js       # User profile
│       ├── store/authStore.js   # Zustand auth state
│       ├── i18n/                # Translations (EN/SW)
│       └── App.js               # Routes & providers
├── backend/                     # Express API (full version)
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # API route handlers
│   ├── middleware/              # Auth, validation
│   ├── services/                # Business logic
│   └── server.js                # Express app entry
├── index-final.js               # Production API server (Heroku)
├── seedData.js                  # Database seeding script
├── vercel.json                  # Vercel build config
├── Procfile                     # Heroku process config
├── package.json                 # Root dependencies
└── docker-compose.yml           # Docker setup
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
npm install
cd frontend && npm install --legacy-peer-deps && cd ..

# Start frontend (connects to live API)
cd frontend && npm start
# Opens at http://localhost:3000
```

The frontend is pre-configured to connect to the live backend API at `https://mkulimalink-api-aa384e99a888.herokuapp.com`.

### Environment Variables

**Frontend** (Vercel):
```
REACT_APP_API_URL=https://mkulimalink-api-aa384e99a888.herokuapp.com
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
- **Build command**: `cd frontend && npm install --legacy-peer-deps && npm run build`
- **Output directory**: `frontend/build`
- **SPA rewrites**: All routes → `index.html`

### Backend → Heroku
Automatic deployment via GitHub integration.
- **Procfile**: `web: node index-final.js`
- **CORS**: Configured for `https://mkulimalink.vercel.app`

## 🌍 Data Available

### Products (19 items)
Vegetables, Grains, Fruits, Legumes, Dairy, Seeds, Inputs — across Dar es Salaam, Morogoro, Arusha, Iringa, Dodoma, Mwanza, Mbeya, Kilimanjaro.

### Market Prices (8 price points)
Tomatoes, Maize, Onions, Bananas, Beans, Rice — with trend indicators (up/down/stable).

### Weather (6 regions)
Temperature, humidity, and conditions for major farming regions.

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
