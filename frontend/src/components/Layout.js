import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Home, ShoppingBag, TrendingUp, Cloud, Sparkles, User, LogOut,
  Bell, Crown, Heart, ChevronDown, BarChart3, Users, Wrench, BookOpen,
  Gavel, Globe, MessageSquare, Calculator, Leaf, Package, Calendar,
  ShieldCheck, Layers, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCountryStore, COUNTRIES } from '../store/countryStore';
import { useWishlistStore } from '../store/wishlistStore';

function Sprout2({ size = 18, className = '' }) {
  return <Leaf size={size} className={className} />;
}

const NAV_GROUPS = [
  {
    label: 'Marketplace',
    path: '/products',
    icon: ShoppingBag,
    color: 'text-emerald-600',
    items: [
      { name: 'Browse Products', path: '/products', icon: ShoppingBag, desc: 'Find verified farm produce' },
      { name: 'Market Prices', path: '/market', icon: TrendingUp, desc: 'Live commodity prices' },
      { name: 'Live Auctions', path: '/auctions', icon: Gavel, desc: 'Bid on bulk lots in real time' },
      { name: 'Group Buying', path: '/group-buying', icon: Users, desc: 'Pool orders for lower prices' },
      { name: 'Suppliers', path: '/suppliers', icon: Package, desc: 'Verified input suppliers' },
    ],
  },
  {
    label: '🐄 Livestock',
    path: '/livestock',
    icon: null,
    color: 'text-amber-600',
    items: [
      { name: 'Herd Dashboard', path: '/livestock', icon: Home, desc: 'Overview of your animals' },
      { name: 'Calendar', path: '/livestock/calendar', icon: Calendar, desc: 'Events, births & reminders' },
      { name: 'Inventory', path: '/livestock/inventory', icon: Package, desc: 'Feed, meds & equipment stock' },
      { name: 'Reproduction', path: '/livestock/reproduction', icon: Calendar, desc: 'Heat cycles & pregnancy tracker' },
      { name: 'Breeds Library', path: '/livestock/breeds', icon: BookOpen, desc: 'East African breed database' },
      { name: 'Farm Workspace', path: '/livestock/workspace', icon: Layers, desc: 'Multi-farm & team roles' },
    ],
  },
  {
    label: 'Farm Tools',
    path: '/tools/yield-calculator',
    icon: Wrench,
    color: 'text-blue-600',
    items: [
      { name: 'Weather', path: '/weather', icon: Cloud, desc: 'Regional forecasts' },
      { name: 'Crop Calendar', path: '/crop-calendar', icon: Calendar, desc: 'Planting & harvest planner' },
      { name: 'Yield Calculator', path: '/tools/yield-calculator', icon: Calculator, desc: 'Estimate crop output' },
      { name: 'Pest & Disease Guide', path: '/tools/pest-guide', icon: Leaf, desc: 'Identify & treat problems' },
      { name: 'Soil Health Tips', path: '/tools/soil-health', icon: Sprout2, desc: 'Improve your soil' },
      { name: 'AI Insights', path: '/ai-insights', icon: Sparkles, desc: 'ML-powered recommendations', premium: true },
    ],
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    color: 'text-violet-600',
    items: [
      { name: 'Farm Analytics', path: '/analytics', icon: BarChart3, desc: 'Yield, costs & performance' },
      { name: 'Market Intelligence', path: '/analytics/market', icon: TrendingUp, desc: 'Price trends & forecasts' },
      { name: 'Predictive Analytics', path: '/analytics/predictive', icon: Sparkles, desc: 'AI demand forecasting', premium: true },
    ],
  },
  {
    label: 'Community',
    path: '/community',
    icon: Users,
    color: 'text-rose-600',
    items: [
      { name: 'Community Hub', path: '/community', icon: Users, desc: 'Connect with farmers' },
      { name: 'Expert Network', path: '/community/experts', icon: BookOpen, desc: 'Consult agronomists & vets' },
      { name: 'Training Platform', path: '/community/training', icon: Globe, desc: 'Online courses & guides' },
      { name: 'Chat', path: '/chat', icon: MessageSquare, desc: 'Message buyers & sellers' },
    ],
  },
  {
    label: 'Finance',
    path: '/premium',
    icon: Crown,
    color: 'text-amber-500',
    highlight: true,
    items: [
      { name: 'Premium Plans', path: '/premium', icon: Crown, desc: 'Unlock advanced features' },
      { name: 'Loans & Finance', path: '/loans', icon: ShieldCheck, desc: 'Agricultural credit products', premium: true },
      { name: 'Insurance', path: '/insurance', icon: ShieldCheck, desc: 'Crop & livestock coverage', premium: true },
    ],
  },
];

