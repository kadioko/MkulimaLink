import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Shield, ShieldCheck, Leaf, Cloud, Tractor, Package,
  CheckCircle, Clock, AlertCircle, XCircle, Loader,
  ChevronDown, ChevronUp, FileText, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const TYPE_ICONS = {
  crop: Leaf,
  livestock: Shield,
  weather: Cloud,
  equipment: Tractor,
  transit: Package,
};

const POLICY_STATUS = {
  active:   { label: 'Active',   color: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck },
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-800',     icon: Clock },
  expired:  { label: 'Expired',  color: 'bg-slate-100 text-slate-600',     icon: XCircle },
  claimed:  { label: 'Claimed',  color: 'bg-blue-100 text-blue-800',       icon: CheckCircle },
  cancelled:{ label: 'Cancelled',color: 'bg-red-100 text-red-800',         icon: XCircle },
};

const fmtTZS = (n) => n != null ? `TZS ${Number(n).toLocaleString()}` : '—';

function PlanCard({ plan, onGetQuote }) {
  const Icon = TYPE_ICONS[plan.type] || Shield;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{plan.name}</h3>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{plan.type} insurance</p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{plan.premium_rate}</span>
        </div>

        <p className="text-sm text-slate-600 mb-3">{plan.description}</p>

        <div className="space-y-1.5 mb-3">
          <p className="text-xs font-semibold text-slate-700">Covered Risks</p>
          <div className="flex flex-wrap gap-1">
            {(plan.covered_risks || []).map(r => (
              <span key={r} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full capitalize">{r}</span>
            ))}
          </div>
        </div>

        {plan.features && (
          <ul className="space-y-1 mb-3">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Star size={10} className="text-amber-400 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        )}

        <div className="text-xs text-slate-500">
          Max coverage: <span className="font-semibold text-slate-700">{fmtTZS(plan.max_coverage)}</span>
          {plan.waiting_period && <span className="ml-3">Waiting: {plan.waiting_period} days</span>}
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={() => onGetQuote(plan)}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Get Quote & Enroll
        </button>
      </div>
    </div>
  );
}

function PolicyCard({ policy }) {
  const [open, setOpen] = useState(false);
  const cfg = POLICY_STATUS[policy.status] || POLICY_STATUS.pending;
  const Icon = TYPE_ICONS[policy.type || policy.policy_type] || Shield;
  const StatusIcon = cfg.icon;

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{policy.policy_name || policy.type}</p>
            <p className="text-xs text-slate-500">{fmtTZS(policy.coverage_amount || policy.coverage?.coverageAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
            <StatusIcon size={10} /> {cfg.label}
          </span>
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-2 bg-slate-50 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-400">Premium</p>
              <p className="font-medium">{fmtTZS(policy.premium_amount || policy.premium?.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Ends</p>
              <p className="font-medium">
                {policy.end_date || policy.period?.endDate
                  ? new Date(policy.end_date || policy.period.endDate).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Policy ID: {policy.policy_id || policy._id}</p>
        </div>
      )}
    </div>
  );
}

function QuoteModal({ plan, onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { coverageAmount: plan.coverage_options?.[1] || 500000, farmSize: '', region: user?.location?.region || '' }
  });
  const coverage = watch('coverageAmount');

  const [quote, setQuote] = useState(null);

  const quoteMutation = useMutation(
    (data) => api.post('/api/insurance/quote', {
      type: plan.type,
      coverageAmount: Number(data.coverageAmount),
      region: data.region,
      farmSize: data.farmSize ? Number(data.farmSize) : undefined,
      product_id: plan.id,
    }),
    {
      onSuccess: (res) => setQuote(res.data),
      onError: () => toast.error('Could not calculate quote. Please try again.'),
    }
  );

  const purchaseMutation = useMutation(
    () => api.post('/api/insurance/purchase', {
      type: plan.type,
      coverageAmount: Number(coverage),
      product_id: plan.id,
      farm_details: { farm_size: watch('farmSize') ? Number(watch('farmSize')) : 1, farming_practices: 'conventional' },
    }),
    {
      onSuccess: () => {
        toast.success('Insurance policy activated successfully!');
        queryClient.invalidateQueries('my-policies');
        onClose();
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Purchase failed.'),
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-slate-800">Get Quote — {plan.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate600 text-xl font-bold">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Amount (TZS) *</label>
            <select
              {...register('coverageAmount', { required: true })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {(plan.coverage_options || []).map(v => (
                <option key={v} value={v}>{fmtTZS(v)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <input
                {...register('region')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Arusha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Farm Size (acres)</label>
              <input
                type="number"
                {...register('farmSize', { min: 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit((d) => quoteMutation.mutate(d))}
            disabled={quoteMutation.isLoading}
            className="w-full py-2.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            {quoteMutation.isLoading ? <><Loader size={14} className="animate-spin" /> Calculating…</> : 'Calculate Premium'}
          </button>

          {quote && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-bold text-emerald-800 text-base">Your Quote</p>
              {[
                ['Annual Premium', fmtTZS(quote.annualPremium || quote.seasonalPremium)],
                ['Monthly Payment', fmtTZS(quote.monthlyPremium)],
                ['Coverage', fmtTZS(quote.coverageAmount || coverage)],
                ['Deductible', fmtTZS(quote.deductible)],
              ].map(([k, v]) => v && (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isLoading || !user}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {purchaseMutation.isLoading ? <><Loader size={14} className="animate-spin" /> Processing…</> : 'Enroll Now'}
            </button>
          </div>
          {!user && <p className="text-center text-xs text-slate-400">Login required to enroll</p>}
        </div>
      </div>
    </div>
  );
}

export default function InsurancePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery(
    'insurance-products',
    () => api.get('/api/insurance/products').then(r => Array.isArray(r.data) ? r.data : [])
  );

  const { data: policies = [], isLoading: policiesLoading } = useQuery(
    'my-policies',
    () => api.get('/api/insurance/my-policies').then(r => {
      if (Array.isArray(r.data)) return r.data;
      return r.data?.policies || [];
    }),
    { enabled: !!user }
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Farm Insurance</h1>
        <p className="text-slate-500 text-sm mt-0.5">Protect your crops, livestock and equipment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-7">
        {[
          { id: 'plans',    label: 'Insurance Plans' },
          { id: 'policies', label: 'My Policies' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.id === 'policies' && policies.length > 0 && (
              <span className="ml-1.5 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">{policies.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        plansLoading ? (
          <div className="flex justify-center py-16"><Loader size={28} className="animate-spin text-emerald-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onGetQuote={setSelectedPlan} />
            ))}
          </div>
        )
      )}

      {/* My Policies Tab */}
      {activeTab === 'policies' && (
        !user ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <Shield size={40} className="text-emerald-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Login to view your policies</p>
            <a href="/login" className="inline-block mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Login</a>
          </div>
        ) : policiesLoading ? (
          <div className="flex justify-center py-16"><Loader size={28} className="animate-spin text-emerald-500" /></div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No active policies</p>
            <button onClick={() => setActiveTab('plans')} className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
              Browse Plans
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map(p => <PolicyCard key={p._id || p.policy_id} policy={p} />)}
          </div>
        )
      )}

      {selectedPlan && <QuoteModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </div>
  );
}
