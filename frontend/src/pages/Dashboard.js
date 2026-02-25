import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ShoppingBag, TrendingUp, DollarSign, Package, Plus, Cloud } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useCountryStore } from '../store/countryStore';

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
    if (!isFarmer) return [];
    const response = await api.get('/products/my/listings');
    return response.data;
  }, {
    enabled: isFarmer
  });

  const { data: transactions } = useQuery('recent-transactions', async () => {
    const endpoint = isFarmer ? '/transactions/my/sales' : '/transactions/my/purchases';
    const response = await api.get(endpoint);
    return response.data.slice(0, 5);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        {isFarmer && (
          <Link to="/add-product" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Transactions</span>
            <ShoppingBag className="text-primary-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Completed</span>
            <Package className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.completedTransactions || 0}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{isFarmer ? 'Revenue' : 'Spent'}</span>
            <DollarSign className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currency} {(stats?.totalRevenue || 0).toLocaleString()}
          </p>
        </div>

        {isFarmer && (
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Active Listings</span>
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {products?.filter(p => p.status === 'active').length || 0}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isFarmer && products && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Listings</h2>
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.quantity} {product.unit} • {product.currency || currency} {product.price.toLocaleString()}/{product.unit}
                    </p>
                  </div>
                  <span className={`badge ${
                    product.status === 'active' ? 'badge-success' :
                    product.status === 'sold' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {product.status}
                  </span>
                </Link>
              ))}
              {products.length === 0 && (
                <p className="text-gray-500 text-center py-4">No products listed yet</p>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions?.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.product?.name || 'Product'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.quantity} {transaction.product?.unit} • {currency} {transaction.totalAmount.toLocaleString()}
                  </p>
                </div>
                <span className={`badge ${
                  transaction.status === 'completed' ? 'badge-success' :
                  transaction.status === 'pending' ? 'badge-warning' :
                  transaction.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                }`}>
                  {transaction.status}
                </span>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Free Tools Section */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Free Farming Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/products" className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Marketplace</h3>
              <p className="text-sm text-gray-600">Browse and trade agricultural products directly.</p>
            </div>
          </Link>
          
          <Link to="/market" className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Live Market Prices</h3>
              <p className="text-sm text-gray-600">Check current wholesale prices across East Africa.</p>
            </div>
          </Link>

          <Link to="/weather" className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Weather Forecast</h3>
              <p className="text-sm text-gray-600">Get basic localized weather updates for your farm.</p>
            </div>
          </Link>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-not-allowed opacity-80">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <span className="text-xl font-bold">🌾</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Crop Yield Calculator <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-1">SOON</span></h3>
              <p className="text-sm text-gray-600">Estimate your harvest yield based on land size and crop type.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-not-allowed opacity-80">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <span className="text-xl font-bold">🐛</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Pest & Disease Guide <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-1">SOON</span></h3>
              <p className="text-sm text-gray-600">Identify common pests and learn basic organic treatments.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-not-allowed opacity-80">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <span className="text-xl font-bold">🌱</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Soil Health Tips <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-1">SOON</span></h3>
              <p className="text-sm text-gray-600">Basic guides on maintaining soil fertility and compost making.</p>
            </div>
          </div>
        </div>
      </div>

      {!user?.isPremium ? (
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upgrade to Premium
              </h3>
              <p className="text-gray-700 mb-4">
                Get AI-powered insights, crop yield predictions, and advanced market analysis
              </p>
              <Link to="/premium" className="btn-primary inline-block">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-gradient-to-r from-primary-50 to-green-100 rounded-xl p-6 border-2 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">👑</span> Welcome to Premium
              </h3>
              <p className="text-gray-700 mb-4">
                As a premium member, you have access to advanced AI-powered tools to boost your farming and trading success.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Link to="/ai-insights" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary-700 mb-1">✨ AI Crop Insights</h4>
                  <p className="text-sm text-gray-600">Get personalized crop management and disease detection.</p>
                </Link>
                <Link to="/market" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary-700 mb-1">📈 Advanced Trends</h4>
                  <p className="text-sm text-gray-600">Access historical price data and future market predictions.</p>
                </Link>
                <Link to="/weather" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-primary-700 mb-1">🌦️ Smart Weather</h4>
                  <p className="text-sm text-gray-600">Detailed hyperlocal weather forecasting and farming tips.</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
