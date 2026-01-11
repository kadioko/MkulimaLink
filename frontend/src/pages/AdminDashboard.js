import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  LogOut,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Shield,
  Bell
} from 'lucide-react';
import { useToast } from '../components/Toast';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    'admin-stats',
    async () => {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  );

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery(
    'admin-users',
    async () => {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  );

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery(
    'admin-products',
    async () => {
      const response = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  );

  // Mutations
  const updateUserStatus = useMutation(
    async ({ userId, status }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        success('User status updated successfully');
      },
      onError: (err) => error(err.message)
    }
  );

  const deleteUser = useMutation(
    async (userId) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        success('User deleted successfully');
        setShowUserModal(false);
      },
      onError: (err) => error(err.message)
    }
  );

  const deleteProduct = useMutation(
    async (productId) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-products');
        success('Product deleted successfully');
      },
      onError: (err) => error(err.message)
    }
  );

  // Stats cards
  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  // User management table
  const UserTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'farmer'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateUserStatus.mutate({ 
                        userId: user._id, 
                        status: !user.isActive 
                      })}
                      className={user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                    >
                      {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Product management table
  const ProductTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products?.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.seller?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.price} TZS/{product.unit}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : product.status === 'sold'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProduct.mutate(product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Overview dashboard
  const Overview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users || 0}
          icon={Users}
          change={stats?.userGrowth}
          color="blue"
        />
        <StatCard
          title="Active Products"
          value={stats?.products || 0}
          icon={Package}
          change={stats?.productGrowth}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`TZS ${stats?.revenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          change={stats?.revenueGrowth}
          color="purple"
        />
        <StatCard
          title="Active Orders"
          value={stats?.orders || 0}
          icon={ShoppingBag}
          change={stats?.orderGrowth}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <BarChart3 className="w-16 h-16" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <PieChart className="w-16 h-16" />
          </div>
        </div>
      </div>
    </div>
  );

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'users' && <UserTable />}
        {activeTab === 'products' && <ProductTable />}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500">Orders management coming soon...</p>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500">Analytics dashboard coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500">Admin settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
