import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, TrendingUp, Cloud, Sparkles, User, LogOut, Bell, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCountryStore, COUNTRIES } from '../store/countryStore';

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { country, setCountry } = useCountryStore();
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 py-3">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <span className="text-white font-extrabold text-2xl tracking-tighter">M</span>
                </div>
                <span className="text-2xl font-black text-gray-900 hidden sm:block tracking-tight">Mkulima<span className="text-primary-600">Link</span></span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center space-x-1.5 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        item.highlight 
                          ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 hover:from-yellow-100 hover:to-yellow-200 shadow-sm ring-1 ring-yellow-200/50' 
                          : active
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-primary-700 hover:bg-white hover:shadow-sm'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <item.icon size={18} className={item.highlight ? 'text-yellow-600' : active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'} />
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        active ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-primary-700 hover:bg-white hover:shadow-sm'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <item.icon size={18} className={active ? "text-primary-600" : "text-gray-400"} />
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
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-3 py-2 hover:bg-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer transition-colors outline-none"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {user ? (
                <div className="flex items-center space-x-3">
                  <button className="relative p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors hidden sm:block">
                    <Bell size={22} />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  
                  <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                  
                  <div className="hidden md:flex items-center space-x-3">
                    <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
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
                  <Link to="/login" className="px-4 py-2 text-gray-600 font-semibold hover:text-primary-600 transition-colors">Login</Link>
                  <Link to="/register" className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5">Sign Up</Link>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
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
