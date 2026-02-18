import React from 'react';
import { useMutation } from 'react-query';
import { Check, Sparkles, TrendingUp, Target, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useCountryStore } from '../store/countryStore';
import { useNavigate, Link } from 'react-router-dom';

function Premium() {
  const { user, updateUser } = useAuthStore();
  const { country, getCurrency } = useCountryStore();
  const currency = getCurrency();
  const navigate = useNavigate();

  const plans = country === 'KE'
    ? { monthly: { price: 650, label: 'KES/month', yearly: 6500, yearlySaving: 1300 } }
    : { monthly: { price: 10000, label: 'TZS/month', yearly: 100000, yearlySaving: 20000 } };

  const phonePromptText = country === 'KE'
    ? 'Enter your M-Pesa phone number (e.g., +254XXXXXXXXX):'
    : 'Enter your M-Pesa phone number (e.g., +255XXXXXXXXX):';

  const subscribeMutation = useMutation(
    async ({ plan, phoneNumber }) => {
      const response = await api.post('/payments/premium/subscribe', { plan, phoneNumber });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Premium subscription activated!');
        updateUser({ isPremium: true, premiumExpiresAt: data.expiresAt });
        navigate('/ai-insights');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Subscription failed');
      }
    }
  );

  const handleSubscribe = (plan) => {
    if (!user) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }

    const phoneNumber = prompt(phonePromptText);
    if (phoneNumber) {
      subscribeMutation.mutate({ plan, phoneNumber });
    }
  };

  const handleTestPremium = () => {
    if (!user) {
      toast.error('Please login first to test premium');
      navigate('/login');
      return;
    }
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    updateUser({ isPremium: true, premiumExpiresAt: expiresAt });
    toast.success('🎉 Premium activated for testing! Explore all features.');
    navigate('/ai-insights');
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI Crop Yield Predictions',
      description: 'Get accurate predictions for your crop yields based on multiple factors'
    },
    {
      icon: TrendingUp,
      title: 'Market Price Forecasting',
      description: 'Predict future market prices to optimize your selling strategy'
    },
    {
      icon: Target,
      title: 'Smart Buyer Matching',
      description: 'AI-powered matching with the best buyers for your products'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: 'Get faster response times and dedicated customer support'
    },
    {
      icon: Crown,
      title: 'Advanced Analytics',
      description: 'Detailed insights into market trends and competitor analysis'
    },
    {
      icon: Check,
      title: 'Crop Recommendations',
      description: 'AI suggests the best crops for your farm based on conditions'
    }
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mb-4">
          <Crown size={20} />
          <span className="font-semibold">Premium Features</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Unlock the Full Power of MkulimaLink
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get AI-powered insights, advanced analytics, and priority support to maximize your farming success
        </p>
      </div>

      {/* Test / Demo banner */}
      {!user ? (
        <div className="card bg-blue-50 border border-blue-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-900">Want to test premium features?</p>
            <p className="text-sm text-blue-700">Log in with the demo premium account or activate it on your own account.</p>
          </div>
          <Link to="/login" className="btn-primary whitespace-nowrap">Demo Login →</Link>
        </div>
      ) : !user.isPremium ? (
        <div className="card bg-blue-50 border border-blue-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-900">🧪 Test Mode — No payment needed</p>
            <p className="text-sm text-blue-700">Activate premium instantly on your account to explore all features.</p>
          </div>
          <button onClick={handleTestPremium} className="btn-primary whitespace-nowrap">
            ✨ Activate Premium (Free Test)
          </button>
        </div>
      ) : null}

      {user?.isPremium && (
        <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 mb-8">
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-gray-900">You're a Premium Member!</h3>
              <p className="text-gray-700">
                Your subscription expires on {new Date(user.premiumExpiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <feature.icon className="text-primary-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="card border-2 border-gray-200 hover:border-primary-500 transition-colors">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
            <div className="mb-4">
              <span className="text-5xl font-bold text-primary-600">{plans.monthly.price.toLocaleString()}</span>
              <span className="text-gray-600 ml-2">{plans.monthly.label}</span>
            </div>
            <p className="text-gray-600">Perfect for trying out premium features</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>All AI-powered insights</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Unlimited predictions</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Priority buyer matching</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Priority support</span>
            </li>
          </ul>

          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={user?.isPremium || subscribeMutation.isLoading}
            className="btn-primary w-full py-3 text-lg"
          >
            {user?.isPremium ? 'Already Subscribed' : 'Subscribe Monthly'}
          </button>
        </div>

        <div className="card border-2 border-primary-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-sm font-semibold">
            Best Value
          </div>
          
          <div className="text-center mb-6 mt-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly Plan</h3>
            <div className="mb-2">
              <span className="text-5xl font-bold text-primary-600">{plans.monthly.yearly.toLocaleString()}</span>
              <span className="text-gray-600 ml-2">{currency}/year</span>
            </div>
            <p className="text-green-600 font-semibold mb-2">Save {plans.monthly.yearlySaving.toLocaleString()} {currency} per year!</p>
            <p className="text-gray-600">Best for serious farmers</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>All AI-powered insights</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Unlimited predictions</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Priority buyer matching</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span>Priority support</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="text-green-600" size={20} />
              <span className="font-semibold">2 months FREE</span>
            </li>
          </ul>

          <button
            onClick={() => handleSubscribe('yearly')}
            disabled={user?.isPremium || subscribeMutation.isLoading}
            className="btn-primary w-full py-3 text-lg"
          >
            {user?.isPremium ? 'Already Subscribed' : 'Subscribe Yearly'}
          </button>
        </div>
      </div>

      <div className="mt-12 card bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How do I pay for Premium?</h3>
            <p className="text-gray-700">
              Payment is processed securely through M-Pesa. You'll receive a payment prompt on your phone after clicking subscribe.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-700">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens after my subscription expires?</h3>
            <p className="text-gray-700">
              You'll still have access to basic features, but AI insights and advanced analytics will be locked until you renew.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Premium;
