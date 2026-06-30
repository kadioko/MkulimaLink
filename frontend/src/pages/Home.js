import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Check,
  CloudSun,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Truck,
  Wheat,
} from 'lucide-react';

const products = [
  {
    name: 'White maize',
    region: 'Dodoma',
    price: 'TZS 90,000',
    unit: 'per bag',
    trend: '+4.8%',
    demand: 'High buyer demand',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=220&q=80',
  },
  {
    name: 'Fresh tomatoes',
    region: 'Morogoro',
    price: 'TZS 35,000',
    unit: 'per crate',
    trend: '+2.1%',
    demand: 'Fast moving',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=220&q=80',
  },
  {
    name: 'Red kidney beans',
    region: 'Mbeya',
    price: 'TZS 250,000',
    unit: 'per bag',
    trend: '-1.3%',
    demand: 'Stable supply',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=220&q=80',
  },
];

const marketRows = [
  ['Tomatoes', 'Kariakoo', 'TZS 35,000', 'Rising'],
  ['Maize', 'Dodoma', 'TZS 85,000', 'Stable'],
  ['Beans', 'Mbeya', 'TZS 250,000', 'Falling'],
  ['Rice', 'Mwanza', 'TZS 180,000', 'Rising'],
];

const workflows = [
  {
    icon: ShoppingBag,
    title: 'Find verified supply',
    body: 'Buyers compare produce by region, grade, quantity, and seller reputation before contacting farmers.',
  },
  {
    icon: BarChart3,
    title: 'Price with confidence',
    body: 'Farmers see current market ranges, demand signals, and regional weather before listing produce.',
  },
  {
    icon: ShieldCheck,
    title: 'Close securely',
    body: 'Orders, messages, mobile money, and delivery updates stay connected through one transaction flow.',
  },
];

