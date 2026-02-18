import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { MapPin, Calendar, Package, AlertCircle, ShoppingCart, Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useCountryStore } from '../store/countryStore';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getCurrency } = useCountryStore();
  const currency = getCurrency();
  const [quantity, setQuantity] = useState(1);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const { data: product, isLoading } = useQuery(['product', id], async () => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  });

  const buyMutation = useMutation(
    async (orderData) => {
      const response = await api.post('/transactions', orderData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Order placed successfully!');
        navigate('/transactions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    }
  );

  const handleBuy = () => {
    if (!user) {
      toast.error('Please login to make a purchase');
      navigate('/login');
      return;
    }
    setShowBuyModal(true);
  };

  const confirmPurchase = () => {
    buyMutation.mutate({
      productId: id,
      quantity,
      deliveryDetails: {
        phone: user.phone,
        address: `${user.location?.district}, ${user.location?.region}`
      }
    });
    setShowBuyModal(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-96 rounded-lg mb-6"></div>
        <div className="skeleton h-8 w-3/4 mb-4"></div>
        <div className="skeleton h-6 w-1/2"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found</p>
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          {product.images && product.images.length > 0 ? (
            <div>
              <img
                src={product.images[0].url}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              {product.images[0].pestDetection?.detected && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-yellow-600 mt-1" size={20} />
                    <div>
                      <p className="font-semibold text-yellow-900">Pest Detection Alert</p>
                      <p className="text-sm text-yellow-800">
                        {product.images[0].pestDetection.pestType} detected 
                        ({Math.round(product.images[0].pestDetection.confidence * 100)}% confidence)
                      </p>
                      <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                        {product.images[0].pestDetection.recommendations?.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                {product.organic && <span className="badge-success">Organic</span>}
                <span className={`badge ${
                  product.quality === 'premium' ? 'badge-warning' :
                  product.quality === 'standard' ? 'badge-info' : 'badge-success'
                }`}>
                  {product.quality}
                </span>
                <span className={`badge ${
                  product.status === 'active' ? 'badge-success' : 'badge-danger'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>
            <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200">
              <Heart size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-4xl font-bold text-primary-600 mb-1">
              {product.currency || currency} {product.price.toLocaleString()}
            </p>
            <p className="text-gray-600">per {product.unit}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Package size={20} />
              <span>Available: {product.quantity} {product.unit}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={20} />
              <span>{product.location?.district}, {product.location?.region}</span>
            </div>
            {product.harvestDate && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar size={20} />
                <span>Harvested: {new Date(product.harvestDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {product.seller && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Seller Information</h3>
              <p className="text-gray-700">{product.seller.name}</p>
              <p className="text-sm text-gray-600">{product.seller.location?.region}</p>
              {product.seller.rating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{product.seller.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-600">({product.seller.totalRatings} ratings)</span>
                </div>
              )}
            </div>
          )}

          {user?.isPremium && product.aiInsights && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">AI Insights (Premium)</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Market Demand:</strong> {product.aiInsights.marketDemand}</p>
                <p><strong>Recommended Price:</strong> {product.currency || currency} {product.aiInsights.priceRecommendation?.toLocaleString()}</p>
                <p><strong>Analysis:</strong> {product.aiInsights.competitorAnalysis}</p>
              </div>
            </div>
          )}

          {product.status === 'active' && user?._id !== product.seller?._id && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn-secondary px-4 py-2"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field w-24 text-center"
                    min="1"
                    max={product.quantity}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="btn-secondary px-4 py-2"
                  >
                    +
                  </button>
                  <span className="text-gray-600">{product.unit}</span>
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Total Price</p>
                <p className="text-2xl font-bold text-primary-600">
                  {product.currency || currency} {totalPrice.toLocaleString()}
                </p>
              </div>

              <button
                onClick={handleBuy}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart size={24} />
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Purchase</h3>
            <div className="space-y-3 mb-6">
              <p><strong>Product:</strong> {product.name}</p>
              <p><strong>Quantity:</strong> {quantity} {product.unit}</p>
              <p><strong>Total:</strong> {product.currency || currency} {totalPrice.toLocaleString()}</p>
              <p className="text-sm text-gray-600">
                You will receive an M-Pesa payment request on your phone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBuyModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={buyMutation.isLoading}
                className="btn-primary flex-1"
              >
                {buyMutation.isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
