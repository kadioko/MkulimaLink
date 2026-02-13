import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, TrendingUp, Cloud, Sparkles, User, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCountryStore, COUNTRIES } from '../store/countryStore';

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Market Prices', path: '/market', icon: TrendingUp },
    { name: 'Weather', path: '/weather', icon: Cloud },
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
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">MkulimaLink</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg px-2 py-1.5 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button className="relative p-2 text-gray-600 hover:text-primary-600">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  {user.isPremium && (
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  )}
                  
                  <div className="hidden md:flex items-center space-x-2">
                    <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                      {user.name}
                    </Link>
                    <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link to="/login" className="btn-secondary">Login</Link>
                  <Link to="/register" className="btn-primary">Register</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                  className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
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
            © 2024 MkulimaLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
