import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, MousePointer, ShoppingCart, BarChart3, Plus } from 'lucide-react';
import api from '../../api/axios';

const AdvertisingPlatform = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/monetization/campaigns');
      setCampaigns(response.data.campaigns || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading campaigns...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Advertising Platform</h1>
            <p className="text-gray-600">Promote your products and reach more customers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </button>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No campaigns yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
};

const CampaignCard = ({ campaign }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [campaign._id]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/monetization/campaigns/${campaign._id}/analytics`);
      setAnalytics(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">Loading...</div>;
  }

  const budgetUsed = (campaign.spent / campaign.budget) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{campaign.campaign_name}</h3>
          <p className="text-sm text-gray-600 capitalize">{campaign.ad_type.replace('_', ' ')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          campaign.status === 'active'
            ? 'bg-green-100 text-green-800'
            : campaign.status === 'paused'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </div>

      {/* Budget Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">Budget Used</p>
          <p className="text-sm font-semibold text-gray-900">{budgetUsed.toFixed(0)}%</p>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()} TZS
        </p>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center text-blue-600 mb-1">
              <Eye className="w-4 h-4 mr-1" />
              <span className="text-xs font-semibold">Impressions</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{analytics.impressions.toLocaleString()}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center text-green-600 mb-1">
              <MousePointer className="w-4 h-4 mr-1" />
              <span className="text-xs font-semibold">Clicks</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{analytics.clicks.toLocaleString()}</p>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center text-purple-600 mb-1">
              <ShoppingCart className="w-4 h-4 mr-1" />
              <span className="text-xs font-semibold">Conversions</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{analytics.conversions.toLocaleString()}</p>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center text-orange-600 mb-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-xs font-semibold">ROI</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{analytics.roi}%</p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">CTR:</span>
          <span className="font-semibold text-gray-900">{analytics?.ctr}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">CPC:</span>
          <span className="font-semibold text-gray-900">{analytics?.cpc} TZS</span>
        </div>
      </div>

      <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-medium">
        View Details
      </button>
    </div>
  );
};

const CreateCampaignModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    campaign_name: '',
    ad_type: 'banner',
    budget: '',
    duration_days: 30,
    targeting: {}
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/monetization/campaigns', formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
            <input
              type="text"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Type</label>
            <select
              value={formData.ad_type}
              onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="banner">Banner</option>
              <option value="featured_listing">Featured Listing</option>
              <option value="sponsored_search">Sponsored Search</option>
              <option value="category_sponsor">Category Sponsor</option>
              <option value="regional">Regional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget (TZS)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
            <input
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvertisingPlatform;
