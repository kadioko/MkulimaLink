import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const DEMO_ACCOUNTS = [
  { label: '🌾 Farmer (TZ)', email: 'farmer@demo.com',   password: 'demo1234', desc: 'Tanzania farmer account' },
  { label: '🛒 Buyer (TZ)',   email: 'buyer@demo.com',    password: 'demo1234', desc: 'Tanzania buyer account' },
  { label: '👑 Premium (TZ)', email: 'premium@demo.com',  password: 'demo1234', desc: 'Premium features unlocked' },
  { label: '🌾 Farmer (KE)', email: 'farmer.ke@demo.com', password: 'demo1234', desc: 'Kenya farmer account' },
];

function Login() {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', data);
      setAuth(response.data, response.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account, idx) => {
    setDemoLoading(idx);
    try {
      const response = await api.post('/api/auth/login', {
        email: account.email,
        password: account.password,
      });
      setAuth(response.data, response.data.token);
      toast.success(`Logged in as ${account.label}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo login failed — backend may be restarting, try again in 10s');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your MkulimaLink account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input-field"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="input-field"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-3">
            Quick Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account, idx) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleDemoLogin(account, idx)}
                disabled={demoLoading !== null}
                title={account.desc}
                className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-gray-800">
                  {demoLoading === idx ? 'Signing in...' : account.label}
                </span>
                <span className="text-xs text-gray-400">{account.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Password: <code className="bg-gray-100 px-1 rounded">demo1234</code></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
