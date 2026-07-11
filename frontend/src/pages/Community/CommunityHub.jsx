import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Search, Plus } from 'lucide-react';
import api from '../../api/axios';

const CommunityHub = () => {
  const [communities, setCommunities] = useState([]);
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const [userRes, trendingRes] = await Promise.all([
        api.get('/api/community/communities'),
        api.get('/api/community/communities/trending')
      ]);

      setCommunities(userRes.data.communities || []);
      setTrendingCommunities(trendingRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get('/api/community/communities/search', {
        params: { query: searchQuery, type: selectedType }
      });

      setCommunities(response.data.communities || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading communities...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmer Communities</h1>
              <p className="text-gray-600">Connect, learn, and grow with farmers like you</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Community
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Trending Communities */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Trending Communities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCommunities.map((community) => (
              <CommunityCard key={community._id} community={community} />
            ))}
          </div>
        </div>

        {/* My Communities */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            My Communities
          </h2>
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard key={community._id} community={community} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">You haven't joined any communities yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Your First Community
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCommunities();
          }}
        />
      )}
    </div>
  );
};

const CommunityCard = ({ community }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{community.name}</h3>
        <p className="text-sm text-gray-600 capitalize">{community.type}</p>
      </div>
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        {community.type}
      </span>
    </div>

    <p className="text-gray-600 mb-4 line-clamp-2">{community.description}</p>

    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
      <div className="flex items-center">
        <Users className="w-4 h-4 mr-1" />
        {community.member_count || 0} members
      </div>
      <div className="flex items-center">
        <MessageSquare className="w-4 h-4 mr-1" />
        {community.post_count || 0} posts
      </div>
    </div>

    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium">
      View Community
    </button>
  </div>
);

const CreateCommunityModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'regional',
    category: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/community/communities', formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create community:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Community</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Community Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="regional">Regional</option>
              <option value="crop">Crop</option>
              <option value="interest">Interest</option>
              <option value="skill">Skill</option>
            </select>
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunityHub;
