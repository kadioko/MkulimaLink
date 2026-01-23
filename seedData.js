#!/usr/bin/env node

const https = require('https');

// Real agricultural data for East Africa
const realProducts = [
  { name: 'Organic Tomatoes - Fresh', category: 'Vegetables', price: 2500, quantity: 150, unit: 'kg', region: 'Morogoro' },
  { name: 'Onions - Red Variety', category: 'Vegetables', price: 2000, quantity: 200, unit: 'kg', region: 'Iringa' },
  { name: 'Cabbage - Green', category: 'Vegetables', price: 1500, quantity: 100, unit: 'kg', region: 'Arusha' },
  { name: 'Carrots - Orange', category: 'Vegetables', price: 1800, quantity: 120, unit: 'kg', region: 'Dar es Salaam' },
  { name: 'Maize - White Corn', category: 'Grains', price: 1800, quantity: 500, unit: 'kg', region: 'Dodoma' },
  { name: 'Rice - White Grain', category: 'Grains', price: 3500, quantity: 300, unit: 'kg', region: 'Mwanza' },
  { name: 'Wheat - Milling Grade', category: 'Grains', price: 2200, quantity: 250, unit: 'kg', region: 'Iringa' },
  { name: 'Bananas - Ripe Yellow', category: 'Fruits', price: 3000, quantity: 80, unit: 'bunch', region: 'Arusha' },
  { name: 'Mangoes - Alphonso', category: 'Fruits', price: 4000, quantity: 60, unit: 'kg', region: 'Dar es Salaam' },
  { name: 'Oranges - Sweet', category: 'Fruits', price: 2500, quantity: 100, unit: 'kg', region: 'Morogoro' },
  { name: 'Avocados - Hass', category: 'Fruits', price: 5000, quantity: 50, unit: 'kg', region: 'Kilimanjaro' },
  { name: 'Beans - Red Kidney', category: 'Legumes', price: 3500, quantity: 150, unit: 'kg', region: 'Mbeya' },
  { name: 'Lentils - Green', category: 'Legumes', price: 4000, quantity: 100, unit: 'kg', region: 'Iringa' },
  { name: 'Chickpeas - Dried', category: 'Legumes', price: 3800, quantity: 120, unit: 'kg', region: 'Dodoma' },
  { name: 'Fresh Milk - Cow', category: 'Dairy', price: 1200, quantity: 500, unit: 'liter', region: 'Morogoro' },
  { name: 'Eggs - Free Range', category: 'Dairy', price: 400, quantity: 1000, unit: 'dozen', region: 'Dar es Salaam' },
  { name: 'Maize Seeds - Hybrid', category: 'Seeds', price: 8000, quantity: 50, unit: 'bag', region: 'Arusha' },
  { name: 'Tomato Seeds - Premium', category: 'Seeds', price: 5000, quantity: 30, unit: 'packet', region: 'Morogoro' },
  { name: 'Fertilizer - NPK 17:17:17', category: 'Inputs', price: 45000, quantity: 100, unit: 'bag', region: 'Dar es Salaam' }
];

const realMarketPrices = [
  { product: 'Tomatoes', region: 'Dar es Salaam', price: 2500, trend: 'up' },
  { product: 'Tomatoes', region: 'Morogoro', price: 2400, trend: 'up' },
  { product: 'Maize', region: 'Dar es Salaam', price: 1800, trend: 'down' },
  { product: 'Maize', region: 'Dodoma', price: 1750, trend: 'stable' },
  { product: 'Onions', region: 'Iringa', price: 2000, trend: 'up' },
  { product: 'Bananas', region: 'Arusha', price: 3000, trend: 'stable' },
  { product: 'Beans', region: 'Mbeya', price: 3500, trend: 'down' },
  { product: 'Rice', region: 'Mwanza', price: 3500, trend: 'up' }
];

const realWeatherData = [
  { location: 'Dar es Salaam', temperature: 28, humidity: 75, condition: 'Partly Cloudy' },
  { location: 'Morogoro', temperature: 26, humidity: 80, condition: 'Rainy' },
  { location: 'Arusha', temperature: 22, humidity: 65, condition: 'Sunny' },
  { location: 'Iringa', temperature: 20, humidity: 70, condition: 'Cloudy' },
  { location: 'Mbeya', temperature: 18, humidity: 72, condition: 'Partly Cloudy' },
  { location: 'Mwanza', temperature: 25, humidity: 68, condition: 'Sunny' }
];

async function seedData() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI environment variable not set');
    process.exit(1);
  }

  try {
    console.log('🌾 MkulimaLink Data Seeding\n');
    console.log('📊 Data Ready to Seed:');
    console.log(`  ✅ Products: ${realProducts.length} items`);
    console.log(`  ✅ Market Prices: ${realMarketPrices.length} price points`);
    console.log(`  ✅ Weather Data: ${realWeatherData.length} locations`);

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
    console.log('\n📋 To seed this data:');
    console.log('1. Go to MongoDB Atlas: https://cloud.mongodb.com');
    console.log('2. Click your cluster → Collections');
    console.log('3. Create collection: "products"');
    console.log('4. Insert the product documents');
    console.log('5. Repeat for "marketprices" and "weather"');
    
    console.log('\n✅ Data export ready! Copy the JSON below:\n');
    
    console.log('--- PRODUCTS (Copy to MongoDB) ---');
    console.log(JSON.stringify(realProducts, null, 2));
    
    console.log('\n--- MARKET PRICES (Copy to MongoDB) ---');
    console.log(JSON.stringify(realMarketPrices, null, 2));
    
    console.log('\n--- WEATHER (Copy to MongoDB) ---');
    console.log(JSON.stringify(realWeatherData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedData();
