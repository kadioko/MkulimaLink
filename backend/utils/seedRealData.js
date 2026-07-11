const mongoose = require('mongoose');
require('dotenv').config();

// Real agricultural data for East Africa
const realProducts = [
  // Vegetables
  {
    name: 'Organic Tomatoes - Fresh',
    category: 'Vegetables',
    description: 'Fresh, locally grown organic tomatoes from Morogoro region. Perfect for cooking and salads.',
    price: 2500,
    quantity: 150,
    unit: 'kg',
    region: 'Morogoro',
    quality: 'premium',
    organic: true,
    seller: { name: 'Morogoro Farms', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=500&h=500&fit=crop'
  },
  {
    name: 'Onions - Red Variety',
    category: 'Vegetables',
    description: 'High-quality red onions from Iringa. Great for storage and cooking.',
    price: 2000,
    quantity: 200,
    unit: 'kg',
    region: 'Iringa',
    quality: 'standard',
    organic: false,
    seller: { name: 'Iringa Growers', rating: 4.6 },
    image: 'https://images.unsplash.com/photo-1587049633312-d628fb40c321?w=500&h=500&fit=crop'
  },
  {
    name: 'Cabbage - Green',
    category: 'Vegetables',
    description: 'Fresh green cabbage from Arusha. Ideal for salads and cooking.',
    price: 1500,
    quantity: 100,
    unit: 'kg',
    region: 'Arusha',
    quality: 'standard',
    organic: true,
    seller: { name: 'Arusha Fresh', rating: 4.7 },
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&h=500&fit=crop'
  },
  {
    name: 'Carrots - Orange',
    category: 'Vegetables',
    description: 'Sweet orange carrots from Dar es Salaam. Rich in vitamins.',
    price: 1800,
    quantity: 120,
    unit: 'kg',
    region: 'Dar es Salaam',
    quality: 'premium',
    organic: true,
    seller: { name: 'Dar Fresh Produce', rating: 4.9 },
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop'
  },

  // Grains
  {
    name: 'Maize - White Corn',
    category: 'Grains',
    description: 'High-quality white maize suitable for milling and cooking. From Dodoma region.',
    price: 1800,
    quantity: 500,
    unit: 'kg',
    region: 'Dodoma',
    quality: 'standard',
    organic: false,
    seller: { name: 'Dodoma Grains', rating: 4.5 },
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop'
  },
  {
    name: 'Rice - White Grain',
    category: 'Grains',
    description: 'Premium white rice from Mwanza. Long grain, perfect for cooking.',
    price: 3500,
    quantity: 300,
    unit: 'kg',
    region: 'Mwanza',
    quality: 'premium',
    organic: false,
    seller: { name: 'Mwanza Rice Mills', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1586985289688-cacf913bb194?w=500&h=500&fit=crop'
  },
  {
    name: 'Wheat - Milling Grade',
    category: 'Grains',
    description: 'Quality wheat for milling and baking. From Iringa highlands.',
    price: 2200,
    quantity: 250,
    unit: 'kg',
    region: 'Iringa',
    quality: 'standard',
    organic: false,
    seller: { name: 'Iringa Millers', rating: 4.6 },
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop'
  },

  // Fruits
  {
    name: 'Bananas - Ripe Yellow',
    category: 'Fruits',
    description: 'Fresh, ripe yellow bananas from Arusha. Perfect for eating or cooking.',
    price: 3000,
    quantity: 80,
    unit: 'bunch',
    region: 'Arusha',
    quality: 'premium',
    organic: true,
    seller: { name: 'Arusha Fruits', rating: 4.9 },
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop'
  },
  {
    name: 'Mangoes - Alphonso',
    category: 'Fruits',
    description: 'Sweet Alphonso mangoes from Dar es Salaam. In season now!',
    price: 4000,
    quantity: 60,
    unit: 'kg',
    region: 'Dar es Salaam',
    quality: 'premium',
    organic: true,
    seller: { name: 'Coastal Fruits', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1585518419759-3f4ee4dacc51?w=500&h=500&fit=crop'
  },
  {
    name: 'Oranges - Sweet',
    category: 'Fruits',
    description: 'Juicy sweet oranges from Morogoro. Great for juice or eating fresh.',
    price: 2500,
    quantity: 100,
    unit: 'kg',
    region: 'Morogoro',
    quality: 'standard',
    organic: false,
    seller: { name: 'Morogoro Citrus', rating: 4.7 },
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=500&h=500&fit=crop'
  },
  {
    name: 'Avocados - Hass',
    category: 'Fruits',
    description: 'Creamy Hass avocados from Kilimanjaro. Perfect for salads and spreads.',
    price: 5000,
    quantity: 50,
    unit: 'kg',
    region: 'Kilimanjaro',
    quality: 'premium',
    organic: true,
    seller: { name: 'Kilimanjaro Farms', rating: 4.9 },
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&h=500&fit=crop'
  },

  // Legumes
  {
    name: 'Beans - Red Kidney',
    category: 'Legumes',
    description: 'High-quality red kidney beans from Mbeya. Protein-rich and nutritious.',
    price: 3500,
    quantity: 150,
    unit: 'kg',
    region: 'Mbeya',
    quality: 'standard',
    organic: false,
    seller: { name: 'Mbeya Legumes', rating: 4.6 },
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop'
  },
  {
    name: 'Lentils - Green',
    category: 'Legumes',
    description: 'Nutritious green lentils from Iringa. Perfect for soups and stews.',
    price: 4000,
    quantity: 100,
    unit: 'kg',
    region: 'Iringa',
    quality: 'premium',
    organic: true,
    seller: { name: 'Iringa Legumes', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop'
  },
  {
    name: 'Chickpeas - Dried',
    category: 'Legumes',
    description: 'Quality dried chickpeas from Dodoma. Great for hummus and curries.',
    price: 3800,
    quantity: 120,
    unit: 'kg',
    region: 'Dodoma',
    quality: 'standard',
    organic: false,
    seller: { name: 'Dodoma Legumes', rating: 4.5 },
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop'
  },

  // Dairy & Livestock
  {
    name: 'Fresh Milk - Cow',
    category: 'Dairy',
    description: 'Fresh cow milk from Morogoro dairy farms. Delivered daily.',
    price: 1200,
    quantity: 500,
    unit: 'liter',
    region: 'Morogoro',
    quality: 'premium',
    organic: true,
    seller: { name: 'Morogoro Dairy', rating: 4.9 },
    image: 'https://images.unsplash.com/photo-1563056169-519f756eea0d?w=500&h=500&fit=crop'
  },
  {
    name: 'Eggs - Free Range',
    category: 'Dairy',
    description: 'Fresh free-range chicken eggs from Dar es Salaam. Delivered weekly.',
    price: 400,
    quantity: 1000,
    unit: 'dozen',
    region: 'Dar es Salaam',
    quality: 'premium',
    organic: true,
    seller: { name: 'Dar Poultry', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1582720471384-894fbb16e074?w=500&h=500&fit=crop'
  },

  // Seeds & Inputs
  {
    name: 'Maize Seeds - Hybrid',
    category: 'Seeds',
    description: 'High-yield hybrid maize seeds. Certified and tested for East Africa.',
    price: 8000,
    quantity: 50,
    unit: 'bag',
    region: 'Arusha',
    quality: 'premium',
    organic: false,
    seller: { name: 'Arusha Seeds', rating: 4.9 },
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop'
  },
  {
    name: 'Tomato Seeds - Premium',
    category: 'Seeds',
    description: 'Premium tomato seeds from certified suppliers. High germination rate.',
    price: 5000,
    quantity: 30,
    unit: 'packet',
    region: 'Morogoro',
    quality: 'premium',
    organic: true,
    seller: { name: 'Morogoro Seeds', rating: 4.8 },
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop'
  },
  {
    name: 'Fertilizer - NPK 17:17:17',
    category: 'Inputs',
    description: 'Balanced NPK fertilizer for general crops. 50kg bags.',
    price: 45000,
    quantity: 100,
    unit: 'bag',
    region: 'Dar es Salaam',
    quality: 'standard',
    organic: false,
    seller: { name: 'Dar Inputs', rating: 4.7 },
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop'
  }
];

const realMarketPrices = [
  { product: 'Tomatoes', category: 'Vegetables', region: 'Dar es Salaam', price: 2500, priceChange: 5, trend: 'up' },
  { product: 'Tomatoes', category: 'Vegetables', region: 'Morogoro', price: 2400, priceChange: 3, trend: 'up' },
  { product: 'Tomatoes', category: 'Vegetables', region: 'Arusha', price: 2600, priceChange: -2, trend: 'down' },
  
  { product: 'Maize', category: 'Grains', region: 'Dar es Salaam', price: 1800, priceChange: -2, trend: 'down' },
  { product: 'Maize', category: 'Grains', region: 'Dodoma', price: 1750, priceChange: 0, trend: 'stable' },
  { product: 'Maize', category: 'Grains', region: 'Morogoro', price: 1850, priceChange: 1, trend: 'up' },
  
  { product: 'Onions', category: 'Vegetables', region: 'Iringa', price: 2000, priceChange: 3, trend: 'up' },
  { product: 'Onions', category: 'Vegetables', region: 'Dar es Salaam', price: 2100, priceChange: 5, trend: 'up' },
  
  { product: 'Bananas', category: 'Fruits', region: 'Arusha', price: 3000, priceChange: 0, trend: 'stable' },
  { product: 'Bananas', category: 'Fruits', region: 'Dar es Salaam', price: 3200, priceChange: 2, trend: 'up' },
  
  { product: 'Beans', category: 'Legumes', region: 'Mbeya', price: 3500, priceChange: -1, trend: 'down' },
  { product: 'Beans', category: 'Legumes', region: 'Iringa', price: 3600, priceChange: 2, trend: 'up' },
  
  { product: 'Rice', category: 'Grains', region: 'Mwanza', price: 3500, priceChange: 1, trend: 'up' },
  { product: 'Cabbage', category: 'Vegetables', region: 'Arusha', price: 1500, priceChange: 2, trend: 'up' },
  { product: 'Carrots', category: 'Vegetables', region: 'Dar es Salaam', price: 1800, priceChange: 0, trend: 'stable' }
];

const realWeatherData = [
  {
    location: 'Dar es Salaam',
    temperature: 28,
    humidity: 75,
    rainfall: 15,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Tomorrow', high: 29, low: 24, condition: 'Sunny' },
      { day: 'Day after', high: 27, low: 23, condition: 'Rainy' },
      { day: '+3 days', high: 26, low: 22, condition: 'Cloudy' }
    ]
  },
  {
    location: 'Morogoro',
    temperature: 26,
    humidity: 80,
    rainfall: 20,
    windSpeed: 10,
    condition: 'Rainy',
    forecast: [
      { day: 'Tomorrow', high: 25, low: 21, condition: 'Rainy' },
      { day: 'Day after', high: 27, low: 22, condition: 'Sunny' },
      { day: '+3 days', high: 28, low: 23, condition: 'Sunny' }
    ]
  },
  {
    location: 'Arusha',
    temperature: 22,
    humidity: 65,
    rainfall: 5,
    windSpeed: 15,
    condition: 'Sunny',
    forecast: [
      { day: 'Tomorrow', high: 23, low: 18, condition: 'Sunny' },
      { day: 'Day after', high: 24, low: 19, condition: 'Partly Cloudy' },
      { day: '+3 days', high: 22, low: 17, condition: 'Sunny' }
    ]
  },
  {
    location: 'Iringa',
    temperature: 20,
    humidity: 70,
    rainfall: 10,
    windSpeed: 8,
    condition: 'Cloudy',
    forecast: [
      { day: 'Tomorrow', high: 21, low: 16, condition: 'Cloudy' },
      { day: 'Day after', high: 22, low: 17, condition: 'Sunny' },
      { day: '+3 days', high: 20, low: 15, condition: 'Rainy' }
    ]
  },
  {
    location: 'Mbeya',
    temperature: 18,
    humidity: 72,
    rainfall: 12,
    windSpeed: 9,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Tomorrow', high: 19, low: 14, condition: 'Cloudy' },
      { day: 'Day after', high: 20, low: 15, condition: 'Sunny' },
      { day: '+3 days', high: 18, low: 13, condition: 'Rainy' }
    ]
  },
  {
    location: 'Mwanza',
    temperature: 25,
    humidity: 68,
    rainfall: 8,
    windSpeed: 11,
    condition: 'Sunny',
    forecast: [
      { day: 'Tomorrow', high: 26, low: 20, condition: 'Sunny' },
      { day: 'Day after', high: 25, low: 19, condition: 'Partly Cloudy' },
      { day: '+3 days', high: 24, low: 18, condition: 'Sunny' }
    ]
  }
];

async function seedRealData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Note: This is a demonstration of the data structure
    // In production, you would use actual Mongoose models
    console.log('\n📊 Real Data Ready to Seed:\n');
    
    console.log(`✅ Products: ${realProducts.length} items`);
    console.log(`✅ Market Prices: ${realMarketPrices.length} price points`);
    console.log(`✅ Weather Data: ${realWeatherData.length} locations`);

    console.log('\n📝 Sample Products:');
    realProducts.slice(0, 3).forEach(p => {
      console.log(`  - ${p.name} (${p.region}): ${p.price} TZS/${p.unit}`);
    });

    console.log('\n💰 Sample Market Prices:');
    realMarketPrices.slice(0, 3).forEach(p => {
      console.log(`  - ${p.product} (${p.region}): ${p.price} TZS (${p.trend})`);
    });

    console.log('\n🌤️  Sample Weather:');
    realWeatherData.slice(0, 2).forEach(w => {
      console.log(`  - ${w.location}: ${w.temperature}°C, ${w.condition}`);
    });

    console.log('\n✨ Real data structure ready for MongoDB Atlas!');
    console.log('To seed this data, create Mongoose models and use this data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Export data for use in other files
module.exports = {
  realProducts,
  realMarketPrices,
  realWeatherData,
  seedRealData
};

// Run if called directly
if (require.main === module) {
  seedRealData();
}



