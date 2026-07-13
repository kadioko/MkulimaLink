import React, { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, ShieldCheck, Phone, Package,
  Filter, Loader, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api/axios';

const SUPPLIER_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'seeds', label: '🌱 Seeds & Seedlings' },
  { id: 'fertilizer', label: '🧪 Fertilizers' },
  { id: 'pesticides', label: '🔬 Pesticides' },
  { id: 'equipment', label: '🚜 Equipment' },
  { id: 'livestock', label: '🐄 Livestock & Feed' },
  { id: 'packaging', label: '📦 Packaging' },
  { id: 'transport', label: '🚛 Transport' },
];

const REGIONS = [
  '', 'Dar es Salaam', 'Arusha', 'Moshi', 'Morogoro', 'Dodoma',
  'Mwanza', 'Mbeya', 'Iringa', 'Kilimanjaro', 'Tanga',
];

function StarRating({ value = 0, count = 0 }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <Star size={12} className={value >= 1 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
      <span className="font-medium text-slate-700">{value.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}

function SupplierCard({ supplier }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const name = supplier.businessName || supplier.name || 'Supplier';
  const rating = supplier.ratings?.average || 0;
  const reviewCount = supplier.ratings?.count || 0;
  const region = supplier.location?.region || '—';
  const district = supplier.location?.district;
  const phone = supplier.contactInfo?.phone || supplier.user?.phone;
  const products = supplier.products || [];
  const isVerified = supplier.isVerified;
  const isFeatured = supplier.isFeatured;

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${isFeatured ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
      {isFeatured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1 text-xs font-semibold text-amber-700">
          ⭐ Featured Supplier
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-lg font-bold text-emerald-700">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{name}</h3>
                {isVerified && (
                  <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" title="Verified Supplier" />
                )}
              </div>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{supplier.type || 'General Supplier'}</p>
            </div>
          </div>
          <StarRating value={rating} count={reviewCount} />
        </div>

        {supplier.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{supplier.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {district ? `${district}, ` : ''}{region}
          </span>
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 text-emerald-700 hover:underline">
              <Phone size={11} /> {phone}
            </a>
          )}
        </div>

        {/* Product tags preview */}
        {products.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {products.slice(0, 3).map((p, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {p.name}
              </span>
            ))}
            {products.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                +{products.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-lg text-center transition-colors"
            >
              Call Supplier
            </a>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-3">
          {supplier.contactInfo?.email && (
            <p className="text-sm text-slate-600">
              📧 <a href={`mailto:${supplier.contactInfo.email}`} className="text-emerald-700 hover:underline">{supplier.contactInfo.email}</a>
            </p>
          )}
          {supplier.contactInfo?.website && (
            <p className="text-sm text-slate-600">
              🌐 <a href={supplier.contactInfo.website} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">{supplier.contactInfo.website}</a>
            </p>
          )}
          {products.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Products Offered</p>
              <div className="flex flex-wrap gap-1">
                {products.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                    <Package size={10} /> {p.name}
                    {p.price && <span className="text-slate-400 ml-1">TZS {p.price?.toLocaleString()}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {supplier.operatingHours && (
            <p className="text-xs text-slate-500">🕐 {supplier.operatingHours}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (search)       params.set('search', search);
  if (type)         params.set('type', type);
  if (region)       params.set('region', region);
  if (verifiedOnly) params.set('verified', 'true');
  params.set('page', page);
  params.set('limit', '12');

  const { data, isLoading, isError } = useQuery(
    ['suppliers', search, type, region, verifiedOnly, page],
    () => api.get(`/api/suppliers?${params.toString()}`).then(r => r.data),
    { keepPreviousData: true }
  );

  const suppliers = data?.suppliers || (Array.isArray(data) ? data : []);
  const total = data?.total || suppliers.length;
  const totalPages = data?.totalPages || 1;

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Verified Suppliers</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Find trusted agri-input suppliers — seeds, fertilizers, equipment & more
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search suppliers by name or product…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={12} />
          </div>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {SUPPLIER_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Regions</option>
            {REGIONS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
              className="accent-emerald-600"
            />
            <ShieldCheck size={13} className="text-emerald-600" />
            Verified only
          </label>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center gap-2 py-12 text-red-500">
          <AlertCircle size={18} /> Failed to load suppliers. Please try again.
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No suppliers found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{total} supplier{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suppliers.map(s => <SupplierCard key={s._id} supplier={s} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
