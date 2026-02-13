import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Cloud, Shield, Smartphone, Zap } from 'lucide-react';

function Home() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description: 'Get intelligent crop yield predictions and market analysis powered by advanced AI'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Market Prices',
      description: 'Track live market prices across Tanzania to make informed selling decisions'
    },
    {
      icon: Cloud,
      title: 'Weather Forecasting',
      description: 'Access accurate weather forecasts and alerts tailored to your region'
    },
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Safe and secure payments through M-Pesa with buyer protection'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Optimized for mobile devices with low-bandwidth support'
    },
    {
      icon: Zap,
      title: 'Instant Matching',
      description: 'AI-powered buyer-seller matching for faster transactions'
    }
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl p-8 md:p-12 mb-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Connecting East Africa's Agriculture Community
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Empowering farmers and buyers across Tanzania & Kenya
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-center">
              Get Started
            </Link>
            <Link to="/products" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors text-center">
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose MkulimaLink?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-2xl p-8 md:p-12 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Unlock Premium Features
          </h2>
          <p className="text-xl text-gray-700 mb-6">
            Get advanced AI insights, crop yield predictions, and priority buyer matching
          </p>
          <Link to="/premium" className="btn-primary inline-block px-8 py-3 text-lg">
            Explore Premium
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
            <p className="text-gray-600">Sign up as a farmer or buyer in minutes</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">List or Browse Products</h3>
            <p className="text-gray-600">Farmers list products, buyers find what they need</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Complete Transactions</h3>
            <p className="text-gray-600">Secure payments via M-Pesa with SMS notifications</p>
          </div>
        </div>
      </section>

      <section className="bg-primary-600 text-white rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Agriculture Business?</h2>
        <p className="text-xl mb-6 text-primary-100">
          Join thousands of farmers and buyers across East Africa
        </p>
        <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-block">
          Join MkulimaLink Today
        </Link>
      </section>
    </div>
  );
}

export default Home;
