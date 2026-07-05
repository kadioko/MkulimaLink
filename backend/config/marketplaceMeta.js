const CATEGORIES = [
  'grains',
  'legumes',
  'vegetables',
  'fruits',
  'livestock',
  'dairy',
  'poultry',
  'seeds',
  'fertilizers',
  'equipment',
  'other'
];

const UNITS = ['kg', 'ton', 'bag', 'piece', 'liter', 'dozen', 'bundle', 'bunch'];

const LOCATIONS = {
  TZ: {
    name: 'Tanzania',
    currency: 'TZS',
    regions: ['Dar es Salaam', 'Morogoro', 'Arusha', 'Iringa', 'Mbeya', 'Mwanza', 'Dodoma', 'Kilimanjaro']
  },
  KE: {
    name: 'Kenya',
    currency: 'KES',
    regions: ['Nairobi', 'Kiambu', 'Nakuru', 'Mombasa', 'Kisumu', 'Eldoret']
  },
  UG: {
    name: 'Uganda',
    currency: 'UGX',
    regions: ['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara']
  }
};

const CATEGORY_EXPIRY_DAYS = {
  vegetables: 6,
  fruits: 9,
  dairy: 5,
  poultry: 14,
  grains: 45,
  legumes: 45,
  seeds: 60,
  fertilizers: 90,
  livestock: 60,
  equipment: 120,
  other: 45
};

module.exports = {
  CATEGORIES,
  UNITS,
  LOCATIONS,
  CATEGORY_EXPIRY_DAYS
};
