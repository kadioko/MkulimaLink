import React, { useState, useEffect } from 'react';
import { Check, X, Lock, Unlock, Zap, TrendingUp, BarChart3, MapPin } from 'lucide-react';
import api from '../../api/axios';

const PremiumTier = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/api/subscriptions/current');
      setSubscription(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started',
      features: [
        { name: 'Basic farm metrics', included: true },
        { name: 'Manual data entry', included: true },
        { name: 'Limited historical data (30 days)', included: true },
        { name: 'Basic alerts', included: true },
        { name: 'GPS mapping', included: false },
        { name: 'Satellite data', included: false },
        { name: 'Yield predictions', included: false },
        { name: 'Price forecasting', included: false },
        { name: 'Market intelligence', included: false },
        { name: 'Competitor benchmarking', included: false },
        { name: 'Advanced recommendations', included: false },
        { name: 'Data export', included: false },
        { name: 'Priority support', included: false },
        { name: 'API access', included: false }
      ],
      cta: 'Current Plan',
      highlighted: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 20000,
      period: 'month',
      description: 'For serious farmers',
      features: [
        { name: 'Basic farm metrics', included: true },
        { name: 'Manual data entry', included: true },
        { name: 'Limited historical data (30 days)', included: true },
        { name: 'Basic alerts', included: true },
        { name: 'GPS mapping', included: true },
        { name: 'Satellite data', included: true },
        { name: 'Yield predictions', included: true },
        { name: 'Price forecasting', included: true },
        { name: 'Market intelligence', included: true },
        { name: 'Competitor benchmarking', included: true },
        { name: 'Advanced recommendations', included: true },
        { name: 'Data export (CSV, JSON)', included: true },
        { name: 'Priority support', included: false },
        { name: 'API access', included: false }
      ],
      cta: 'Upgrade to Premium',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'month',
      description: 'For agribusinesses',
      features: [
        { name: 'Basic farm metrics', included: true },
        { name: 'Manual data entry', included: true },
        { name: 'Limited historical data (30 days)', included: true },
        { name: 'Basic alerts', included: true },
        { name: 'GPS mapping', included: true },
        { name: 'Satellite data', included: true },
        { name: 'Yield predictions', included: true },
        { name: 'Price forecasting', included: true },
        { name: 'Market intelligence', included: true },
        { name: 'Competitor benchmarking', included: true },
        { name: 'Advanced recommendations', included: true },
        { name: 'Data export (CSV, JSON, PDF)', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access', included: true }
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    try {
      const response = await axios.post('/api/subscriptions/upgrade', {
        plan_id: selectedPlan.id
      });

      if (response.data.success) {
        setSubscription(response.data.data);
        setShowPayment(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics Premium Plans</h1>
          <p className="text-xl text-gray-600 mb-2">Unlock advanced insights for your farm</p>
          <p className="text-gray-500">Choose the perfect plan to maximize your agricultural potential</p>
        </div>

        {/* Current Subscription Info */}
        {subscription && subscription.plan_type !== 'free' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 mb-12 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Current Subscription</h3>
                <p className="text-green-800 mb-1">
                  <strong>Plan:</strong> {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)}
                </p>
                <p className="text-green-800 mb-1">
                  <strong>Expires:</strong> {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
                <p className="text-green-800">
                  <strong>Status:</strong> <span className="text-green-600 font-semibold">Active</span>
                </p>
              </div>
              <Unlock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.highlighted
                  ? 'ring-2 ring-indigo-500 transform scale-105'
                  : ''
              }`}
            >
              {/* Card Header */}
              <div className={`p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-gray-50'
              }`}>
                {plan.highlighted && (
                  <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price}
                  </span>
                  {typeof plan.price === 'number' && (
                    <span className={`ml-2 ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                      TZS/{plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="p-8 bg-white">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={subscription?.plan_type === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                    subscription?.plan_type === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {subscription?.plan_type === plan.id ? 'Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Premium</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Farm Metrics', free: true, premium: true, enterprise: true },
                  { name: 'GPS Mapping', free: false, premium: true, enterprise: true },
                  { name: 'Satellite Data', free: false, premium: true, enterprise: true },
                  { name: 'Yield Predictions', free: false, premium: true, enterprise: true },
                  { name: 'Price Forecasting', free: false, premium: true, enterprise: true },
                  { name: 'Market Intelligence', free: false, premium: true, enterprise: true },
                  { name: 'Benchmarking', free: false, premium: true, enterprise: true },
                  { name: 'Data Export', free: false, premium: true, enterprise: true },
                  { name: 'API Access', free: false, premium: false, enterprise: true },
                  { name: 'Priority Support', free: false, premium: false, enterprise: true }
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
                      {row.premium ? (
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

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <BenefitCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Increase Yield"
            description="Get precise predictions to optimize your farming decisions"
          />
          <BenefitCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Better ROI"
            description="Track performance and identify optimization opportunities"
          />
          <BenefitCard
            icon={<MapPin className="w-8 h-8" />}
            title="Location Insights"
            description="GPS mapping and satellite data for precise farm management"
          />
          <BenefitCard
            icon={<Zap className="w-8 h-8" />}
            title="Real-time Alerts"
            description="Get notified of market opportunities and farm issues instantly"
          />
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept M-Pesa, Airtel Money, bank transfers, and credit cards for premium subscriptions."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes! Start with our Free plan to explore basic features. Upgrade anytime to unlock advanced analytics."
            />
            <FAQItem
              question="Can I upgrade or downgrade my plan?"
              answer="Absolutely! You can change your plan at any time. Changes take effect on your next billing cycle."
            />
            <FAQItem
              question="Do you offer discounts for annual billing?"
              answer="Yes! Annual subscriptions get 2 months free. Contact our sales team for enterprise pricing."
            />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPayment(false)}
          onConfirm={handlePayment}
        />
      )}
    </div>
  );
};

const BenefitCard = ({ icon, title, description }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
    <div className="flex justify-center mb-4 text-indigo-600">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="font-semibold text-gray-900">{question}</h3>
        <span className={`text-2xl text-gray-400 transition ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="text-gray-600 mt-4">{answer}</p>
      )}
    </div>
  );
};

const PaymentModal = ({ plan, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade to {plan.name}</h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-gray-600 mb-2">Monthly Cost</p>
        <p className="text-3xl font-bold text-gray-900">
          {typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price} TZS
        </p>
      </div>
      <div className="space-y-3 mb-6">
        <label className="flex items-center">
          <input type="radio" name="payment" defaultChecked className="mr-3" />
          <span className="text-gray-700">M-Pesa</span>
        </label>
        <label className="flex items-center">
          <input type="radio" name="payment" className="mr-3" />
          <span className="text-gray-700">Airtel Money</span>
        </label>
        <label className="flex items-center">
          <input type="radio" name="payment" className="mr-3" />
          <span className="text-gray-700">Bank Transfer</span>
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Confirm Upgrade
        </button>
      </div>
    </div>
  </div>
);

export default PremiumTier;
