// Demo data for development and testing
export const demoProducts = [
  {
    _id: '1',
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    description: 'Fresh, locally grown organic tomatoes',
    price: 35000,
    quantity: 10,
    unit: 'crate',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=500&h=500&fit=crop',
    seller: { name: 'John Farmer', rating: 4.8 },
    location: 'Dar es Salaam',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '2',
    name: 'Maize (Corn)',
    category: 'Grains',
    description: 'High-quality maize suitable for milling',
    price: 90000,
    quantity: 50,
    unit: 'bag',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=500&fit=crop',
    seller: { name: 'Sarah Crops', rating: 4.6 },
    location: 'Morogoro',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '3',
    name: 'Banana Bunch',
    category: 'Fruits',
    description: 'Fresh bananas, ripe and ready to eat',
    price: 15000,
    quantity: 30,
    unit: 'bunch',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop',
    seller: { name: 'Peter Fruits', rating: 4.9 },
    location: 'Arusha',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '4',
    name: 'Onions',
    category: 'Vegetables',
    description: 'Red onions, fresh from farm',
    price: 120000,
    quantity: 20,
    unit: 'bag',
    image: 'https://images.unsplash.com/photo-1587049633312-d628fb40c321?w=500&h=500&fit=crop',
    seller: { name: 'Grace Garden', rating: 4.7 },
    location: 'Iringa',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '5',
    name: 'Beans',
    category: 'Legumes',
    description: 'Dried beans, protein-rich',
    price: 250000,
    quantity: 15,
    unit: 'bag',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop',
    seller: { name: 'David Legumes', rating: 4.5 },
    location: 'Mbeya',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

export const demoMarketPrices = [
  {
    _id: '1',
    product: 'Tomatoes',
    category: 'Vegetables',
    region: 'Dar es Salaam',
    price: 35000,
    unit: 'crate (40kg)',
    priceChange: 500,
    trend: 'up',
    date: new Date()
  },
  {
    _id: '2',
    product: 'Maize',
    category: 'Grains',
    region: 'Dar es Salaam',
    price: 90000,
    unit: 'bag (100kg)',
    priceChange: -2000,
    trend: 'down',
    date: new Date()
  },
  {
    _id: '3',
    product: 'Bananas',
    category: 'Fruits',
    region: 'Dar es Salaam',
    price: 15000,
    unit: 'bunch',
    priceChange: 0,
    trend: 'stable',
    date: new Date()
  },
  {
    _id: '4',
    product: 'Onions',
    category: 'Vegetables',
    region: 'Morogoro',
    price: 120000,
    unit: 'bag (100kg)',
    priceChange: 5000,
    trend: 'up',
    date: new Date()
  },
  {
    _id: '5',
    product: 'Beans',
    category: 'Legumes',
    region: 'Morogoro',
    price: 250000,
    unit: 'bag (100kg)',
    priceChange: -5000,
    trend: 'down',
    date: new Date()
  },
  {
    _id: '6',
    product: 'Cabbage',
    category: 'Vegetables',
    region: 'Arusha',
    price: 25000,
    unit: 'sack (50kg)',
    priceChange: 2000,
    trend: 'up',
    date: new Date()
  }
];

export const demoWeather = [
  {
    _id: '1',
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
    _id: '2',
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
    _id: '3',
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
    _id: '4',
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
  }
];

// Function to get demo data based on type
export const getDemoData = (type) => {
  switch (type) {
    case 'products':
      return demoProducts;
    case 'marketPrices':
      return demoMarketPrices;
    case 'weather':
      return demoWeather;
    default:
      return null;
  }
};
