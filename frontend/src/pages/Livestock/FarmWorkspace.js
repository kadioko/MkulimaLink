import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const roleColors = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  worker: 'bg-green-100 text-green-700',
  vet: 'bg-red-100 text-red-700',
  viewer: 'bg-gray-100 text-gray-600'
};

const roleIcons = { owner: '👑', manager: '🎯', worker: '👨‍🌾', vet: '👨‍⚕️', viewer: '👁️' };

export default function FarmWorkspace() {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '', description: '', farmType: ['mixed'],
    location: { name: '', region: '' },
    settings: { currency: 'TZS', weightUnit: 'kg' }
  });
  const [newMember, setNewMember] = useState({ userId: '', role: 'worker' });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  async function fetchWorkspaces() {
    setLoading(true);
    try {
      const res = await api.get('/livestock/workspaces');
      setWorkspaces(res.data.data);
      if (res.data.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(res.data.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/livestock/workspaces', newWorkspace);
      setShowCreateModal(false);
      setNewWorkspace({ name: '', description: '', farmType: ['mixed'], location: { name: '', region: '' }, settings: { currency: 'TZS', weightUnit: 'kg' } });
      fetchWorkspaces();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!showMemberModal) return;
    setSaving(true);
    try {
      await api.post(`/livestock/workspaces/${showMemberModal._id}/members`, newMember);
      setShowMemberModal(null);
      setNewMember({ userId: '', role: 'worker' });
      fetchWorkspaces();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(workspaceId, userId) {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.delete(`/livestock/workspaces/${workspaceId}/members/${userId}`);
      fetchWorkspaces();
    } catch {
      alert('Failed to remove member');
    }
  }

  async function handleAcceptInvite(workspaceId, userId) {
    try {
      await api.put(`/livestock/workspaces/${workspaceId}/members/${userId}/accept`);
      fetchWorkspaces();
    } catch {
      alert('Failed to accept invite');
    }
  }

  const farmTypes = ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'mixed', 'dairy', 'feedlot', 'breeding'];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">🏡</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/livestock" className="text-slate-300 text-sm mb-4 inline-flex items-center gap-1">← Herd</Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">🏡 Farm Workspaces</h1>
              <p className="text-slate-300 mt-1">Manage multiple farms and collaborate with your team</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 self-start md:self-auto"
            >
              + New Workspace
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {workspaces.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm py-20 text-center">
            <div className="text-5xl mb-4">🏡</div>
            <p className="text-gray-600 font-medium text-lg">No workspaces yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a workspace to manage your farm and collaborate</p>
            <button onClick={() => setShowCreateModal(true)} className="mt-5 bg-slate-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800">
              + Create First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workspace List */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Your Farms ({workspaces.length})</h2>
              {workspaces.map(ws => (
                <div
                  key={ws._id}
                  onClick={() => setSelectedWorkspace(ws)}
                  className={`bg-white rounded-xl p-4 cursor-pointer border-2 transition-all ${selectedWorkspace?._id === ws._id ? 'border-slate-600 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                      {ws.logo ? <img src={ws.logo} alt="" className="w-full h-full object-cover rounded-xl" /> : '🏡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{ws.name}</p>
                      <p className="text-xs text-gray-500">{ws.location?.name || ws.location?.region || 'No location set'}</p>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {ws.members?.length || 0} member{ws.members?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ws.farmType?.map(t => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Workspace Detail */}
            {selectedWorkspace && (
              <div className="lg:col-span-2 space-y-5">
                {/* Info */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedWorkspace.name}</h2>
                      {selectedWorkspace.description && <p className="text-sm text-gray-500 mt-1">{selectedWorkspace.description}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Location', value: [selectedWorkspace.location?.name, selectedWorkspace.location?.region].filter(Boolean).join(', ') || '—' },
                      { label: 'Farm Type', value: selectedWorkspace.farmType?.join(', ') || '—', cls: 'capitalize' },
                      { label: 'Currency', value: selectedWorkspace.settings?.currency || 'TZS' },
                      { label: 'Weight Unit', value: selectedWorkspace.settings?.weightUnit || 'kg' },
                      { label: 'Created', value: new Date(selectedWorkspace.createdAt).toLocaleDateString() },
                      { label: 'Team Size', value: `${selectedWorkspace.members?.length || 0} member${selectedWorkspace.members?.length !== 1 ? 's' : ''}` },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className={`text-sm font-semibold text-gray-700 ${cls || ''}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">⚙️ Notification Settings</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Low stock alerts', key: 'lowStockNotifications' },
                      { label: 'Upcoming event alerts', key: 'upcomingEventNotifications' },
                    ].map(({ label, key }) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{label}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${selectedWorkspace.settings?.[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {selectedWorkspace.settings?.[key] ? 'On' : 'Off'}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700">Notify days before event</span>
                      <span className="text-sm font-medium text-gray-800">{selectedWorkspace.settings?.notificationDaysBefore || 3} days</span>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">👥 Team Members</h3>
                    <button
                      onClick={() => setShowMemberModal(selectedWorkspace)}
                      className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      + Invite
                    </button>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-lg">
                      {selectedWorkspace.owner?.name?.charAt(0)?.toUpperCase() || '👑'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{selectedWorkspace.owner?.name || 'Owner'}</p>
                      <p className="text-xs text-gray-500">{selectedWorkspace.owner?.email}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">👑 Owner</span>
                  </div>

                  {selectedWorkspace.members?.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-3xl mb-2">👥</div>
                      <p className="text-sm">No team members yet</p>
                      <button onClick={() => setShowMemberModal(selectedWorkspace)} className="mt-2 text-slate-600 text-sm underline">Invite someone</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedWorkspace.members?.map(member => (
                        <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 text-sm">
                            {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{member.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[member.role]}`}>
                              {roleIcons[member.role]} {member.role}
                            </span>
                            {member.inviteStatus === 'pending' && (
                              member.user?._id === user?._id
                                ? <button
                                    onClick={() => handleAcceptInvite(selectedWorkspace._id, member.user._id)}
                                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors font-semibold"
                                  >Accept invite</button>
                                : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                            )}
                            <button
                              onClick={() => handleRemoveMember(selectedWorkspace._id, member.user?._id)}
                              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm px-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Create Farm Workspace</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name *</label>
                <input required type="text" placeholder="e.g. Kilimo Bora Farm" value={newWorkspace.name}
                  onChange={e => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={newWorkspace.description}
                  onChange={e => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input type="text" placeholder="e.g. Morogoro Farm" value={newWorkspace.location.name}
                    onChange={e => setNewWorkspace({ ...newWorkspace, location: { ...newWorkspace.location, name: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input type="text" placeholder="e.g. Morogoro" value={newWorkspace.location.region}
                    onChange={e => setNewWorkspace({ ...newWorkspace, location: { ...newWorkspace.location, region: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farm Type (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {farmTypes.map(t => (
                    <button key={t} type="button"
                      onClick={() => {
                        const types = newWorkspace.farmType.includes(t)
                          ? newWorkspace.farmType.filter(x => x !== t)
                          : [...newWorkspace.farmType, t];
                        setNewWorkspace({ ...newWorkspace, farmType: types });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${newWorkspace.farmType.includes(t) ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={newWorkspace.settings.currency}
                    onChange={e => setNewWorkspace({ ...newWorkspace, settings: { ...newWorkspace.settings, currency: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400">
                    <option value="TZS">TZS (Tanzania)</option>
                    <option value="KES">KES (Kenya)</option>
                    <option value="UGX">UGX (Uganda)</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit</label>
                  <select value={newWorkspace.settings.weightUnit}
                    onChange={e => setNewWorkspace({ ...newWorkspace, settings: { ...newWorkspace.settings, weightUnit: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400">
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lb">Pounds (lb)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-slate-700 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Invite Team Member</h3>
              <p className="text-sm text-gray-500 mt-1">Adding to: {showMemberModal.name}</p>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
                <input required type="text" placeholder="User's ID"
                  value={newMember.userId} onChange={e => setNewMember({ ...newMember, userId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" />
                <p className="text-xs text-gray-400 mt-1">Enter the user's account ID to invite them</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roleIcons).filter(([r]) => r !== 'owner').map(([role, icon]) => (
                    <button key={role} type="button"
                      onClick={() => setNewMember({ ...newMember, role })}
                      className={`py-2 rounded-lg text-sm capitalize transition-colors border-2 ${newMember.role === role ? 'border-slate-600 bg-slate-50 text-slate-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {icon} {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMemberModal(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-slate-700 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
                  {saving ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