function Home() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden border border-emerald-100 bg-white">
        <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl"
            >
              <div className="mb-7 inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                <Sprout size={16} />
                Tanzania and Kenya marketplace
              </div>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Trade better harvests, faster.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                MkulimaLink helps farmers list produce, buyers find verified supply, and both sides make decisions with live market prices, weather, and transaction tools.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Browse Products
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/add-product"
                  className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-emerald-500 hover:text-emerald-700"
                >
                  List Produce
                </Link>
              </div>
            </motion.div>

            <div className="mt-12 grid grid-cols-4 border-y border-slate-200">
              {[
                ['55+', 'API endpoints'],
                ['6', 'Regions covered'],
                ['43', 'Data models'],
                ['24h', 'Live prices'],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-slate-200 py-5 last:border-r-0 px-3">
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,1),rgba(6,78,59,0.9))]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative h-full border border-white/10 bg-white p-4 shadow-2xl sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Live supply board</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Buyer-ready produce</h2>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                  <CloudSun size={16} />
                  Rain watch
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {products.map((product, index) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.16 + index * 0.08 }}
                    className="grid grid-cols-[64px_1fr] gap-3 border border-slate-200 bg-white p-3 sm:grid-cols-[72px_1fr] sm:gap-4"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 object-cover sm:h-[72px] sm:w-[72px]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-950">{product.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin size={14} />
                            {product.region}
                          </p>
                        </div>
                        <span className={`text-sm font-black ${product.trend.startsWith('+') ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {product.trend}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                        <p className="text-sm text-slate-500">
                          <span className="whitespace-nowrap text-lg font-black text-slate-950">{product.price}</span> {product.unit}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:text-right">{product.demand}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Open bids', '128'],
                  ['Avg. response', '18m'],
                  ['Verified sellers', '94%'],
                ].map(([label, value]) => (
                  <div key={label} className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-2xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {workflows.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="border border-slate-200 bg-white p-6"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
              <item.icon size={22} />
            </div>
            <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-slate-200 bg-white p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Market intelligence</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Know the price before the truck leaves.</h2>
            </div>
            <Link to="/market" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-800">
              View markets
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-hidden border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              <span>Crop</span>
              <span>Market</span>
              <span>Average</span>
              <span>Trend</span>
            </div>
            {marketRows.map(([crop, market, price, trend]) => (
              <div key={`${crop}-${market}`} className="grid grid-cols-4 border-t border-slate-200 px-4 py-4 text-sm">
                <span className="font-black text-slate-950">{crop}</span>
                <span className="text-slate-600">{market}</span>
                <span className="font-bold text-slate-900">{price}</span>
                <span className={trend === 'Falling' ? 'font-bold text-amber-700' : 'font-bold text-emerald-700'}>{trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-emerald-200 bg-emerald-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-white/10">
              <CloudSun size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-200">Weather and logistics</p>
              <h2 className="text-2xl font-black">Plan around the route.</h2>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {[
              ['Morogoro', 'Light rain expected', 'Harvest pickup before 16:00'],
              ['Dodoma', 'Dry and windy', 'Good milling maize movement'],
              ['Mbeya', 'Cool morning', 'Beans storage conditions stable'],
            ].map(([region, forecast, action]) => (
              <div key={region} className="border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{region}</p>
                  <Truck size={18} className="text-emerald-200" />
                </div>
                <p className="mt-2 text-sm text-emerald-100">{forecast}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/70">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform modules showcase */}
      <section>
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-2">Everything in one platform</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Built for the full farming cycle</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              emoji: '🛒', title: 'Marketplace', color: 'border-emerald-200 bg-emerald-50',
              desc: 'List produce, browse verified supply, place bulk orders, live auctions, group buying.',
              path: '/products', cta: 'Browse products',
            },
            {
              emoji: '🐄', title: 'Livestock Management', color: 'border-amber-200 bg-amber-50',
              desc: 'Full herd profiles, events timeline, reproduction tracker, smart inventory, breeds library, multi-farm workspaces.',
              path: '/livestock', cta: 'Manage herd',
            },
            {
              emoji: '📊', title: 'Analytics & AI', color: 'border-violet-200 bg-violet-50',
              desc: 'Farm performance, market intelligence, predictive pricing, AI-powered crop recommendations.',
              path: '/analytics', cta: 'View analytics',
            },
            {
              emoji: '🌤️', title: 'Farm Tools', color: 'border-blue-200 bg-blue-50',
              desc: 'Weather by region, crop calendar, yield calculator, pest guide, soil health tips.',
              path: '/weather', cta: 'Open tools',
            },
            {
              emoji: '👥', title: 'Community', color: 'border-rose-200 bg-rose-50',
              desc: 'Connect with farmers, consult agronomists and vets, take online training courses.',
              path: '/community', cta: 'Join community',
            },
            {
              emoji: '💳', title: 'Finance', color: 'border-yellow-200 bg-yellow-50',
              desc: 'Agricultural loans, crop and livestock insurance, premium AI tools, mobile money.',
              path: '/premium', cta: 'See plans',
            },
          ].map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`border ${mod.color} p-5 flex flex-col`}
            >
              <span className="text-3xl mb-3">{mod.emoji}</span>
              <h3 className="font-black text-slate-950 mb-2">{mod.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{mod.desc}</p>
              <Link to={mod.path} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                {mod.cta} <ArrowRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Livestock spotlight */}
      <section className="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide mb-6 w-fit">
              New in v2.1
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 mb-4">
              Complete livestock management — built for East African farmers.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Track every animal from birth to sale. Monitor pregnancies, log health events, manage feed and medication stock, and collaborate with your team across multiple farms.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                ['🐄', 'Herd Profiles', 'Every animal, fully documented'],
                ['🧬', 'Reproduction', 'Heat cycles, pregnancy, births'],
                ['📦', 'Smart Inventory', 'Feed & meds with low-stock alerts'],
                ['🏡', 'Multi-farm', 'Team roles & workspace management'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="bg-white border border-amber-100 p-3">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link to="/livestock" className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-amber-700 transition-colors">
                Open Livestock Hub <ArrowRight size={15} />
              </Link>
              <Link to="/livestock/breeds" className="inline-flex items-center gap-2 border border-amber-300 text-amber-800 px-5 py-2.5 text-sm font-bold hover:bg-amber-100 transition-colors">
                Browse Breeds
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex flex-col justify-center items-center bg-amber-100/60 p-12 gap-4">
            {[
              { label: 'Total Animals', value: '—', sub: 'Track your full herd' },
              { label: 'Pregnant', value: '—', sub: 'Upcoming births tracked' },
              { label: 'Low Stock Alerts', value: '—', sub: 'Auto inventory warnings' },
            ].map((stat) => (
              <div key={stat.label} className="w-full bg-white border border-amber-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
                </div>
                <p className="text-2xl font-black text-slate-400">{stat.value}</p>
              </div>
            ))}
            <Link to="/livestock" className="w-full text-center py-3 bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors">
              🐄 Set up your herd →
            </Link>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-slate-950 px-6 py-10 text-white sm:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-emerald-300">
              <Wheat size={20} />
              <span className="text-sm font-bold uppercase tracking-wide">Built for the full agriculture cycle</span>
            </div>
            <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              Marketplace, livestock, analytics, community — one platform, zero switching.
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-50"
            >
              Start free
              <Check size={18} />
            </Link>
            <Link
              to="/livestock"
              className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              🐄 Try Livestock
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
