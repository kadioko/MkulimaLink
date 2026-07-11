import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, DollarSign, MessageSquare, Calendar } from 'lucide-react';
import api from '../../api/axios';

const ExpertNetwork = () => {
  const [experts, setExperts] = useState([]);
  const [topExperts, setTopExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpertise, setSelectedExpertise] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);

  const expertiseAreas = [
    'soil_management',
    'pest_management',
    'crop_selection',
    'irrigation',
    'climate_adaptation',
    'market_linkage',
    'financial_management',
    'technology_adoption'
  ];

  useEffect(() => {
    fetchExperts();
  }, [selectedExpertise]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const [searchRes, topRes] = await Promise.all([
        api.get('/api/community/experts/search', {
          params: { expertise: selectedExpertise }
        }),
        api.get('/api/community/experts/top')
      ]);

      setExperts(searchRes.data.experts || []);
      setTopExperts(topRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch experts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading experts...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Expert Network</h1>
          <p className="text-gray-600">Get personalized advice from experienced agricultural experts</p>
        </div>

        {/* Top Experts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Rated Experts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topExperts.map((expert) => (
              <ExpertCard
                key={expert._id}
                expert={expert}
                onBook={() => {
                  setSelectedExpert(expert);
                  setShowBookingModal(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* Filter by Expertise */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Expertise</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedExpertise(null)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedExpertise === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Experts
            </button>
            {expertiseAreas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedExpertise(area)}
                className={`px-4 py-2 rounded-full font-medium transition capitalize ${
                  selectedExpertise === area
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Experts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((expert) => (
            <ExpertCard
              key={expert._id}
              expert={expert}
              onBook={() => {
                setSelectedExpert(expert);
                setShowBookingModal(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedExpert && (
        <BookingModal
          expert={selectedExpert}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchExperts();
          }}
        />
      )}
    </div>
  );
};

const ExpertCard = ({ expert, onBook }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{expert.user_id?.name}</h3>
        <div className="flex items-center mt-1">
          <Star className="w-4 h-4 text-yellow-400 mr-1" />
          <span className="text-sm font-semibold text-gray-700">
            {expert.rating?.toFixed(1) || 'N/A'} ({expert.reviews_count || 0} reviews)
          </span>
        </div>
      </div>
      {expert.verified && (
        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
          Verified
        </div>
      )}
    </div>

    <p className="text-gray-600 text-sm mb-4">{expert.bio}</p>

    <div className="space-y-2 mb-4">
      <div className="flex items-center text-sm text-gray-600">
        <Clock className="w-4 h-4 mr-2 text-blue-600" />
        {expert.experience_years} years experience
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
        {expert.hourly_rate} TZS/hour
      </div>
    </div>

    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">Expertise:</p>
      <div className="flex flex-wrap gap-1">
        {expert.expertise?.slice(0, 3).map((exp) => (
          <span key={exp} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            {exp.replace('_', ' ')}
          </span>
        ))}
        {expert.expertise?.length > 3 && (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
            +{expert.expertise.length - 3}
          </span>
        )}
      </div>
    </div>

    <button
      onClick={onBook}
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
    >
      <Calendar className="w-4 h-4 mr-2" />
      Book Consultation
    </button>
  </div>
);

const BookingModal = ({ expert, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    consultation_type: 'video',
    scheduled_date: '',
    topic: '',
    duration_minutes: 30
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/community/consultations/book', {
        expert_id: expert.user_id._id,
        ...formData
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to book consultation:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Consultation</h2>
        <p className="text-gray-600 mb-6">with {expert.user_id?.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={formData.consultation_type}
              onChange={(e) => setFormData({ ...formData, consultation_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="phone">Phone Call</option>
              <option value="video">Video Call</option>
              <option value="chat">Chat</option>
              <option value="in_person">In Person</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <textarea
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="What would you like to discuss?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Cost:</strong> {((expert.hourly_rate / 60) * formData.duration_minutes).toFixed(0)} TZS
            </p>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpertNetwork;