function DropdownMenu({ group, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-white border border-slate-200 shadow-xl z-50 py-2"
          onMouseLeave={onClose}
        >
          {group.items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 group transition-colors"
            >
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                {item.icon
                  ? <item.icon size={14} className="text-slate-500 group-hover:text-emerald-700 transition-colors" />
                  : <span className="text-xs leading-none">•</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                  {item.premium && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold uppercase tracking-wide">Pro</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.desc}</p>
              </div>
            </Link>
          ))}
          <div className="mt-2 mx-4 pt-2 border-t border-slate-100">
            <Link
              to={group.items[0].path}
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState(null);
  const { user, logout } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const { getWishlistCount } = useWishlistStore();
  const wishlistCount = getWishlistCount();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGroupActive = (group) =>
    group.items.some((item) => location.pathname.startsWith(item.path) && item.path !== '/');

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenGroup(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGroup(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-950 transition-all group-hover:bg-emerald-700">
                <span className="text-white font-extrabold text-xl tracking-tighter">M</span>
              </div>
              <span className="hidden text-xl font-black tracking-tight text-slate-950 sm:block">
                Mkulima<span className="text-emerald-700">Link</span>
              </span>
            </Link>

            {/* Desktop mega nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_GROUPS.map((group) => {
                const active = isGroupActive(group);
                const isOpen = openGroup === group.label;
                return (
                  <div key={group.label} className="relative">
                    <button
                      onMouseEnter={() => setOpenGroup(group.label)}
                      onClick={() => setOpenGroup(isOpen ? null : group.label)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all duration-150 rounded-sm ${
                        group.highlight
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {group.icon
                        ? <group.icon size={15} className={active ? 'text-emerald-600' : group.highlight ? 'text-amber-600' : 'text-slate-400'} />
                        : <span className="text-base leading-none">🐄</span>
                      }
                      <span>{group.icon ? group.label : 'Livestock'}</span>
                      <ChevronDown size={13} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''} ${active ? 'text-emerald-500' : 'text-slate-400'}`} />
                    </button>
                    <div onMouseEnter={() => setOpenGroup(group.label)}>
                      <DropdownMenu group={group} isOpen={isOpen} onClose={() => setOpenGroup(null)} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="hidden sm:block cursor-pointer border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-emerald-500"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>

              {user ? (
                <>
                  <Link to="/wishlist" className="relative p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors hidden sm:block">
                    <Heart size={20} />
                    <AnimatePresence>
                      {wishlistCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        >
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors hidden sm:block">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </Link>

                  <div className="h-7 w-px bg-slate-200 hidden sm:block mx-1"></div>

                  <Link to="/profile" className="hidden md:flex items-center gap-2 px-2 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors rounded-sm" title="My Account">
                    <div className="flex h-7 w-7 items-center justify-center bg-emerald-600 text-xs font-bold text-white rounded-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold hidden xl:block">My Account</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 text-emerald-400 hover:bg-slate-800 transition-colors"
                    >
                      <Shield size={12} /> Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="hidden md:block p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-sm"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="px-4 py-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors">Login</Link>
                  <Link to="/register" className="bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Sign Up</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-sm transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-3 py-3 space-y-0.5 max-h-[75vh] overflow-y-auto">
                {NAV_GROUPS.map((group) => {
                  const isExpanded = mobileOpenGroup === group.label;
                  return (
                    <div key={group.label}>
                      <button
                        onClick={() => setMobileOpenGroup(isExpanded ? null : group.label)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors ${
                          group.highlight ? 'bg-amber-50 text-amber-800' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {group.icon
                            ? <group.icon size={16} className={group.highlight ? 'text-amber-600' : 'text-slate-400'} />
                            : <span>🐄</span>
                          }
                          {group.icon ? group.label : 'Livestock'}
                        </span>
                        <ChevronDown size={14} className={`transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden ml-4 border-l-2 border-slate-100 pl-3 mt-0.5 mb-1"
                          >
                            {group.items.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-sm transition-colors"
                              >
                                {item.icon
                                ? <item.icon size={14} className="text-slate-400 flex-shrink-0" />
                                : <span className="text-sm leading-none flex-shrink-0">•</span>
                              }
                              <span>{item.name}</span>
                                {item.premium && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold uppercase ml-auto">Pro</span>
                                )}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <div className="border-t border-slate-100 pt-2 mt-2">
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-sm">
                        <div className="flex h-6 w-6 items-center justify-center bg-emerald-600 text-xs font-bold text-white rounded-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name.split(' ')[0]} — Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-sm">
                        <User size={15} className="text-slate-400" /> Profile
                      </Link>
                      <Link to="/transactions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-sm">
                        <ShoppingBag size={15} className="text-slate-400" /> Transactions
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-sm">
                          <Shield size={15} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-sm w-full">
                        <LogOut size={15} /> Logout
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2 px-2 pt-1">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-sm hover:bg-slate-50">Login</Link>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-semibold text-white bg-emerald-600 rounded-sm hover:bg-emerald-700">Sign Up</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center bg-slate-950">
                  <span className="text-white font-extrabold text-lg tracking-tighter">M</span>
                </div>
                <span className="text-lg font-black text-slate-950">Mkulima<span className="text-emerald-700">Link</span></span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed">
                The complete farm management super-app for East Africa. Marketplace, livestock, analytics & more.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Marketplace</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="text-slate-500 hover:text-emerald-700 transition-colors">Browse Products</Link></li>
                <li><Link to="/market" className="text-slate-500 hover:text-emerald-700 transition-colors">Market Prices</Link></li>
                <li><Link to="/auctions" className="text-slate-500 hover:text-emerald-700 transition-colors">Live Auctions</Link></li>
                <li><Link to="/group-buying" className="text-slate-500 hover:text-emerald-700 transition-colors">Group Buying</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Farm Management</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/livestock" className="text-slate-500 hover:text-emerald-700 transition-colors">🐄 Livestock Hub</Link></li>
                <li><Link to="/crop-calendar" className="text-slate-500 hover:text-emerald-700 transition-colors">Crop Calendar</Link></li>
                <li><Link to="/analytics" className="text-slate-500 hover:text-emerald-700 transition-colors">Farm Analytics</Link></li>
                <li><Link to="/community" className="text-slate-500 hover:text-emerald-700 transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/premium" className="text-slate-500 hover:text-emerald-700 transition-colors">Premium Plans</Link></li>
                <li><a href="mailto:support@mkulimalink.com" className="text-slate-500 hover:text-emerald-700 transition-colors">support@mkulimalink.com</a></li>
                <li><span className="text-slate-400">Tanzania · Kenya · Uganda</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} MkulimaLink. All rights reserved.</p>
            <p className="text-xs text-slate-400">v2.1.0 · Built for East African farmers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
