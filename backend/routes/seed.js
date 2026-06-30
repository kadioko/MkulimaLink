const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');
const Transaction = require('../models/Transaction');
const FarmWorkspace = require('../models/FarmWorkspace');
const Livestock = require('../models/Livestock');
const LivestockEvent = require('../models/LivestockEvent');
const LivestockInventory = require('../models/LivestockInventory');
const Reproduction = require('../models/Reproduction');

const getSeedSecret = () => {
  if (process.env.SEED_SECRET) {
    return process.env.SEED_SECRET;
  }

  return process.env.NODE_ENV === 'production' ? null : 'mkulima-seed-2024';
};

// Real East African agricultural market prices (TZS)
const marketPricesData = [
  { product: 'Tomatoes', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', price: { min: 30000, max: 40000, average: 35000 }, unit: 'bag', trend: 'rising', changePercentage: 3 },
  { product: 'Tomatoes', category: 'vegetables', market: 'Arusha Central', region: 'Arusha', price: { min: 28000, max: 38000, average: 33000 }, unit: 'bag', trend: 'stable', changePercentage: 0 },
  { product: 'Tomatoes', category: 'vegetables', market: 'Morogoro Market', region: 'Morogoro', price: { min: 25000, max: 35000, average: 30000 }, unit: 'bag', trend: 'rising', changePercentage: 2 },
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
  { name: 'Organic Tomatoes - Fresh', category: 'vegetables', description: 'Fresh, locally grown organic tomatoes from Morogoro. Perfect for cooking and salads.', price: 35000, quantity: 10, unit: 'bag', location: { region: 'Morogoro' }, quality: 'premium', organic: true, images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=500&h=500&fit=crop' }] },
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
    const seedSecret = getSeedSecret();
    if (!seedSecret) {
      return res.status(503).json({ message: 'Seed route is not configured' });
    }

    if (secret !== seedSecret) {
      return res.status(403).json({ message: 'Invalid seed secret' });
    }

    const results = {
      marketPrices: 0,
      products: 0,
      usersCreated: 0,
      usersUpdated: 0,
      transactions: 0,
      workspaces: 0,
      livestock: 0,
      livestockEvents: 0,
      livestockInventory: 0,
      reproductionRecords: 0,
    };

    await MarketPrice.deleteMany({ source: 'seed' });
    const mpDocs = marketPricesData.map(mp => ({ ...mp, source: 'seed', date: new Date() }));
    await MarketPrice.insertMany(mpDocs);
    results.marketPrices = mpDocs.length;

    const upsertDemoUser = async (email, createData, updateData) => {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email, password: 'demo1234', ...createData, ...updateData });
        results.usersCreated += 1;
      } else {
        Object.assign(user, updateData);
        await user.save();
        results.usersUpdated += 1;
      }
      return user;
    };

    const demoFarmer = await upsertDemoUser(
      'farmer@demo.com',
      { name: 'Demo Farmer TZ', role: 'farmer', phone: '255700000001' },
      {
        name: 'Demo Farmer TZ',
        role: 'farmer',
        phone: '255700000001',
        verified: true,
        isPremium: false,
        rating: 4.7,
        totalRatings: 18,
        balance: 385000,
        location: { region: 'Morogoro', district: 'Mvomero', ward: 'Mlali', coordinates: { latitude: -6.819, longitude: 37.661 } },
        farmDetails: { farmSize: 14.5, crops: ['Tomatoes', 'Maize', 'Cabbage', 'Dairy Cattle'], farmingMethod: 'mixed' },
        notificationPreferences: { sms: true, email: true, push: true },
        isActive: true,
        isBanned: false,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }
    );

    const demoBuyer = await upsertDemoUser(
      'buyer@demo.com',
      { name: 'Demo Buyer TZ', role: 'buyer', phone: '255700000002' },
      {
        name: 'Demo Buyer TZ',
        role: 'buyer',
        phone: '255700000002',
        verified: true,
        isPremium: false,
        rating: 4.4,
        totalRatings: 11,
        balance: 1250000,
        location: { region: 'Dar es Salaam', district: 'Ilala', ward: 'Kariakoo', coordinates: { latitude: -6.823, longitude: 39.269 } },
        businessDetails: { businessName: 'Kariakoo Fresh Produce Traders', businessType: 'wholesaler', tinNumber: 'TIN-255-445-900' },
        notificationPreferences: { sms: true, email: true, push: false },
        isActive: true,
        isBanned: false,
        lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000),
      }
    );

    const demoPremium = await upsertDemoUser(
      'premium@demo.com',
      { name: 'Premium Farmer TZ', role: 'farmer', phone: '255700000003' },
      {
        name: 'Premium Farmer TZ',
        role: 'farmer',
        phone: '255700000003',
        verified: true,
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        rating: 4.9,
        totalRatings: 32,
        balance: 2180000,
        location: { region: 'Arusha', district: 'Arumeru', ward: 'Usa River', coordinates: { latitude: -3.366, longitude: 36.854 } },
        farmDetails: { farmSize: 32, crops: ['Dairy Cattle', 'Goats', 'Napier Grass', 'Avocados'], farmingMethod: 'regenerative' },
        notificationPreferences: { sms: true, email: true, push: true },
        isActive: true,
        isBanned: false,
        lastLogin: new Date(Date.now() - 45 * 60 * 1000),
      }
    );

    await upsertDemoUser(
      'farmer.ke@demo.com',
      { name: 'Demo Farmer KE', role: 'farmer', phone: '254700000004' },
      {
        name: 'Demo Farmer KE',
        role: 'farmer',
        phone: '254700000004',
        verified: true,
        rating: 4.5,
        totalRatings: 9,
        location: { region: 'Nairobi', district: 'Kiambu', ward: 'Limuru', coordinates: { latitude: -1.107, longitude: 36.642 } },
        farmDetails: { farmSize: 8, crops: ['Potatoes', 'Cabbage', 'Dairy Cattle'], farmingMethod: 'organic' },
        notificationPreferences: { sms: true, email: false, push: true },
        isActive: true,
        isBanned: false,
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    );

    await Product.deleteMany({ seller: demoFarmer._id });
    const productDocs = productsData.map((p, index) => ({
      ...p,
      seller: demoFarmer._id,
      status: index === 2 ? 'reserved' : 'active',
      views: 40 + index * 13,
      favorites: index % 2 === 0 ? [demoBuyer._id] : [],
      harvestDate: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000),
      aiInsights: {
        marketDemand: index % 2 === 0 ? 'High demand in Dar es Salaam and Arusha this week' : 'Stable demand with normal seasonal movement',
        priceRecommendation: Math.round(p.price * 1.06),
        bestTimeToSell: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000),
        competitorAnalysis: 'Seeded benchmark: pricing is competitive against regional market averages',
      },
    }));
    const insertedProducts = await Product.insertMany(productDocs);
    results.products = insertedProducts.length;

    await Transaction.deleteMany({ $or: [{ buyer: demoBuyer._id }, { seller: demoFarmer._id }] });
    const txProductA = insertedProducts[0];
    const txProductB = insertedProducts[1];
    const transactionDocs = [
      {
        product: txProductA._id,
        buyer: demoBuyer._id,
        seller: demoFarmer._id,
        quantity: 2,
        unitPrice: txProductA.price,
        totalAmount: txProductA.price * 2,
        commission: txProductA.price * 2 * 0.05,
        sellerAmount: txProductA.price * 2 * 0.95,
        status: 'completed',
        paymentMethod: 'mpesa',
        paymentReference: 'MPESA-DEMO-001',
        deliveryDetails: { address: 'Kariakoo Market, Dar es Salaam', phone: demoBuyer.phone, notes: 'Deliver early morning', estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        ratings: { buyerRating: { score: 5, comment: 'Fresh tomatoes and fast delivery', createdAt: new Date() }, sellerRating: { score: 5, comment: 'Quick payment and clear communication', createdAt: new Date() } },
        timeline: [
          { status: 'pending', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), note: 'Order created' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), note: 'Seller confirmed stock' },
          { status: 'completed', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), note: 'Delivered and paid' },
        ],
      },
      {
        product: txProductB._id,
        buyer: demoBuyer._id,
        seller: demoFarmer._id,
        quantity: 1,
        unitPrice: txProductB.price,
        totalAmount: txProductB.price,
        commission: txProductB.price * 0.05,
        sellerAmount: txProductB.price * 0.95,
        status: 'pending',
        paymentMethod: 'cash',
        deliveryDetails: { address: 'Buguruni Warehouse, Dar es Salaam', phone: demoBuyer.phone, notes: 'Buyer will arrange pickup', estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
        timeline: [{ status: 'pending', timestamp: new Date(), note: 'Order awaiting confirmation' }],
      },
    ];
    await Transaction.insertMany(transactionDocs);
    results.transactions = transactionDocs.length;

    await Promise.all([
      FarmWorkspace.deleteMany({ owner: { $in: [demoFarmer._id, demoPremium._id] } }),
      Livestock.deleteMany({ owner: { $in: [demoFarmer._id, demoPremium._id] } }),
      LivestockEvent.deleteMany({ owner: { $in: [demoFarmer._id, demoPremium._id] } }),
      LivestockInventory.deleteMany({ owner: { $in: [demoFarmer._id, demoPremium._id] } }),
      Reproduction.deleteMany({ owner: { $in: [demoFarmer._id, demoPremium._id] } }),
    ]);

    const workspace = await FarmWorkspace.create({
      name: 'Mlali Mixed Farm',
      owner: demoFarmer._id,
      description: 'Demo farm workspace with crops, dairy cattle, inventory, events, and reproduction records.',
      location: { name: 'Mlali Farm Block A', region: 'Morogoro', district: 'Mvomero', coordinates: { latitude: -6.819, longitude: 37.661 } },
      farmType: ['mixed', 'dairy', 'cattle'],
      farmSize: { value: 14.5, unit: 'acres' },
      members: [{ user: demoBuyer._id, role: 'viewer', inviteStatus: 'accepted', joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }],
      settings: { currency: 'TZS', weightUnit: 'kg', lowStockNotifications: true, upcomingEventNotifications: true, notificationDaysBefore: 5 },
    });
    results.workspaces = 1;

    const animals = await Livestock.insertMany([
      { owner: demoFarmer._id, workspace: workspace._id, tagId: 'TZ-COW-001', name: 'Neema', species: 'cattle', breed: 'Friesian', gender: 'female', dateOfBirth: new Date('2020-03-14'), weight: { value: 420, unit: 'kg', recordedAt: new Date() }, color: 'Black and white', healthStatus: 'pregnant', group: 'Dairy Herd', location: { farm: 'Mlali Mixed Farm', pasture: 'North Pasture' }, acquisitionType: 'purchased', acquisitionDate: new Date('2021-01-20'), acquisitionCost: 1350000, notes: 'High-producing dairy cow, currently pregnant.' },
      { owner: demoFarmer._id, workspace: workspace._id, tagId: 'TZ-COW-002', name: 'Baraka', species: 'cattle', breed: 'Boran', gender: 'male', dateOfBirth: new Date('2019-08-02'), weight: { value: 580, unit: 'kg', recordedAt: new Date() }, color: 'Brown', healthStatus: 'healthy', group: 'Breeding Bull', location: { farm: 'Mlali Mixed Farm', pen: 'Bull Pen' }, acquisitionType: 'purchased', acquisitionDate: new Date('2020-11-10'), acquisitionCost: 1800000, notes: 'Breeding bull for herd improvement.' },
      { owner: demoFarmer._id, workspace: workspace._id, tagId: 'TZ-GOAT-001', name: 'Asha', species: 'goat', breed: 'Boer', gender: 'female', dateOfBirth: new Date('2022-06-01'), weight: { value: 48, unit: 'kg', recordedAt: new Date() }, color: 'White/brown', healthStatus: 'healthy', group: 'Goat Unit', location: { farm: 'Mlali Mixed Farm', pen: 'Goat Pen 1' }, acquisitionType: 'born', notes: 'Excellent mothering ability.' },
      { owner: demoFarmer._id, workspace: workspace._id, tagId: 'TZ-HEN-001', name: 'Layer Group A', species: 'chicken', breed: 'Sasso', gender: 'female', ageEstimated: true, weight: { value: 2.1, unit: 'kg', recordedAt: new Date() }, color: 'Red', healthStatus: 'recovering', group: 'Poultry', location: { farm: 'Mlali Mixed Farm', pen: 'Poultry House' }, acquisitionType: 'purchased', notes: 'Small respiratory issue improving after treatment.' },
    ]);
    results.livestock = animals.length;

    await LivestockInventory.insertMany([
      { owner: demoFarmer._id, workspace: workspace._id, name: 'Dairy Meal 18%', category: 'feed', description: 'Protein-rich dairy meal for lactating cows', sku: 'FEED-DM-18', unit: 'bag', currentQuantity: 18, reorderPoint: 8, reorderQuantity: 25, maxQuantity: 60, unitCost: 42000, supplier: { name: 'Morogoro Agrovet', contact: '255755111222' }, storageLocation: 'Feed Store A', movements: [{ type: 'in', quantity: 25, reason: 'Monthly restock', reference: 'PO-1001', performedBy: demoFarmer._id }] },
      { owner: demoFarmer._id, workspace: workspace._id, name: 'Oxytetracycline LA', category: 'medication', description: 'Long-acting antibiotic for respiratory cases', sku: 'MED-OXY-LA', unit: 'bottle', currentQuantity: 2, reorderPoint: 3, reorderQuantity: 6, unitCost: 18500, supplier: { name: 'VetCare Tanzania', contact: '255744333555' }, storageLocation: 'Vet Cabinet', expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), batchNumber: 'OXY-2026-04', movements: [{ type: 'out', quantity: 1, reason: 'Treatment for poultry respiratory symptoms', reference: 'EVT-MED-001', performedBy: demoFarmer._id }] },
      { owner: demoFarmer._id, workspace: workspace._id, name: 'FMD Vaccine', category: 'vaccine', description: 'Foot-and-mouth disease vaccination doses', sku: 'VAC-FMD', unit: 'dose', currentQuantity: 12, reorderPoint: 10, reorderQuantity: 40, unitCost: 2500, supplier: { name: 'District Vet Office', contact: '255700998877' }, storageLocation: 'Cold Box', expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), batchNumber: 'FMD-JUL-26' },
      { owner: demoFarmer._id, workspace: workspace._id, name: 'Mineral Lick Blocks', category: 'supplement', description: 'Mineral supplement blocks for cattle and goats', sku: 'SUP-MIN-LICK', unit: 'piece', currentQuantity: 7, reorderPoint: 4, reorderQuantity: 12, unitCost: 9000, supplier: { name: 'Arusha Feeds', contact: '255767123123' }, storageLocation: 'Feed Store B' },
    ]);
    results.livestockInventory = 4;

    await LivestockEvent.insertMany([
      { animal: animals[0]._id, owner: demoFarmer._id, workspace: workspace._id, type: 'pregnancy_check', title: 'Pregnancy confirmed', description: 'Confirmed by ultrasound, good body condition.', date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), performedBy: 'Dr. Amina Mwansasu', cost: 25000, reminder: { isSet: true, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), notified: false }, tags: ['pregnancy', 'vet'] },
      { animal: animals[1]._id, owner: demoFarmer._id, workspace: workspace._id, type: 'weighing', title: 'Monthly weighing', description: 'Bull body condition excellent.', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), weightRecorded: { value: 580, unit: 'kg' }, performedBy: 'Farm Manager', tags: ['weight'] },
      { animal: animals[2]._id, owner: demoFarmer._id, workspace: workspace._id, type: 'vaccination', title: 'PPR vaccination', description: 'Routine goat vaccination completed.', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), performedBy: 'District Vet', cost: 12000, medicationUsed: { name: 'PPR Vaccine', dosage: '1', unit: 'dose', batchNumber: 'PPR-2026' }, reminder: { isSet: true, dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), notified: false }, tags: ['vaccination'] },
      { animal: animals[3]._id, owner: demoFarmer._id, workspace: workspace._id, type: 'medical', title: 'Respiratory treatment', description: 'Started antibiotic treatment; recovery improving.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), performedBy: 'Farm Attendant', cost: 18500, medicationUsed: { name: 'Oxytetracycline LA', dosage: '0.5', unit: 'ml', batchNumber: 'OXY-2026-04' }, reminder: { isSet: true, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), notified: false }, tags: ['treatment', 'follow-up'] },
    ]);
    results.livestockEvents = 4;

    await Reproduction.insertMany([
      { animal: animals[0]._id, owner: demoFarmer._id, workspace: workspace._id, recordType: 'pregnancy', pregnancy: { confirmed: true, confirmationDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), confirmationMethod: 'ultrasound', expectedDueDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000), gestationDays: 283, status: 'confirmed', checkups: [{ date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), notes: 'Healthy pregnancy, normal fetal heartbeat', performedBy: 'Dr. Amina Mwansasu' }] }, notes: 'Expected calving in about two months.' },
      { animal: animals[2]._id, owner: demoFarmer._id, workspace: workspace._id, recordType: 'heat_cycle', heatCycles: [{ startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), signs: ['mounting', 'restlessness'], notes: 'Observed normal heat signs', breedingAttempted: false }], avgCycleLength: 21, predictedNextHeat: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), notes: 'Monitor for next cycle.' },
    ]);
    results.reproductionRecords = 2;

    res.json({
      message: '✅ Seed complete! Demo accounts now have rich account/profile, marketplace, transaction, livestock, inventory, event, and workspace data.',
      demoAccounts: {
        farmer: 'farmer@demo.com / demo1234',
        buyer: 'buyer@demo.com / demo1234',
        premiumFarmer: 'premium@demo.com / demo1234',
        kenyaFarmer: 'farmer.ke@demo.com / demo1234',
      },
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
    const [products, marketPrices, users, transactions, workspaces, livestock, livestockInventory, livestockEvents, reproductionRecords] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      MarketPrice.countDocuments(),
      User.countDocuments(),
      Transaction.countDocuments(),
      FarmWorkspace.countDocuments({ isActive: true }),
      Livestock.countDocuments({ isActive: true }),
      LivestockInventory.countDocuments({ isActive: true }),
      LivestockEvent.countDocuments(),
      Reproduction.countDocuments(),
    ]);
    res.json({ products, marketPrices, users, transactions, workspaces, livestock, livestockInventory, livestockEvents, reproductionRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
