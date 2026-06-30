import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const speciesIcons = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷', chicken: '🐓',
  duck: '🦆', turkey: '🦃', rabbit: '🐇', horse: '🐴', donkey: '🫏',
  camel: '🐪', other: '🐾'
};

const healthColors = {
  healthy: 'bg-green-100 text-green-700',
  sick: 'bg-red-100 text-red-700',
  recovering: 'bg-yellow-100 text-yellow-700',
  pregnant: 'bg-purple-100 text-purple-700',
  deceased: 'bg-gray-100 text-gray-500',
  sold: 'bg-blue-100 text-blue-700'
};

export default function LivestockDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [upcomingBirths, setUpcomingBirths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'cattle', gender: 'female', breed: '', tagId: '' });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [statsRes, animalsRes, remindersRes, inventoryRes, birthsRes] = await Promise.all([
        api.get('/livestock/stats'),
        api.get('/livestock/animals'),
        api.get('/livestock/reminders'),
        api.get('/livestock/inventory?lowStock=true'),
        api.get('/livestock/reproduction/upcoming-births')
      ]);
      setStats(statsRes.data.data);
      setAnimals(animalsRes.data.data);
      setReminders(remindersRes.data.data);
      setInventory(inventoryRes.data.data);
      setUpcomingBirths(birthsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAnimal(e) {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/livestock/animals', newAnimal);
      setShowAddModal(false);
      setNewAnimal({ name: '', species: 'cattle', gender: 'female', breed: '', tagId: '' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add animal');
    } finally {
      setAddLoading(false);
    }
  }

  const filteredAnimals = animals.filter(a => {
    if (filterSpecies && a.species !== filterSpecies) return false;
    if (filterHealth && a.healthStatus !== filterHealth) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (a.name || '').toLowerCase().includes(term) ||
        (a.tagId || '').toLowerCase().includes(term) ||
        (a.breed || '').toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🐄</div>
          <p className="text-gray-500 font-medium">Loading your herd...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">🐾 Livestock Manager</h1>
              <p className="text-green-100 mt-1">Take control of your herd with complete farm management</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <span>+</span> Add Animal
              </button>
              <Link to="/livestock/inventory" className="bg-green-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-900 transition-colors">
                Inventory
              </Link>
              <Link to="/livestock/reproduction" className="bg-green-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-900 transition-colors">
                Reproduction
              </Link>
              <Link to="/livestock/breeds" className="bg-green-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-900 transition-colors">
                Breeds
              </Link>
              <Link to="/livestock/workspace" className="bg-green-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-900 transition-colors">
                Workspaces
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Total Animals</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            {stats.byHealth?.map(h => (
              <div key={h._id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${h._id === 'healthy' ? 'border-green-400' : h._id === 'sick' ? 'border-red-400' : h._id === 'pregnant' ? 'border-purple-400' : 'border-gray-300'}`}>
                <p className="text-sm text-gray-500 capitalize">{h._id}</p>
                <p className="text-3xl font-bold text-gray-800">{h.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Alert Banners */}
        <div className="space-y-3">
          {inventory.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-orange-800">{inventory.length} inventory item{inventory.length > 1 ? 's' : ''} running low</p>
                  <p className="text-sm text-orange-600">{inventory.map(i => i.name).join(', ')}</p>
                </div>
              </div>
              <Link to="/livestock/inventory" className="text-orange-700 font-medium text-sm underline">View</Link>
            </div>
          )}
          {upcomingBirths.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍼</span>
                <div>
                  <p className="font-semibold text-purple-800">{upcomingBirths.length} birth{upcomingBirths.length > 1 ? 's' : ''} expected soon</p>
                  <p className="text-sm text-purple-600">{upcomingBirths.slice(0, 2).map(b => b.animal?.name || b.animal?.tagId).join(', ')}</p>
                </div>
              </div>
              <Link to="/livestock/reproduction" className="text-purple-700 font-medium text-sm underline">View</Link>
            </div>
          )}
          {reminders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-semibold text-blue-800">{reminders.length} upcoming reminder{reminders.length > 1 ? 's' : ''}</p>
                  <p className="text-sm text-blue-600">{reminders.slice(0, 2).map(r => r.title).join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Species Breakdown */}
        {stats?.bySpecies?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Herd Breakdown</h2>
            <div className="flex flex-wrap gap-3">
              {stats.bySpecies.map(s => (
                <button
                  key={s._id}
                  onClick={() => setFilterSpecies(filterSpecies === s._id ? '' : s._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-medium ${filterSpecies === s._id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300'}`}
                >
                  <span className="text-xl">{speciesIcons[s._id] || '🐾'}</span>
                  <span className="capitalize">{s._id}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Animal List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-start md:items-center">
            <h2 className="font-bold text-gray-800 text-lg flex-1">Animals</h2>
            <input
              type="text"
              placeholder="Search by name, tag, breed..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-green-400"
            />
            <select
              value={filterHealth}
              onChange={e => setFilterHealth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            >
              <option value="">All Health</option>
              {['healthy', 'sick', 'recovering', 'pregnant', 'sold'].map(h => (
                <option key={h} value={h} className="capitalize">{h}</option>
              ))}
            </select>
          </div>

          {filteredAnimals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🐾</div>
              <p className="text-gray-500 font-medium">No animals found</p>
              <p className="text-gray-400 text-sm mt-1">Add your first animal to get started</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700">+ Add Animal</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredAnimals.map(animal => (
                <div
                  key={animal._id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/livestock/${animal._id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {animal.photos?.find(p => p.isPrimary)?.url
                      ? <img src={animal.photos.find(p => p.isPrimary).url} alt="" className="w-full h-full object-cover rounded-full" />
                      : speciesIcons[animal.species] || '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 truncate">{animal.name || `Tag: ${animal.tagId}`}</p>
                      {animal.tagId && <span className="text-xs text-gray-400 font-mono">#{animal.tagId}</span>}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{animal.species} · {animal.breed || 'Unknown breed'} · {animal.gender}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${healthColors[animal.healthStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {animal.healthStatus}
                    </span>
                    {animal.group && <span className="text-xs text-gray-400">{animal.group}</span>}
                  </div>
                  <span className="text-gray-300 text-lg ml-2">›</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Add Animal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Add New Animal</h3>
              <p className="text-sm text-gray-500 mt-1">Create a profile for your animal</p>
            </div>
            <form onSubmit={handleAddAnimal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                <select
                  required
                  value={newAnimal.species}
                  onChange={e => setNewAnimal({ ...newAnimal, species: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                >
                  {['cattle', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'turkey', 'rabbit', 'horse', 'donkey', 'camel', 'other'].map(s => (
                    <option key={s} value={s}>{speciesIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bella"
                  value={newAnimal.name}
                  onChange={e => setNewAnimal({ ...newAnimal, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag ID</label>
                <input
                  type="text"
                  placeholder="e.g. TZ-001"
                  value={newAnimal.tagId}
                  onChange={e => setNewAnimal({ ...newAnimal, tagId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  placeholder="e.g. Friesian"
                  value={newAnimal.breed}
                  onChange={e => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  required
                  value={newAnimal.gender}
                  onChange={e => setNewAnimal({ ...newAnimal, gender: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="castrated">Castrated</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {addLoading ? 'Adding...' : 'Add Animal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
