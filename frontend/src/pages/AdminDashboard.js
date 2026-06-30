import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Package, DollarSign, TrendingUp, Settings, ShoppingBag,
  Shield, Bell, Activity, Eye, Trash2, Ban, CheckCircle, Crown,
  AlertTriangle, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Search, Filter, ChevronLeft, ChevronRight,
  UserCheck, UserX, Star, Globe,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const roleBadge = { admin: 'bg-purple-100 text-purple-800', farmer: 'bg-emerald-100 text-emerald-800', buyer: 'bg-blue-100 text-blue-800' };
const statusColor = { active: 'bg-green-100 text-green-800', sold: 'bg-blue-100 text-blue-800', reserved: 'bg-yellow-100 text-yellow-800', expired: 'bg-gray-100 text-gray-600' };

function StatCard({ title, value, icon: Icon, growth, sub, iconBg }) {
  return (
    <div className="bg-white border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <div className={`p-2 ${iconBg || 'bg-slate-100'}`}><Icon size={15} /></div>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {growth !== undefined && (
        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(growth)}% vs last month
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center items-center py-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
}

// ── Overview Tab ─────────────────────────────────────────────
function OverviewTab({ stats, growth, activity }) {
  const s = stats?.data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={s?.users?.total ?? '—'} icon={Users} growth={s?.users?.growth} sub={`${s?.users?.newThisMonth || 0} new this month`} iconBg="bg-blue-100 text-blue-600" />
        <StatCard title="Active Products" value={s?.products?.active ?? '—'} icon={Package} sub={`${s?.products?.total || 0} total`} iconBg="bg-emerald-100 text-emerald-600" />
        <StatCard title="Platform Revenue" value={`TZS ${(s?.transactions?.revenue || 0).toLocaleString()}`} icon={DollarSign} growth={s?.transactions?.revenueGrowth} sub={`TZS ${(s?.transactions?.revenueThisMonth || 0).toLocaleString()} this month`} iconBg="bg-violet-100 text-violet-600" />
        <StatCard title="Total Transactions" value={s?.transactions?.total ?? '—'} icon={ShoppingBag} sub={`${s?.transactions?.pending || 0} pending`} iconBg="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Farmers" value={s?.users?.farmers ?? '—'} icon={Users} iconBg="bg-emerald-50 text-emerald-700" />
        <StatCard title="Buyers" value={s?.users?.buyers ?? '—'} icon={Users} iconBg="bg-blue-50 text-blue-700" />
        <StatCard title="Premium Users" value={s?.users?.premium ?? '—'} icon={Crown} iconBg="bg-amber-50 text-amber-700" />
        <StatCard title="Banned Users" value={s?.users?.banned ?? '—'} icon={Ban} iconBg="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">User & Revenue Growth (6 months)</h3>
          {growth?.data?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growth.data}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} name="New Users" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Revenue (TZS)" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No growth data yet</div>}
        </div>

        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Recent Platform Activity</h3>
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {activity?.data?.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs ${a.icon === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {a.icon === 'user' ? <Users size={12} /> : <Package size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{a.label}</p>
                  <p className="text-xs text-slate-400">{new Date(a.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!activity?.data || activity.data.length === 0) && <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-1">Livestock on Platform</h3>
        <p className="text-3xl font-black text-amber-700">{s?.livestock?.totalAnimals ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-1">Active animals across all farm workspaces</p>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────
function UsersTab({ qc }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [viewUser, setViewUser] = useState(null);

  const params = new URLSearchParams({ page, limit: 15 });
  if (search) params.set('search', search);
  if (roleFilter) params.set('role', roleFilter);

  const { data, isLoading, refetch } = useQuery(['admin-users', page, search, roleFilter], () =>
    api.get(`/api/admin/users?${params}`).then(r => r.data), { keepPreviousData: true });

  const banMut = useMutation(({ id, reason }) => api.put(`/api/admin/users/${id}/ban`, { reason }), {
    onSuccess: () => { qc.invalidateQueries('admin-users'); setBanModal(null); setBanReason(''); }
  });
  const unbanMut = useMutation(id => api.put(`/api/admin/users/${id}/unban`), {
    onSuccess: () => qc.invalidateQueries('admin-users')
  });
  const roleMut = useMutation(({ id, role }) => api.put(`/api/admin/users/${id}/role`, { role }), {
    onSuccess: () => qc.invalidateQueries('admin-users')
  });
  const premiumMut = useMutation(({ id, grant }) => api.put(`/api/admin/users/${id}/premium`, { grant, days: 30 }), {
    onSuccess: () => qc.invalidateQueries('admin-users')
  });
  const verifyMut = useMutation(id => api.put(`/api/admin/users/${id}/verify`), {
    onSuccess: () => qc.invalidateQueries('admin-users')
  });
  const deleteMut = useMutation(id => api.delete(`/api/admin/users/${id}`), {
    onSuccess: () => { qc.invalidateQueries('admin-users'); setViewUser(null); }
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, phone…" className="w-full pl-9 pr-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
          <option value="">All Roles</option>
          <option value="farmer">Farmers</option>
          <option value="buyer">Buyers</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={refetch} className="flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><RefreshCw size={13} /> Refresh</button>
      </div>

      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{total} users</span>
        </div>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['User', 'Role', 'Status', 'Premium', 'Verified', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs rounded-sm">{u.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isPremium ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Premium</span>
                        : <span className="text-xs text-slate-400">Free</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.verified ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-slate-300" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewUser(u)} title="View" className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Eye size={13} /></button>
                        {u.isBanned
                          ? <button onClick={() => unbanMut.mutate(u._id)} title="Unban" className="p-1.5 hover:bg-green-50 text-green-600 rounded"><CheckCircle size={13} /></button>
                          : <button onClick={() => setBanModal(u)} title="Ban" className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Ban size={13} /></button>
                        }
                        {!u.isPremium
                          ? <button onClick={() => premiumMut.mutate({ id: u._id, grant: true })} title="Grant Premium" className="p-1.5 hover:bg-amber-50 text-amber-600 rounded"><Crown size={13} /></button>
                          : <button onClick={() => premiumMut.mutate({ id: u._id, grant: false })} title="Revoke Premium" className="p-1.5 hover:bg-slate-100 text-slate-500 rounded"><Crown size={13} /></button>
                        }
                        {!u.verified && <button onClick={() => verifyMut.mutate(u._id)} title="Verify" className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded"><UserCheck size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900">Ban {banModal.name}?</h3>
            <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason (optional)" className="w-full border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
            <div className="flex gap-3">
              <button onClick={() => banMut.mutate({ id: banModal._id, reason: banReason })} className="flex-1 bg-red-600 text-white py-2 text-sm font-bold hover:bg-red-700">Confirm Ban</button>
              <button onClick={() => { setBanModal(null); setBanReason(''); }} className="flex-1 border border-slate-200 py-2 text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View user modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">User Profile</h3>
              <button onClick={() => setViewUser(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[['Name', viewUser.name], ['Email', viewUser.email], ['Phone', viewUser.phone], ['Role', viewUser.role], ['Status', viewUser.isBanned ? 'Banned' : 'Active'], ['Premium', viewUser.isPremium ? 'Yes' : 'No'], ['Verified', viewUser.verified ? 'Yes' : 'No'], ['Joined', new Date(viewUser.createdAt).toLocaleDateString()]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-medium text-slate-500">{k}</span>
                  <span className="text-slate-800">{v}</span>
                </div>
              ))}
              {viewUser.bannedReason && <div className="bg-red-50 border border-red-100 p-3 text-xs text-red-700">Banned: {viewUser.bannedReason}</div>}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { if (window.confirm('Delete this user permanently?')) deleteMut.mutate(viewUser._id); }} className="flex-1 bg-red-600 text-white py-2 text-sm font-bold hover:bg-red-700">Delete Permanently</button>
              <button onClick={() => setViewUser(null)} className="flex-1 border border-slate-200 py-2 text-sm hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────
function ProductsTab({ qc }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page, limit: 15 });
  if (search) params.set('search', search);
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading } = useQuery(['admin-products', page, search, statusFilter], () =>
    api.get(`/api/admin/products?${params}`).then(r => r.data), { keepPreviousData: true });

  const setStatusMut = useMutation(({ id, status }) => api.put(`/api/admin/products/${id}/status`, { status }), {
    onSuccess: () => qc.invalidateQueries('admin-products')
  });
  const deleteMut = useMutation(id => api.delete(`/api/admin/products/${id}`), {
    onSuccess: () => qc.invalidateQueries('admin-products')
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" className="w-full pl-9 pr-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-200 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><span className="text-sm font-semibold text-slate-700">{total} products</span></div>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Product', 'Seller', 'Category', 'Price', 'Qty', 'Status', 'Listed', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.seller?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.price?.toLocaleString()} TZS</td>
                    <td className="px-4 py-3 text-slate-600">{p.quantity} {p.unit}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <select onChange={e => setStatusMut.mutate({ id: p._id, status: e.target.value })} value={p.status} className="text-xs border border-slate-200 px-1 py-0.5 focus:outline-none focus:border-emerald-500">
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="reserved">Reserved</option>
                          <option value="expired">Expired</option>
                        </select>
                        <button onClick={() => { if (window.confirm('Delete this product?')) deleteMut.mutate(p._id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────────────────
function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const params = new URLSearchParams({ page, limit: 15 });
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading } = useQuery(['admin-transactions', page, statusFilter], () =>
    api.get(`/api/admin/transactions?${params}`).then(r => r.data), { keepPreviousData: true });

  const txs = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-200 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><span className="text-sm font-semibold text-slate-700">{total} transactions</span></div>
        {isLoading ? <Spinner /> : txs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Product', 'Buyer', 'Seller', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txs.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.buyer?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.seller?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{(t.totalAmount || 0).toLocaleString()} TZS</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab() {
  const { data: userAnalytics } = useQuery('admin-analytics-users', () => api.get('/api/admin/analytics/users').then(r => r.data));
  const { data: productAnalytics } = useQuery('admin-analytics-products', () => api.get('/api/admin/analytics/products').then(r => r.data));

  const byRole = userAnalytics?.data?.byRole || [];
  const byCountry = userAnalytics?.data?.byCountry?.filter(c => c._id) || [];
  const byCategory = productAnalytics?.data?.byCategory || [];
  const topSellers = productAnalytics?.data?.topSellers || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Users by Role</h3>
          {byRole.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byRole} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={({ _id, count }) => `${_id}: ${count}`}>
                  {byRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>}
        </div>

        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Products by Category</h3>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCategory} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>}
        </div>

        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Users by Region</h3>
          {byCountry.length > 0 ? (
            <div className="space-y-2">
              {byCountry.slice(0, 8).map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-28 truncate">{r._id || 'Unknown'}</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (r.count / byCountry[0].count) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-8">No region data</p>}
        </div>

        <div className="bg-white border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Top Sellers by Listings</h3>
          {topSellers.length > 0 ? (
            <div className="space-y-3">
              {topSellers.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.seller?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{s.seller?.email}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{s.count} listings</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-8">No seller data</p>}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────
function SettingsTab() {
  const { data } = useQuery('admin-settings', () => api.get('/api/admin/settings').then(r => r.data));
  const s = data?.data;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings size={16} /> Platform Configuration</h3>
        <div className="space-y-4">
          {[
            ['Platform Name', s?.platformName],
            ['Version', s?.version],
            ['Support Email', s?.supportEmail],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{val || '—'}</span>
            </div>
          ))}
          {[
            ['Maintenance Mode', s?.maintenanceMode],
            ['Registration Open', s?.registrationOpen],
            ['Premium Enabled', s?.premiumEnabled],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{val ? 'Yes' : 'No'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">To change these values, update your environment variables and redeploy.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-5">
        <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle size={15} /> Danger Zone</h3>
        <p className="text-xs text-amber-700 mb-3">These actions are irreversible. Use with extreme caution.</p>
        <div className="space-y-2">
          <button className="w-full border border-red-300 text-red-700 text-sm font-semibold py-2 hover:bg-red-50 transition-colors" disabled>
            Clear All Expired Products (Coming Soon)
          </button>
          <button className="w-full border border-red-300 text-red-700 text-sm font-semibold py-2 hover:bg-red-50 transition-colors" disabled>
            Export All User Data (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Shield size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-4">You need admin privileges to view this page.</p>
        <Link to="/dashboard" className="text-emerald-700 font-semibold hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const { data: stats, isLoading: statsLoading } = useQuery('admin-stats', () => api.get('/api/admin/stats').then(r => r.data), { retry: 1 });
  const { data: growth } = useQuery('admin-growth', () => api.get('/api/admin/stats/growth').then(r => r.data), { retry: 1 });
  const { data: activity } = useQuery('admin-activity', () => api.get('/api/admin/activity').then(r => r.data), { retry: 1 });

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: ShoppingBag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin header */}
      <div className="bg-slate-950 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-emerald-400" />
          <span className="font-black text-lg tracking-tight">MkulimaLink <span className="text-emerald-400">Admin</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Logged in as <span className="text-white font-semibold">{user.name}</span></span>
          <Link to="/dashboard" className="text-xs bg-slate-800 px-3 py-1.5 hover:bg-slate-700 transition-colors">← Back to App</Link>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-slate-200 px-6">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {statsLoading && activeTab === 'overview' ? <Spinner /> : null}
        {activeTab === 'overview' && !statsLoading && <OverviewTab stats={stats} growth={growth} activity={activity} />}
        {activeTab === 'users' && <UsersTab qc={qc} />}
        {activeTab === 'products' && <ProductsTab qc={qc} />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
