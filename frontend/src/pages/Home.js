import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Cloud, Shield, Smartphone, Zap, ArrowRight, Check, User, ShoppingBag } from 'lucide-react';
import { AnimatedFeatureCard } from '../components/animations';
import { StaggerContainer, StaggerItem } from '../components/animations/FadeIn';

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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-8 md:p-16 mb-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full"
          />
          <motion.div
            animate={{ 
              rotate: -360,
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full"
          />
        </div>
        
        <div className="relative max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🌾 Now serving Tanzania & Kenya
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Connecting East Africa's Agriculture Community
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-green-100"
          >
            Empowering farmers and buyers with AI-powered marketplace solutions
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/register" className="group bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2">
                Get Started Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/products" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-green-600 transition-all inline-block">
                Browse Products
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20"
          >
            {[
              { value: '10K+', label: 'Farmers' },
              { value: '5K+', label: 'Buyers' },
              { value: '50K+', label: 'Transactions' },
            ].map((stat, i) => (
              <div key={i} className="text-center sm:text-left">
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-green-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Why Choose MkulimaLink?</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Everything you need to succeed in agricultural trading
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </section>

      {/* Premium Section */}
      <section className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-8 md:p-16 mb-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto relative z-10"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4 rounded-2xl mb-6 shadow-lg"
          >
            <Sparkles size={32} />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Unlock Premium Features
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get advanced AI insights, crop yield predictions, and priority buyer matching
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            {[
              'AI Crop Predictions',
              'Priority Matching',
              'Market Analytics',
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 text-gray-700"
              >
                <Check size={20} className="text-green-500" />
                {feature}
              </motion.div>
            ))}
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/premium" className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all">
              Explore Premium
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Process</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">How It Works</h2>
        </motion.div>
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.15}>
          {[
            { step: '1', title: 'Create Your Account', desc: 'Sign up as a farmer or buyer in minutes', icon: User },
            { step: '2', title: 'List or Browse Products', desc: 'Farmers list products, buyers find what they need', icon: ShoppingBag },
            { step: '3', title: 'Complete Transactions', desc: 'Secure payments via M-Pesa with SMS notifications', icon: Shield },
          ].map((item, index) => (
            <StaggerItem key={index}>
              <div className="text-center group">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow"
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Final CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 w-60 h-60 border border-white/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -right-20 w-80 h-80 border border-white/10 rounded-full"
          />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Agriculture Business?
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Join thousands of farmers and buyers across East Africa who are already using MkulimaLink
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link to="/register" className="group bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all inline-flex items-center gap-2">
              Join MkulimaLink Today
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-green-200 text-sm"
          >
            Free to get started • No credit card required
          </motion.p>
        </div>
      </motion.section>
    </div>
  );
}

export default Home;
