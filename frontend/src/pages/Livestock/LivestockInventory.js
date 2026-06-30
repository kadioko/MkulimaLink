import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const categoryIcons = {
  feed: '🌾', medication: '💊', vaccine: '💉', supplement: '🧪',
  equipment: '🔧', bedding: '🛏️', chemical: '⚗️', other: '📦'
};

const categoryColors = {
  feed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  medication: 'bg-red-50 text-red-700 border-red-200',
  vaccine: 'bg-blue-50 text-blue-700 border-blue-200',
  supplement: 'bg-purple-50 text-purple-700 border-purple-200',
  equipment: 'bg-gray-50 text-gray-700 border-gray-200',
  bedding: 'bg-orange-50 text-orange-700 border-orange-200',
  chemical: 'bg-pink-50 text-pink-700 border-pink-200',
  other: 'bg-green-50 text-green-700 border-green-200'
};

const units = ['kg', 'g', 'liter', 'ml', 'piece', 'bag', 'bottle', 'box', 'dose'];
const categories = ['feed', 'medication', 'vaccine', 'supplement', 'equipment', 'bedding', 'chemical', 'other'];

export default function LivestockInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', category: 'feed', unit: 'kg', currentQuantity: 0, reorderPoint: 0, description: ''
  });
  const [movement, setMovement] = useState({ type: 'in', quantity: '', reason: '' });

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await api.get('/livestock/inventory');
      setItems(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/livestock/inventory', newItem);
      setShowAddModal(false);
      setNewItem({ name: '', category: 'feed', unit: 'kg', currentQuantity: 0, reorderPoint: 0, description: '' });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  async function handleMovement(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/livestock/inventory/${showMovementModal._id}/movement`, {
        ...movement,
        quantity: parseFloat(movement.quantity)
      });
      setShowMovementModal(null);
      setMovement({ type: 'in', quantity: '', reason: '' });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log movement');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this item?')) return;
    try {
      await api.delete(`/livestock/inventory/${id}`);
      fetchInventory();
    } catch {
      alert('Failed to remove item');
    }
  }

  const filtered = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (showLowStock && !(item.reorderPoint > 0 && item.currentQuantity <= item.reorderPoint)) return false;
    if (search) return item.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const lowStockCount = items.filter(i => i.reorderPoint > 0 && i.currentQuantity <= i.reorderPoint).length;

  function stockStatus(item) {
    if (item.reorderPoint > 0 && item.currentQuantity <= item.reorderPoint) {
      return { label: 'Low Stock', cls: 'bg-red-100 text-red-700' };
    }
    if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
      return { label: 'Expired', cls: 'bg-gray-100 text-gray-600' };
    }
    const daysToExpiry = item.expiryDate ? Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000) : null;
    if (daysToExpiry !== null && daysToExpiry <= 30) {
      return { label: `Expires in ${daysToExpiry}d`, cls: 'bg-orange-100 text-orange-700' };
    }
    return { label: 'In Stock', cls: 'bg-green-100 text-green-700' };
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">📦</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/livestock" className="text-green-200 text-sm mb-4 inline-flex items-center gap-1">← Herd</Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">📦 Smart Inventory</h1>
              <p className="text-green-100 mt-1">Track feed, medication, vaccines and equipment</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-50 self-start md:self-auto"
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-800">{items.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-400 cursor-pointer" onClick={() => setShowLowStock(!showLowStock)}>
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
          </div>
          {categories.slice(0, 2).map(cat => (
            <div key={cat} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-200">
              <p className="text-xs text-gray-500 capitalize">{cat}</p>
              <p className="text-2xl font-bold text-gray-800">{items.filter(i => i.category === cat).length}</p>
            </div>
          ))}
        </div>

        {lowStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">{lowStockCount} item{lowStockCount > 1 ? 's' : ''} need restocking</p>
              <p className="text-sm text-red-600">{items.filter(i => i.reorderPoint > 0 && i.currentQuantity <= i.reorderPoint).map(i => i.name).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 w-56"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterCategory === '' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors flex items-center gap-1 ${filterCategory === cat ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                {categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${showLowStock ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            ⚠️ Low Stock Only
          </button>
        </div>

        {/* Items Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm py-16 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500">No inventory items found</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700">+ Add First Item</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const status = stockStatus(item);
              const pct = item.maxQuantity > 0 ? Math.min(100, (item.currentQuantity / item.maxQuantity) * 100) : null;
              return (
                <div key={item._id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryIcons[item.category] || '📦'}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${categoryColors[item.category]}`}>{item.category}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Current Stock</span>
                      <span className="font-bold text-gray-800">{item.currentQuantity} {item.unit}</span>
                    </div>
                    {item.reorderPoint > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Reorder Point</span>
                        <span className="text-sm text-gray-600">{item.reorderPoint} {item.unit}</span>
                      </div>
                    )}
                    {pct !== null && (
                      <div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${pct < 25 ? 'bg-red-400' : pct < 50 ? 'bg-orange-400' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Expires</span>
                        <span className="text-sm text-gray-600">{new Date(item.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.storageLocation && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Location</span>
                        <span className="text-sm text-gray-600">{item.storageLocation}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMovementModal(item)}
                      className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      + Stock Movement
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Add Inventory Item</h3>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input required type="text" placeholder="e.g. Dairy Meal" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select required value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400">
                    {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select required value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400">
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Qty</label>
                  <input type="number" min="0" value={newItem.currentQuantity} onChange={e => setNewItem({ ...newItem, currentQuantity: parseFloat(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                  <input type="number" min="0" value={newItem.reorderPoint} onChange={e => setNewItem({ ...newItem, reorderPoint: parseFloat(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Stock Movement</h3>
              <p className="text-sm text-gray-500 mt-1">{showMovementModal.name} — Current: {showMovementModal.currentQuantity} {showMovementModal.unit}</p>
            </div>
            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="flex gap-2">
                  {['in', 'out', 'adjustment'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMovement({ ...movement, type: t })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${movement.type === t ? (t === 'in' ? 'bg-green-600 text-white border-green-600' : t === 'out' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t === 'in' ? '↑' : t === 'out' ? '↓' : '⟳'} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input required type="number" min="0" step="0.1" placeholder={`Amount in ${showMovementModal.unit}`}
                  value={movement.quantity} onChange={e => setMovement({ ...movement, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input type="text" placeholder="e.g. Fed to cattle pen A"
                  value={movement.reason} onChange={e => setMovement({ ...movement, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMovementModal(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
