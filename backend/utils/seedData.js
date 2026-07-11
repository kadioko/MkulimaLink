const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await MarketPrice.deleteMany({});

    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const farmer1 = await User.create({
      name: 'John Mkulima',
      email: 'farmer@demo.com',
      phone: '+255712345678',
      password: hashedPassword,
      role: 'farmer',
      location: { region: 'Arusha', district: 'Arusha Urban' },
      isVerified: true
    });

    const buyer1 = await User.create({
      name: 'Jane Mnunuzi',
      email: 'buyer@demo.com',
      phone: '+255787654321',
      password: hashedPassword,
      role: 'buyer',
      location: { region: 'Dar es Salaam', district: 'Ilala' },
      isVerified: true
    });

    console.log('Created demo users');

    // Create demo products
    const products = [
      { name: 'Fresh Maize', category: 'grains', price: 1500, quantity: 500, unit: 'kg', seller: farmer1._id },
      { name: 'Organic Tomatoes', category: 'vegetables', price: 3000, quantity: 200, unit: 'kg', seller: farmer1._id },
      { name: 'Fresh Beans', category: 'grains', price: 2500, quantity: 300, unit: 'kg', seller: farmer1._id },
      { name: 'Cassava', category: 'tubers', price: 800, quantity: 1000, unit: 'kg', seller: farmer1._id },
      { name: 'Bananas', category: 'fruits', price: 1200, quantity: 400, unit: 'bunch', seller: farmer1._id }
    ];

    for (const product of products) {
      await Product.create({
        ...product,
        description: `High quality ${product.name.toLowerCase()} from Arusha region`,
        location: { region: 'Arusha', district: 'Arusha Urban' },
        status: 'active'
      });
    }

    console.log('Created demo products');

    // Create market prices
    const crops = ['Maize', 'Rice', 'Beans', 'Tomatoes', 'Onions', 'Potatoes'];
    const regions = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya'];

    for (const crop of crops) {
      for (const region of regions) {
        await MarketPrice.create({
          product: crop,
          category: crop === 'Maize' || crop === 'Rice' || crop === 'Beans' ? 'grains' : 'vegetables',
          market: `${region} Central Market`,
          region,
          currentPrice: Math.floor(Math.random() * 3000) + 1000,
          minPrice: Math.floor(Math.random() * 1000) + 500,
          maxPrice: Math.floor(Math.random() * 2000) + 3000,
          unit: 'kg',
          date: new Date(),
          source: 'market_survey',
          trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
          changePercent: (Math.random() * 20 - 10).toFixed(2)
        });
      }
    }

    console.log('Created market prices');
    console.log('\n✅ Seed data created successfully!');
    console.log('\nDemo Accounts:');
    console.log('  Farmer: farmer@demo.com / password123');
    console.log('  Buyer: buyer@demo.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();



