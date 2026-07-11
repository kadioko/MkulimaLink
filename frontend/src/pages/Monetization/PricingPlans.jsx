import React, { useState, useEffect } from 'react';
import { Check, X, Zap, Award, Building2 } from 'lucide-react';
import api from '../../api/axios';

const PricingPlans = () => {
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tiersRes, subRes] = await Promise.all([
        api.get('/api/monetization/tiers'),
        api.get('/api/monetization/subscription/current')
      ]);

      setTiers(tiersRes.data);
      setCurrentSubscription(subRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleUpgrade = (tier) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading pricing plans...</div>;
  }

  const planDetails = {
    farmer_premium: {
      icon: <Zap className="w-12 h-12" />,
      color: 'from-green-500 to-emerald-500',
      description: 'Perfect for serious farmers'
    },
    business_premium: {
      icon: <Building2 className="w-12 h-12" />,
      color: 'from-blue-500 to-cyan-500',
      description: 'For agricultural businesses'
    },
    enterprise: {
      icon: <Award className="w-12 h-12" />,
      color: 'from-purple-500 to-pink-500',
      description: 'Custom enterprise solutions'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade Your Experience</h1>
          <p className="text-xl text-gray-600">Choose the perfect plan for your farming needs</p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-12 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Current Subscription</h3>
                <p className="text-blue-800">
                  <strong>Plan:</strong> {currentSubscription.tier_name} • 
                  <strong className="ml-2">Expires:</strong> {new Date(currentSubscription.expires_at).toLocaleDateString()}
                </p>
              </div>
              <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Active</span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier) => {
            const details = planDetails[tier.id];
            const isCurrentPlan = currentSubscription?.tier_id === tier.id;

            return (
              <div
                key={tier.id}
                className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                  isCurrentPlan
                    ? 'ring-4 ring-green-500 transform scale-105'
                    : tier.id === 'business_premium'
                    ? 'ring-2 ring-blue-300'
                    : ''
                }`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${details.color} text-white p-8`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="opacity-80">{details.icon}</div>
                    {isCurrentPlan && (
                      <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm opacity-90">{details.description}</p>
                </div>

                {/* Price */}
                <div className="p-8 bg-white">
                  <div className="mb-6">
                    {tier.price ? (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          {tier.price.toLocaleString()}
                          <span className="text-lg text-gray-600 ml-2">TZS</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">per month</p>
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">Custom Pricing</div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {[...Array(tier.features)].map((_, i) => (
                      <div key={i} className="flex items-center text-gray-700">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">Premium feature {i + 1}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(tier)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                      isCurrentPlan
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : tier.id === 'business_premium'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : tier.price ? 'Upgrade Now' : 'Contact Sales'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Farmer Premium</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Business Premium</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Basic Analytics', free: true, farmer: true, business: true, enterprise: true },
                  { name: 'Advanced Analytics', free: false, farmer: true, business: true, enterprise: true },
                  { name: 'GPS Mapping', free: false, farmer: true, business: true, enterprise: true },
                  { name: 'Expert Consultations', free: false, farmer: true, business: true, enterprise: true },
                  { name: 'API Access', free: false, farmer: false, business: true, enterprise: true },
                  { name: 'Bulk Operations', free: false, farmer: false, business: true, enterprise: true },
                  { name: 'Dedicated Support', free: false, farmer: false, business: true, enterprise: true },
                  { name: 'Custom Integration', free: false, farmer: false, business: false, enterprise: true },
                  { name: 'White Label', free: false, farmer: false, business: false, enterprise: true }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900 font-medium">{row.name}</td>
                    <td className="py-4 px-4 text-center">
                      {row.free ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.farmer ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.business ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.enterprise ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <PaymentModal
          tier={selectedTier}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

const PaymentModal = ({ tier, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      await axios.post('/api/monetization/subscribe', {
        tier_id: tier.id,
        payment_method: paymentMethod
      });

      onSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to {tier.name}</h2>
        <p className="text-gray-600 mb-6">Complete your upgrade to unlock premium features</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-600 mb-2">Monthly Cost</p>
          <p className="text-3xl font-bold text-gray-900">
            {tier.price?.toLocaleString() || 'Custom'} TZS
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
            <input
              type="radio"
              name="payment"
              value="mpesa"
              checked={paymentMethod === 'mpesa'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <span className="font-medium text-gray-900">M-Pesa</span>
          </label>
          <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
            <input
              type="radio"
              name="payment"
              value="airtel"
              checked={paymentMethod === 'airtel'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <span className="font-medium text-gray-900">Airtel Money</span>
          </label>
          <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
            <input
              type="radio"
              name="payment"
              value="bank_transfer"
              checked={paymentMethod === 'bank_transfer'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <span className="font-medium text-gray-900">Bank Transfer</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
