const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');

const SEED_SECRET = process.env.SEED_SECRET || 'mkulima-seed-2024';

// Real East African agricultural market prices (TZS)
const marketPricesData = [
  { product: 'Tomatoes', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 30000, max: 40000, average: 35000 }, unit: 'crate', trend: 'rising', changePercentage: 3 },
  { product: 'Tomatoes', category: 'vegetables', market: 'Arusha Central', region: 'Arusha', price: { min: 28000, max: 38000, average: 33000 }, unit: 'crate', trend: 'stable', changePercentage: 0 },
  { product: 'Tomatoes', category: 'vegetables', market: 'Morogoro Market', region: 'Morogoro', price: { min: 25000, max: 35000, average: 30000 }, unit: 'crate', trend: 'rising', changePercentage: 2 },
  { product: 'Maize', category: 'grains', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 85000, max: 95000, average: 90000 }, unit: 'bag', trend: 'falling', changePercentage: -2 },
  { product: 'Maize', category: 'grains', market: 'Dodoma Market', region: 'Dodoma', price: { min: 80000, max: 90000, average: 85000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
  { product: 'Maize', category: 'grains', market: 'Morogoro Market', region: 'Morogoro', price: { min: 82000, max: 92000, average: 87000 }, unit: 'bag', trend: 'rising', changePercentage: 1 },
  { product: 'Onions', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 110000, max: 130000, average: 120000 }, unit: 'bag', trend: 'rising', changePercentage: 5 },
  { product: 'Onions', category: 'vegetables', market: 'Iringa Market', region: 'Iringa', price: { min: 100000, max: 120000, average: 110000 }, unit: 'bag', trend: 'rising', changePercentage: 3 },
  { product: 'Bananas', category: 'fruits', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 13000, max: 17000, average: 15000 }, unit: 'bunch', trend: 'stable', changePercentage: 0 },
  { product: 'Bananas', category: 'fruits', market: 'Arusha Central', region: 'Arusha', price: { min: 12000, max: 16000, average: 14000 }, unit: 'bunch', trend: 'stable', changePercentage: 0 },
  { product: 'Beans', category: 'grains', market: 'Mbeya Market', region: 'Mbeya', price: { min: 230000, max: 270000, average: 250000 }, unit: 'bag', trend: 'falling', changePercentage: -3 },
  { product: 'Beans', category: 'grains', market: 'Iringa Market', region: 'Iringa', price: { min: 240000, max: 280000, average: 260000 }, unit: 'bag', trend: 'rising', changePercentage: 2 },
  { product: 'Cabbage', category: 'vegetables', market: 'Arusha Central', region: 'Arusha', price: { min: 20000, max: 30000, average: 25000 }, unit: 'bag', trend: 'rising', changePercentage: 4 },
  { product: 'Carrots', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 35000, max: 45000, average: 40000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
  { product: 'Rice', category: 'grains', market: 'Mwanza Market', region: 'Mwanza', price: { min: 160000, max: 200000, average: 180000 }, unit: 'bag', trend: 'rising', changePercentage: 1 },
  { product: 'Rice', category: 'grains', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 170000, max: 210000, average: 190000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
  { product: 'Potatoes', category: 'vegetables', market: 'Iringa Market', region: 'Iringa', price: { min: 55000, max: 70000, average: 62000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
  { product: 'Avocados', category: 'fruits', market: 'Kilimanjaro Market', region: 'Kilimanjaro', price: { min: 40000, max: 60000, average: 50000 }, unit: 'bag', trend: 'rising', changePercentage: 6 },
  { product: 'Mangoes', category: 'fruits', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 15000, max: 25000, average: 20000 }, unit: 'bag', trend: 'rising', changePercentage: 8 },
  { product: 'Sweet Potatoes', category: 'vegetables', market: 'Morogoro Market', region: 'Morogoro', price: { min: 30000, max: 45000, average: 37000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
];

// Seed products data (requires a seller user)
const productsData = [
  { name: 'Organic Tomatoes - Fresh', category: 'vegetables', description: 'Fresh, locally grown organic tomatoes from Morogoro. Perfect for cooking and salads.', price: 35000, quantity: 10, unit: 'crate', location: { region: 'Morogoro' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=500&h=500&fit=crop' }] },
  { name: 'Maize - White Corn', category: 'grains', description: 'High-quality white maize suitable for milling. From Dodoma region.', price: 90000, quantity: 50, unit: 'bag', location: { region: 'Dodoma' }, quality: 'standard', organic: false, images: [{ url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop' }] },
  { name: 'Banana Bunch - Ripe', category: 'fruits', description: 'Fresh ripe bananas from Arusha. Perfect for eating or cooking.', price: 15000, quantity: 30, unit: 'bundle', location: { region: 'Arusha' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop' }] },
  { name: 'Onions - Red Variety', category: 'vegetables', description: 'High-quality red onions from Iringa. Great for storage and cooking.', price: 120000, quantity: 20, unit: 'bag', location: { region: 'Iringa' }, quality: 'standard', organic: false, images: [{ url: 'https://images.unsplash.com/photo-1587049633312-d628fb40c321?w=500&h=500&fit=crop' }] },
  { name: 'Beans - Red Kidney', category: 'grains', description: 'Protein-rich red kidney beans from Mbeya. Ideal for stews.', price: 250000, quantity: 15, unit: 'bag', location: { region: 'Mbeya' }, quality: 'standard', organic: false, images: [{ url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop' }] },
  { name: 'Avocados - Hass', category: 'fruits', description: 'Creamy Hass avocados from Kilimanjaro. Perfect for salads and spreads.', price: 50000, quantity: 25, unit: 'bag', location: { region: 'Kilimanjaro' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&h=500&fit=crop' }] },
  { name: 'Rice - Premium Grain', category: 'grains', description: 'Long-grain white rice from Mwanza. Perfect for any dish.', price: 190000, quantity: 40, unit: 'bag', location: { region: 'Mwanza' }, quality: 'premium', organic: false, images: [{ url: 'https://images.unsplash.com/photo-1586985289688-cacf913bb194?w=500&h=500&fit=crop' }] },
  { name: 'Cabbage - Fresh Green', category: 'vegetables', description: 'Crisp green cabbage from Arusha highlands. Great for salads.', price: 25000, quantity: 20, unit: 'bag', location: { region: 'Arusha' }, quality: 'standard', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&h=500&fit=crop' }] },
  { name: 'Carrots - Orange', category: 'vegetables', description: 'Sweet orange carrots from Dar es Salaam. Rich in vitamins.', price: 40000, quantity: 15, unit: 'bag', location: { region: 'Dar es Salaam' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop' }] },
  { name: 'Mangoes - Sweet Alphonso', category: 'fruits', description: 'Juicy sweet mangoes from coastal Tanzania. In season now!', price: 20000, quantity: 40, unit: 'bag', location: { region: 'Dar es Salaam' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1585518419759-3f4ee4dacc51?w=500&h=500&fit=crop' }] },
];

router.post('/run', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== SEED_SECRET) {
      return res.status(403).json({ message: 'Invalid seed secret' });
    }

    const results = { marketPrices: 0, products: 0, users: 0 };

    // 1. Seed market prices — delete old seeded ones first
    await MarketPrice.deleteMany({ source: 'seed' });
    const mpDocs = marketPricesData.map(mp => ({ ...mp, source: 'seed', date: new Date() }));
    await MarketPrice.insertMany(mpDocs);
    results.marketPrices = mpDocs.length;

    // 2. Ensure a demo farmer user exists to be seller
    let demoFarmer = await User.findOne({ email: 'farmer@demo.com' });
    if (!demoFarmer) {
      demoFarmer = await User.create({
        name: 'Demo Farmer TZ', email: 'farmer@demo.com', password: 'demo1234',
        role: 'farmer', phone: '255700000001', location: { region: 'Dar es Salaam' }
      });
      results.users += 1;
    }

    // Also ensure premium and buyer demo accounts exist
    const demoBuyer = await User.findOne({ email: 'buyer@demo.com' });
    if (!demoBuyer) {
      await User.create({ name: 'Demo Buyer TZ', email: 'buyer@demo.com', password: 'demo1234', role: 'buyer', phone: '255700000002', location: { region: 'Dar es Salaam' } });
      results.users += 1;
    }
    const demoPremium = await User.findOne({ email: 'premium@demo.com' });
    if (!demoPremium) {
      await User.create({ name: 'Premium Farmer TZ', email: 'premium@demo.com', password: 'demo1234', role: 'farmer', phone: '255700000003', isPremium: true, location: { region: 'Dar es Salaam' } });
      results.users += 1;
    }
    const demoKe = await User.findOne({ email: 'farmer.ke@demo.com' });
    if (!demoKe) {
      await User.create({ name: 'Demo Farmer KE', email: 'farmer.ke@demo.com', password: 'demo1234', role: 'farmer', phone: '254700000004', location: { region: 'Nairobi' } });
      results.users += 1;
    }

    // 3. Seed products — delete old seeded ones for this demo seller
    await Product.deleteMany({ seller: demoFarmer._id, status: 'active' });
    const productDocs = productsData.map(p => ({ ...p, seller: demoFarmer._id, status: 'active' }));
    await Product.insertMany(productDocs);
    results.products = productDocs.length;

    res.json({
      message: '✅ Seed complete!',
      results,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET endpoint to check current data counts
router.get('/status', async (req, res) => {
  try {
    const [products, marketPrices, users] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      MarketPrice.countDocuments(),
      User.countDocuments(),
    ]);
    res.json({ products, marketPrices, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
