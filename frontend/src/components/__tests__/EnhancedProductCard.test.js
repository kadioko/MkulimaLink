import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';

vi.mock('../../store/wishlistStore', () => ({
  useWishlistStore: vi.fn(),
}));

import EnhancedProductCard from '../EnhancedProductCard';
import { useWishlistStore } from '../../store/wishlistStore';

const mockProduct = {
  _id: '1',
  name: 'Premium Maize',
  price: 25000,
  currency: 'TZS',
  unit: 'kg',
  quantity: 100,
  category: 'Grains',
  region: 'Morogoro',
  country: 'Tanzania',
  quality: 'premium',
  organic: true,
  seller: {
    name: 'John Mwangi',
    verified: true,
  },
};

const queryClient = new QueryClient();

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('EnhancedProductCard', () => {
  beforeEach(() => {
    useWishlistStore.mockReturnValue({
      toggleItem: jest.fn(),
      isInWishlist: jest.fn().mockReturnValue(false),
    });
  });

  it('renders product information correctly', () => {
    renderWithProviders(
      <EnhancedProductCard product={mockProduct} currency="TZS" />
    );

    expect(screen.getByText('Premium Maize')).toBeInTheDocument();
    expect(screen.getByText('TZS 25,000')).toBeInTheDocument();
    expect(screen.getByText('Grains')).toBeInTheDocument();
    expect(screen.getByText('Morogoro, Tanzania')).toBeInTheDocument();
  });

  it('displays premium badge for premium quality products', () => {
    renderWithProviders(
      <EnhancedProductCard product={mockProduct} currency="TZS" />
    );

    expect(screen.getByText('Premium Quality')).toBeInTheDocument();
  });

  it('displays organic badge for organic products', () => {
    renderWithProviders(
      <EnhancedProductCard product={mockProduct} currency="TZS" />
    );

    expect(screen.getByText('Organic')).toBeInTheDocument();
  });

  it('calls onWishlist when heart button is clicked', () => {
    const mockToggleItem = jest.fn();
    useWishlistStore.mockReturnValue({
      toggleItem: mockToggleItem,
      isInWishlist: jest.fn().mockReturnValue(false),
    });

    renderWithProviders(
      <EnhancedProductCard product={mockProduct} currency="TZS" />
    );

    const wishlistButton = screen.getAllByRole('button')[0];
    fireEvent.click(wishlistButton);

    expect(mockToggleItem).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onCompare when compare button is clicked', () => {
    const mockCompare = jest.fn();
    renderWithProviders(
      <EnhancedProductCard 
        product={mockProduct} 
        currency="TZS" 
        onCompare={mockCompare}
      />
    );

    const compareButton = screen.getAllByRole('button')[1];
    fireEvent.click(compareButton);

    expect(mockCompare).toHaveBeenCalledWith(mockProduct);
  });

  it('renders in list view mode correctly', () => {
    renderWithProviders(
      <EnhancedProductCard 
        product={mockProduct} 
        currency="TZS" 
        viewMode="list"
      />
    );

    expect(screen.getByText('Premium Maize')).toBeInTheDocument();
    expect(screen.getByText('John Mwangi')).toBeInTheDocument();
  });

  it('shows verified badge for verified sellers', () => {
    renderWithProviders(
      <EnhancedProductCard product={mockProduct} currency="TZS" />
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});
