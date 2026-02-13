import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const COUNTRIES = {
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    flag: '🇹🇿',
    phone: '+255',
    regions: [
      'Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Mbeya',
      'Morogoro', 'Tanga', 'Iringa', 'Kilimanjaro', 'Moshi'
    ],
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    flag: '🇰🇪',
    phone: '+254',
    regions: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
      'Nyeri', 'Machakos', 'Kiambu', 'Nyandarua', 'Meru'
    ],
  },
};

export const useCountryStore = create(
  persist(
    (set, get) => ({
      country: 'TZ',
      getCountry: () => COUNTRIES[get().country],
      getCurrency: () => COUNTRIES[get().country].currency,
      getRegions: () => COUNTRIES[get().country].regions,
      setCountry: (code) => set({ country: code }),
    }),
    {
      name: 'country-storage',
    }
  )
);
