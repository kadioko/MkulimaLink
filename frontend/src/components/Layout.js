import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, ShoppingBag, TrendingUp, Cloud, Sparkles, User, LogOut, Bell, Crown, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCountryStore, COUNTRIES } from '../store/countryStore';
import { useWishlistStore } from '../store/wishlistStore';

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const { getWishlistCount } = useWishlistStore();
  const wishlistCount = getWishlistCount();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Market Prices', path: '/market', icon: TrendingUp },
    { name: 'Weather', path: '/weather', icon: Cloud },
    { name: 'Premium', path: '/premium', icon: Crown, highlight: true },
  ];

  const userNavItems = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'My Transactions', path: '/transactions', icon: ShoppingBag },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles, premium: true },
    { name: 'Profile', path: '/profile', icon: User },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between py-3">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="flex h-11 w-11 items-center justify-center bg-slate-950 shadow-sm transition-all group-hover:bg-emerald-700">
                  <span className="text-white font-extrabold text-2xl tracking-tighter">M</span>
                </div>
                <span className="hidden text-2xl font-black tracking-tight text-slate-950 sm:block">Mkulima<span className="text-emerald-700">Link</span></span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center border border-slate-200 bg-slate-50 p-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        item.highlight 
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                          : active
                            ? 'bg-white text-emerald-800 shadow-sm'
                            : 'text-slate-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <item.icon size={18} className={item.highlight ? 'text-amber-700' : active ? 'text-emerald-700' : 'text-slate-400'} />
                      {item.name}
                    </Link>
                  );
                })}
                
                {user && userNavItems.filter(i => i.name !== 'Profile').map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        active ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <item.icon size={18} className={active ? "text-emerald-700" : "text-slate-400"} />
                      {item.name}
                      {item.premium && !user.isPremium && (
                        <span className="text-[9px] bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm ml-1">Pro</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4 lg:space-x-6">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="cursor-pointer border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>

              {user ? (
                <div className="flex items-center space-x-3">
                  <Link to="/wishlist" className="relative p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors hidden sm:block">
                    <Heart size={22} />
                    <AnimatePresence>
                      {wishlistCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                        >
                          {wishlistCount > 9 ? '9+' : wishlistCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                  <button className="relative hidden p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 sm:block">
                    <Bell size={22} />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  
                  <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                  
                  <div className="hidden md:flex items-center space-x-3">
                    <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium">
                      <div className="flex h-8 w-8 items-center justify-center bg-emerald-100 text-sm font-bold text-emerald-800">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden xl:block">{user.name.split(' ')[0]}</span>
                    </Link>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Logout">
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to="/login" className="px-4 py-2 font-semibold text-slate-600 transition-colors hover:text-emerald-800">Login</Link>
                  <Link to="/register" className="bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow">Sign Up</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    item.highlight
                      ? 'bg-yellow-100 text-yellow-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  {userNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                      {item.premium && !user.isPremium && (
                        <span className="badge-warning">Premium</span>
                      )}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-red-600 hover:bg-gray-100 px-3 py-2 rounded-md w-full"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              )}
              
              {!user && (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2">
                    <button className="btn-secondary w-full">Login</button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2">
                    <button className="btn-primary w-full">Register</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MkulimaLink</h3>
              <p className="text-gray-600 text-sm">
                Connecting East African farmers and buyers with AI-powered marketplace solutions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="text-gray-600 hover:text-primary-600">Browse Products</Link></li>
                <li><Link to="/market" className="text-gray-600 hover:text-primary-600">Market Prices</Link></li>
                <li><Link to="/weather" className="text-gray-600 hover:text-primary-600">Weather Forecast</Link></li>
                <li><Link to="/premium" className="text-gray-600 hover:text-primary-600">Premium Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <p className="text-gray-600 text-sm">
                Email: support@mkulimalink.com<br />
                Serving Tanzania & Kenya<br />
                Dar es Salaam | Nairobi
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} MkulimaLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
