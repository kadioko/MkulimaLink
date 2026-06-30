import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const recordTypeLabels = {
  heat_cycle: { label: 'Heat Cycle', icon: '🌡️', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  mating: { label: 'Mating', icon: '❤️', color: 'bg-red-50 text-red-700 border-red-200' },
  pregnancy: { label: 'Pregnancy', icon: '🤰', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  birth_outcome: { label: 'Birth', icon: '🍼', color: 'bg-green-50 text-green-700 border-green-200' }
};

const pregnancyStatusColors = {
  suspected: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  aborted: 'bg-red-100 text-red-700',
  false_pregnancy: 'bg-gray-100 text-gray-600'
};

export default function ReproductionTracker() {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [upcomingBirths, setUpcomingBirths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRecord, setNewRecord] = useState({
    animal: '', recordType: 'heat_cycle',
    mating: { date: new Date().toISOString().split('T')[0], method: 'natural', sireName: '', notes: '' },
    pregnancy: { confirmed: false, confirmationDate: '', confirmationMethod: 'physical_exam', expectedDueDate: '', status: 'suspected' },
    birthOutcome: { date: new Date().toISOString().split('T')[0], numberOfOffspring: 1, liveBirths: 1, stillbirths: 0, notes: '' }
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [recordsRes, animalsRes, birthsRes] = await Promise.all([
        api.get('/livestock/reproduction'),
        api.get('/livestock/animals?gender=female'),
        api.get('/livestock/reproduction/upcoming-births')
      ]);
      setRecords(recordsRes.data.data);
      setAnimals(animalsRes.data.data);
      setUpcomingBirths(birthsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/livestock/reproduction', newRecord);
      setShowAddModal(false);
      setNewRecord({
        animal: '', recordType: 'heat_cycle',
        mating: { date: new Date().toISOString().split('T')[0], method: 'natural', sireName: '', notes: '' },
        pregnancy: { confirmed: false, confirmationDate: '', confirmationMethod: 'physical_exam', expectedDueDate: '', status: 'suspected' },
        birthOutcome: { date: new Date().toISOString().split('T')[0], numberOfOffspring: 1, liveBirths: 1, stillbirths: 0, notes: '' }
      });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  }

  function daysUntil(date) {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / 86400000);
  }

  const filteredRecords = filterType ? records.filter(r => r.recordType === filterType) : records;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">🤰</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/livestock" className="text-purple-200 text-sm mb-4 inline-flex items-center gap-1">← Herd</Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">❤️ Reproduction Management</h1>
              <p className="text-purple-100 mt-1">Track heat cycles, mating, pregnancy and birth outcomes</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-purple-700 font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 self-start md:self-auto"
            >
              + New Record
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(recordTypeLabels).map(([type, meta]) => (
            <div key={type} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-300">
              <p className="text-xs text-gray-500">{meta.label}</p>
              <p className="text-2xl font-bold text-gray-800">{records.filter(r => r.recordType === type).length}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Births */}
        {upcomingBirths.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">🍼 Upcoming Births</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirths.map(r => {
                const days = daysUntil(r.pregnancy?.expectedDueDate);
                return (
                  <div key={r._id} className={`rounded-xl p-4 border-2 ${days <= 7 ? 'border-red-300 bg-red-50' : days <= 14 ? 'border-orange-300 bg-orange-50' : 'border-purple-200 bg-purple-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">🐄</div>
                      <div>
                        <p className="font-semibold text-gray-800">{r.animal?.name || `Tag: ${r.animal?.tagId}`}</p>
                        <p className="text-xs text-gray-500 capitalize">{r.animal?.species} · {r.animal?.breed || 'Unknown breed'}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-bold text-center py-2 rounded-lg ${days <= 7 ? 'bg-red-100 text-red-700' : days <= 14 ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                      {days <= 0 ? 'Due today / overdue!' : `Due in ${days} day${days > 1 ? 's' : ''}`}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {r.pregnancy?.expectedDueDate ? new Date(r.pregnancy.expectedDueDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterType('')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === '' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            All Records
          </button>
          {Object.entries(recordTypeLabels).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${filterType === type ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* Records */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm py-16 text-center">
            <div className="text-4xl mb-3">❤️</div>
            <p className="text-gray-500">No reproduction records yet</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700">+ Add First Record</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map(record => {
              const meta = recordTypeLabels[record.recordType];
              return (
                <div key={record._id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta?.icon}</span>
                      <div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${meta?.color}`}>{meta?.label}</span>
                        <p className="font-semibold text-gray-800 mt-1">
                          {record.animal?.name || `Tag: ${record.animal?.tagId}`}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{record.animal?.species} · {record.animal?.breed}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>

                  {record.recordType === 'mating' && record.mating && (
                    <div className="bg-red-50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium">{record.mating.date ? new Date(record.mating.date).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method</span>
                        <span className="font-medium capitalize">{record.mating.method?.replace('_', ' ')}</span>
                      </div>
                      {record.mating.sireName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sire</span>
                          <span className="font-medium">{record.mating.sireName}</span>
                        </div>
                      )}
                      {record.mating.successful !== undefined && record.mating.successful !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Success</span>
                          <span className={`font-medium ${record.mating.successful ? 'text-green-600' : 'text-red-600'}`}>
                            {record.mating.successful ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {record.recordType === 'pregnancy' && record.pregnancy && (
                    <div className="bg-purple-50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${pregnancyStatusColors[record.pregnancy.status]}`}>
                          {record.pregnancy.status?.replace('_', ' ')}
                        </span>
                      </div>
                      {record.pregnancy.expectedDueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due Date</span>
                          <span className="font-medium">{new Date(record.pregnancy.expectedDueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {record.pregnancy.confirmationMethod && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Confirmed By</span>
                          <span className="font-medium capitalize">{record.pregnancy.confirmationMethod?.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {record.recordType === 'birth_outcome' && record.birthOutcome && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-gray-500 text-xs">Total</p>
                          <p className="text-xl font-bold text-gray-800">{record.birthOutcome.numberOfOffspring}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Live</p>
                          <p className="text-xl font-bold text-green-600">{record.birthOutcome.liveBirths}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Stillborn</p>
                          <p className="text-xl font-bold text-red-500">{record.birthOutcome.stillbirths}</p>
                        </div>
                      </div>
                      {record.birthOutcome.date && (
                        <p className="text-xs text-gray-500 text-center mt-2">Born: {new Date(record.birthOutcome.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {record.recordType === 'heat_cycle' && record.heatCycles?.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-500 mb-1">Last Heat Cycle</p>
                      <p className="font-medium">{new Date(record.heatCycles[record.heatCycles.length - 1].startDate).toLocaleDateString()}</p>
                      {record.predictedNextHeat && (
                        <p className="text-xs text-pink-600 mt-1">
                          Next predicted: {new Date(record.predictedNextHeat).toLocaleDateString()}
                        </p>
                      )}
                      {record.avgCycleLength && (
                        <p className="text-xs text-gray-500 mt-1">Avg cycle: {record.avgCycleLength} days</p>
                      )}
                    </div>
                  )}

                  {record.notes && <p className="text-xs text-gray-500 mt-3 italic">{record.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">New Reproduction Record</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal *</label>
                <select required value={newRecord.animal} onChange={e => setNewRecord({ ...newRecord, animal: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400">
                  <option value="">Select animal...</option>
                  {animals.map(a => (
                    <option key={a._id} value={a._id}>{a.name || `Tag: ${a.tagId}`} — {a.species}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(recordTypeLabels).map(([type, meta]) => (
                    <button key={type} type="button"
                      onClick={() => setNewRecord({ ...newRecord, recordType: type })}
                      className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-1 ${newRecord.recordType === type ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {meta.icon} {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              {newRecord.recordType === 'mating' && (
                <div className="space-y-3 bg-red-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700">Mating Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <input type="date" value={newRecord.mating.date}
                        onChange={e => setNewRecord({ ...newRecord, mating: { ...newRecord.mating, date: e.target.value } })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Method</label>
                      <select value={newRecord.mating.method}
                        onChange={e => setNewRecord({ ...newRecord, mating: { ...newRecord.mating, method: e.target.value } })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                        <option value="natural">Natural</option>
                        <option value="artificial_insemination">AI</option>
                        <option value="embryo_transfer">Embryo Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sire Name/Tag</label>
                    <input type="text" placeholder="Sire identifier"
                      value={newRecord.mating.sireName}
                      onChange={e => setNewRecord({ ...newRecord, mating: { ...newRecord.mating, sireName: e.target.value } })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notes</label>
                    <input type="text" value={newRecord.mating.notes}
                      onChange={e => setNewRecord({ ...newRecord, mating: { ...newRecord.mating, notes: e.target.value } })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                </div>
              )}

              {newRecord.recordType === 'pregnancy' && (
                <div className="space-y-3 bg-purple-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-purple-700">Pregnancy Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expected Due Date</label>
                      <input type="date" value={newRecord.pregnancy.expectedDueDate}
                        onChange={e => setNewRecord({ ...newRecord, pregnancy: { ...newRecord.pregnancy, expectedDueDate: e.target.value } })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status</label>
                      <select value={newRecord.pregnancy.status}
                        onChange={e => setNewRecord({ ...newRecord, pregnancy: { ...newRecord.pregnancy, status: e.target.value } })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                        <option value="suspected">Suspected</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Confirmation Method</label>
                    <select value={newRecord.pregnancy.confirmationMethod}
                      onChange={e => setNewRecord({ ...newRecord, pregnancy: { ...newRecord.pregnancy, confirmationMethod: e.target.value } })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                      <option value="ultrasound">Ultrasound</option>
                      <option value="blood_test">Blood Test</option>
                      <option value="physical_exam">Physical Exam</option>
                      <option value="observation">Observation</option>
                    </select>
                  </div>
                </div>
              )}

              {newRecord.recordType === 'birth_outcome' && (
                <div className="space-y-3 bg-green-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-700">Birth Outcome</p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Birth Date</label>
                    <input type="date" value={newRecord.birthOutcome.date}
                      onChange={e => setNewRecord({ ...newRecord, birthOutcome: { ...newRecord.birthOutcome, date: e.target.value } })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[['Total Offspring', 'numberOfOffspring'], ['Live Births', 'liveBirths'], ['Stillbirths', 'stillbirths']].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1">{label}</label>
                        <input type="number" min="0" value={newRecord.birthOutcome[key]}
                          onChange={e => setNewRecord({ ...newRecord, birthOutcome: { ...newRecord.birthOutcome, [key]: parseInt(e.target.value) } })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notes / Complications</label>
                    <input type="text" value={newRecord.birthOutcome.notes}
                      onChange={e => setNewRecord({ ...newRecord, birthOutcome: { ...newRecord.birthOutcome, notes: e.target.value } })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
