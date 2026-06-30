import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const speciesIcons = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷', chicken: '🐓',
  duck: '🦆', turkey: '🦃', rabbit: '🐇', horse: '🐴', donkey: '🫏',
  camel: '🐪', other: '🐾'
};

const healthColors = {
  healthy: 'bg-green-100 text-green-700 border-green-200',
  sick: 'bg-red-100 text-red-700 border-red-200',
  recovering: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pregnant: 'bg-purple-100 text-purple-700 border-purple-200',
  deceased: 'bg-gray-100 text-gray-600 border-gray-200',
  sold: 'bg-blue-100 text-blue-700 border-blue-200'
};

const eventTypeIcons = {
  birth: '🍼', nutrition: '🌾', medical: '💊', vaccination: '💉',
  weighing: '⚖️', breeding: '❤️', pregnancy_check: '🔍', purchase: '💰',
  sale: '🏷️', death: '💔', milestone: '⭐', grooming: '✂️',
  hoof_trim: '🔧', deworming: '💊', other: '📝'
};

const eventTypes = ['birth', 'nutrition', 'medical', 'vaccination', 'weighing', 'breeding', 'pregnancy_check', 'purchase', 'sale', 'death', 'milestone', 'grooming', 'deworming', 'other'];

export default function AnimalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [events, setEvents] = useState([]);
  const [offspring, setOffspring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [eventFilter, setEventFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [newEvent, setNewEvent] = useState({ type: 'medical', title: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnimal();
  }, [id]);

  async function fetchAnimal() {
    setLoading(true);
    try {
      const [animalRes, eventsRes, offspringRes] = await Promise.all([
        api.get(`/livestock/animals/${id}`),
        api.get(`/livestock/events?animal=${id}`),
        api.get(`/livestock/animals/${id}/offspring`)
      ]);
      setAnimal(animalRes.data.data);
      setEditData(animalRes.data.data);
      setEvents(eventsRes.data.data);
      setOffspring(offspringRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/livestock/animals/${id}`, editData);
      setShowEditModal(false);
      fetchAnimal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/livestock/events', { ...newEvent, animal: id });
      setShowEventModal(false);
      setNewEvent({ type: 'medical', title: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchAnimal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this animal from your records?')) return;
    try {
      await api.delete(`/livestock/animals/${id}`);
      navigate('/livestock');
    } catch (err) {
      alert('Failed to remove animal');
    }
  }

  const filteredEvents = eventFilter ? events.filter(e => e.type === eventFilter) : events;

  function calcAge(dob) {
    if (!dob) return 'Unknown';
    const diff = new Date() - new Date(dob);
    const days = Math.floor(diff / 86400000);
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}yr ${Math.floor((days % 365) / 30)}mo`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🐄</div>
          <p className="text-gray-500">Loading animal profile...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Animal not found</p>
          <Link to="/livestock" className="mt-3 inline-block text-green-600 underline">Back to herd</Link>
        </div>
      </div>
    );
  }

  const primaryPhoto = animal.photos?.find(p => p.isPrimary)?.url;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/livestock" className="text-green-200 hover:text-white text-sm mb-4 inline-flex items-center gap-1">
            ← Back to Herd
          </Link>
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center mt-3">
            <div className="w-20 h-20 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden border-2 border-white border-opacity-30">
              {primaryPhoto
                ? <img src={primaryPhoto} alt="" className="w-full h-full object-cover rounded-2xl" />
                : <span>{speciesIcons[animal.species] || '🐾'}</span>}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{animal.name || `Animal #${animal.tagId}`}</h1>
                {animal.tagId && <span className="bg-white bg-opacity-20 text-xs font-mono px-2 py-1 rounded">Tag: {animal.tagId}</span>}
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize border ${healthColors[animal.healthStatus]}`}>
                  {animal.healthStatus}
                </span>
              </div>
              <p className="text-green-100 mt-1 capitalize">
                {animal.species} · {animal.breed || 'Unknown breed'} · {animal.gender} · Age: {calcAge(animal.dateOfBirth)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEditModal(true)} className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Edit
              </button>
              <button onClick={handleDelete} className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {['overview', 'events', 'parentage', 'offspring'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Vital Information</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Species', value: animal.species, className: 'capitalize' },
                  { label: 'Breed', value: animal.breed || '—' },
                  { label: 'Gender', value: animal.gender, className: 'capitalize' },
                  { label: 'Date of Birth', value: animal.dateOfBirth ? new Date(animal.dateOfBirth).toLocaleDateString() : '—' },
                  { label: 'Age', value: calcAge(animal.dateOfBirth) },
                  { label: 'Color', value: animal.color || '—' },
                  { label: 'Markings', value: animal.markings || '—' },
                  { label: 'Group', value: animal.group || '—' },
                ].map(({ label, value, className }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className={`text-sm font-medium text-gray-800 ${className || ''}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Weight & Location</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Weight', value: animal.weight?.value ? `${animal.weight.value} ${animal.weight.unit}` : '—' },
                    { label: 'Farm', value: animal.location?.farm || '—' },
                    { label: 'Pen/Pen', value: animal.location?.pen || '—' },
                    { label: 'Pasture', value: animal.location?.pasture || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <dt className="text-sm text-gray-500">{label}</dt>
                      <dd className="text-sm font-medium text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Acquisition</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Type', value: animal.acquisitionType || '—', className: 'capitalize' },
                    { label: 'Date', value: animal.acquisitionDate ? new Date(animal.acquisitionDate).toLocaleDateString() : '—' },
                    { label: 'Cost', value: animal.acquisitionCost ? `TZS ${animal.acquisitionCost.toLocaleString()}` : '—' },
                  ].map(({ label, value, className }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <dt className="text-sm text-gray-500">{label}</dt>
                      <dd className={`text-sm font-medium text-gray-800 ${className || ''}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {animal.notes && (
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{animal.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEventFilter('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${eventFilter === '' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  All
                </button>
                {['nutrition', 'medical', 'vaccination', 'weighing', 'breeding', 'milestone'].map(t => (
                  <button
                    key={t}
                    onClick={() => setEventFilter(eventFilter === t ? '' : t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors flex items-center gap-1 ${eventFilter === t ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {eventTypeIcons[t]} {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
              >
                + Log Event
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm py-16 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">No events recorded yet</p>
                <button onClick={() => setShowEventModal(true)} className="mt-3 text-green-600 font-medium text-sm underline">Log first event</button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-green-100"></div>
                <div className="space-y-1">
                  {filteredEvents.map((event) => (
                    <div key={event._id} className="relative flex gap-4 pl-12 py-3">
                      <div className="absolute left-3 top-4 w-5 h-5 rounded-full bg-white border-2 border-green-400 flex items-center justify-center text-xs">
                        {eventTypeIcons[event.type] || '📝'}
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{event.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{event.type.replace('_', ' ')} · {new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          {event.cost && <span className="text-xs text-gray-500">TZS {event.cost.toLocaleString()}</span>}
                        </div>
                        {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                        {event.performedBy && <p className="text-xs text-gray-400 mt-2">By: {event.performedBy}</p>}
                        {event.reminder?.isSet && (
                          <div className="mt-2 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded inline-flex items-center gap-1">
                            🔔 Reminder: {event.reminder.dueDate ? new Date(event.reminder.dueDate).toLocaleDateString() : 'Set'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PARENTAGE TAB */}
        {activeTab === 'parentage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {['mother', 'father'].map(parent => (
              <div key={parent} className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4 capitalize">{parent}</h3>
                {animal.parentage?.[parent] ? (
                  <Link
                    to={`/livestock/${animal.parentage[parent]._id}`}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-xl overflow-hidden">
                      {animal.parentage[parent].photos?.[0]?.url
                        ? <img src={animal.parentage[parent].photos[0].url} alt="" className="w-full h-full object-cover" />
                        : speciesIcons[animal.parentage[parent].species]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{animal.parentage[parent].name || `Tag: ${animal.parentage[parent].tagId}`}</p>
                      <p className="text-xs text-gray-500 capitalize">{animal.parentage[parent].species}</p>
                    </div>
                    <span className="ml-auto text-gray-400">›</span>
                  </Link>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">{parent === 'mother' ? '♀' : '♂'}</div>
                    <p className="text-sm">{parent === 'mother' ? 'Dam' : 'Sire'} not recorded</p>
                    {(parent === 'mother' ? animal.parentage?.motherTagId : animal.parentage?.fatherTagId) && (
                      <p className="text-xs mt-1">Tag: {parent === 'mother' ? animal.parentage.motherTagId : animal.parentage.fatherTagId}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* OFFSPRING TAB */}
        {activeTab === 'offspring' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Offspring ({offspring.length})</h3>
            </div>
            {offspring.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🍼</div>
                <p className="text-gray-500">No offspring recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {offspring.map(o => (
                  <Link
                    key={o._id}
                    to={`/livestock/${o._id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl overflow-hidden">
                      {o.photos?.[0]?.url ? <img src={o.photos[0].url} alt="" className="w-full h-full object-cover rounded-full" /> : speciesIcons[o.species]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{o.name || `Tag: ${o.tagId}`}</p>
                      <p className="text-xs text-gray-500 capitalize">{o.species} · {o.gender} · {calcAge(o.dateOfBirth)}</p>
                    </div>
                    <span className="text-gray-300">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Edit Animal</h3>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'Animal name' },
                { label: 'Tag ID', key: 'tagId', type: 'text', placeholder: 'e.g. TZ-001' },
                { label: 'Breed', key: 'breed', type: 'text', placeholder: 'Breed name' },
                { label: 'Color', key: 'color', type: 'text', placeholder: 'e.g. Brown' },
                { label: 'Group', key: 'group', type: 'text', placeholder: 'e.g. Milking Cows' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={editData[key] || ''}
                    onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <select
                  value={editData.healthStatus || 'healthy'}
                  onChange={e => setEditData({ ...editData, healthStatus: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                >
                  {['healthy', 'sick', 'recovering', 'pregnant', 'deceased', 'sold'].map(h => (
                    <option key={h} value={h} className="capitalize">{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editData.notes || ''}
                  onChange={e => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Log Event</h3>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select
                  required
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                >
                  {eventTypes.map(t => (
                    <option key={t} value={t}>{eventTypeIcons[t]} {t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  placeholder="Brief description"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
