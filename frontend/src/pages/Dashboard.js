import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ShoppingBag, TrendingUp, DollarSign, Package, Plus, Cloud,
  BarChart3, Users, Calendar, Leaf, Calculator, Gavel, Crown,
  Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useCountryStore } from '../store/countryStore';

const MODULE_SHORTCUTS = [
  {
    label: 'Marketplace',
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    items: [
      { name: 'Products', path: '/products', icon: ShoppingBag },
      { name: 'Market Prices', path: '/market', icon: TrendingUp },
      { name: 'Live Auctions', path: '/auctions', icon: Gavel },
      { name: 'Group Buying', path: '/group-buying', icon: Users },
    ],
  },
  {
    label: '🐄 Livestock',
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    items: [
      { name: 'Herd', path: '/livestock', emoji: '🐄' },
      { name: 'Inventory', path: '/livestock/inventory', icon: Package },
      { name: 'Reproduction', path: '/livestock/reproduction', icon: Calendar },
      { name: 'Breeds', path: '/livestock/breeds', icon: Leaf },
    ],
  },
  {
    label: 'Farm Tools',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    items: [
      { name: 'Weather', path: '/weather', icon: Cloud },
      { name: 'Crop Calendar', path: '/crop-calendar', icon: Calendar },
      { name: 'Yield Calc', path: '/tools/yield-calculator', icon: Calculator },
      { name: 'Pest Guide', path: '/tools/pest-guide', emoji: '🐛' },
    ],
  },
  {
    label: 'Analytics',
    color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    items: [
      { name: 'Farm Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Market Intel', path: '/analytics/market', icon: TrendingUp },
      { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
      { name: 'Predictive', path: '/analytics/predictive', icon: BarChart3 },
    ],
  },
  {
    label: 'Community',
    color: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
    items: [
      { name: 'Hub', path: '/community', icon: Users },
      { name: 'Experts', path: '/community/experts', emoji: '👨‍🌾' },
      { name: 'Training', path: '/community/training', emoji: '📚' },
      { name: 'Chat', path: '/chat', emoji: '💬' },
    ],
  },
  {
    label: 'Finance',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-700',
    items: [
      { name: 'Premium', path: '/premium', icon: Crown },
      { name: 'Loans', path: '/loans', emoji: '🏦' },
      { name: 'Insurance', path: '/insurance', emoji: '🛡️' },
      { name: 'Transactions', path: '/transactions', icon: ShoppingBag },
    ],
  },
];

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`p-2 ${color}`}>
          <Icon size={16} className="text-current" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuthStore();
  const { getCurrency } = useCountryStore();
  const currency = getCurrency();
  const isFarmer = user?.role === 'farmer';

  const { data: stats } = useQuery('dashboard-stats', async () => {
    const response = await api.get('/transactions/stats/dashboard');
    return response.data;
  });

  const { data: products } = useQuery('my-products', async () => {
    const response = await api.get('/products/my/listings');
    return Array.isArray(response.data)
      ? response.data
      : (response.data?.products || response.data?.data || []);
  }, { enabled: isFarmer });

  const { data: transactions } = useQuery('recent-transactions', async () => {
    const endpoint = isFarmer ? '/transactions/my/sales' : '/transactions/my/purchases';
    const response = await api.get(endpoint);
    const list = Array.isArray(response.data)
      ? response.data
      : (response.data?.transactions || response.data?.data || []);
    return list.slice(0, 5);
  });

  const { data: livestockStats } = useQuery('livestock-stats', async () => {
    const response = await api.get('/livestock/stats');
    return response.data.data;
  }, { retry: false });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening on your farm today.</p>
        </div>
        <div className="flex gap-2">
          {isFarmer && (
            <Link to="/add-product" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors">
              <Plus size={16} /> Add Product
            </Link>
          )}
          <Link to="/livestock" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm font-semibold hover:bg-amber-100 transition-colors">
            🐄 Livestock
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Transactions" value={stats?.totalTransactions || 0} icon={ShoppingBag} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Completed" value={stats?.completedTransactions || 0} icon={CheckCircle2} color="bg-green-50 text-green-600" />
        <StatCard label={isFarmer ? 'Revenue' : 'Spent'} value={`${currency} ${(stats?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-blue-50 text-blue-600" />
        <StatCard label="Active Listings" value={products?.filter(p => p.status === 'active').length || 0} icon={TrendingUp} color="bg-violet-50 text-violet-600" />
      </div>

      {/* Module shortcuts grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MODULE_SHORTCUTS.map((mod) => (
            <div key={mod.label} className={`border p-4 ${mod.color} transition-colors`}>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">{mod.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {mod.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors rounded-sm truncate"
                  >
                    {item.emoji
                      ? <span className="text-sm flex-shrink-0">{item.emoji}</span>
                      : <item.icon size={12} className="flex-shrink-0 text-slate-400" />
                    }
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Livestock snapshot + Transactions side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Livestock snapshot */}
        <div className="bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">🐄 Livestock Snapshot</h2>
            <Link to="/livestock" className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {livestockStats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-100 p-3 text-center">
                <p className="text-2xl font-bold text-amber-800">{livestockStats.totalAnimals || 0}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Total Animals</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-800">{livestockStats.activeAnimals || 0}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Active</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 text-center">
                <p className="text-2xl font-bold text-rose-800">{livestockStats.pregnant || 0}</p>
                <p className="text-xs text-rose-600 font-medium mt-0.5">Pregnant</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 text-center">
                <p className="text-2xl font-bold text-orange-800">{livestockStats.lowStockAlerts || 0}</p>
                <p className="text-xs text-orange-600 font-medium mt-0.5">Low Stock Alerts</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <span className="text-4xl mb-2">🐄</span>
              <p className="text-sm font-medium text-slate-600">No livestock data yet</p>
              <Link to="/livestock" className="mt-3 text-xs font-semibold text-emerald-700 hover:underline">
                Set up your herd →
              </Link>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link to="/livestock/reproduction" className="text-center py-2 border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors">Reproduction</Link>
            <Link to="/livestock/inventory" className="text-center py-2 border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors">Inventory</Link>
            <Link to="/livestock/workspace" className="text-center py-2 border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors">Workspace</Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {transactions?.map((t) => (
              <div key={t._id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors rounded-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.product?.name || 'Product'}</p>
                  <p className="text-xs text-slate-500">{t.quantity} {t.product?.unit} · {currency} {t.totalAmount?.toLocaleString()}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  t.status === 'completed' ? 'bg-green-100 text-green-700' :
                  t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  t.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>{t.status}</span>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Listings (farmers only) */}
      {isFarmer && products && products.length > 0 && (
        <div className="bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">My Listings</h2>
            <Link to="/add-product" className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
              <Plus size={12} /> Add new
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.slice(0, 6).map((p) => (
              <Link
                key={p._id}
                to={`/products/${p._id}`}
                className="flex items-center justify-between p-3 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors rounded-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.quantity} {p.unit} · {currency} {p.price?.toLocaleString()}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' :
                  p.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Premium upsell / premium tools */}
      {!user?.isPremium ? (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} className="text-amber-600" />
              <h3 className="font-bold text-slate-900">Unlock Premium Features</h3>
            </div>
            <p className="text-sm text-slate-600">AI Insights, Predictive Analytics, Livestock Reports, and more.</p>
          </div>
          <Link to="/premium" className="flex-shrink-0 bg-amber-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-amber-700 transition-colors whitespace-nowrap">
            Upgrade Now
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">👑</span>
            <h3 className="font-bold text-slate-900">Premium Active</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'AI Insights', path: '/ai-insights', icon: Sparkles },
              { label: 'Predictive Analytics', path: '/analytics/predictive', icon: BarChart3 },
              { label: 'Market Intelligence', path: '/analytics/market', icon: TrendingUp },
              { label: 'Expert Network', path: '/community/experts', icon: Users },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 bg-white border border-emerald-100 p-3 hover:border-emerald-300 transition-colors rounded-sm text-sm font-semibold text-slate-700"
              >
                <item.icon size={15} className="text-emerald-600" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
