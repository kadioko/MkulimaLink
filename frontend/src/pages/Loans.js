import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Loader, FileText, TrendingUp,
  CreditCard, Leaf
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const STATUS_CONFIG = {
  pending:   { label: 'Under Review',  color: 'bg-amber-100 text-amber-800',  icon: Clock },
  approved:  { label: 'Approved',      color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  disbursed: { label: 'Disbursed',     color: 'bg-blue-100 text-blue-800',    icon: CreditCard },
  active:    { label: 'Active',        color: 'bg-blue-100 text-blue-800',    icon: TrendingUp },
  repaying:  { label: 'Repaying',      color: 'bg-violet-100 text-violet-800', icon: TrendingUp },
  completed: { label: 'Completed',     color: 'bg-slate-100 text-slate-700',  icon: CheckCircle },
  rejected:  { label: 'Rejected',      color: 'bg-red-100 text-red-800',      icon: XCircle },
  defaulted: { label: 'Defaulted',     color: 'bg-red-200 text-red-900',      icon: AlertCircle },
};

const PURPOSES = [
  'Seeds & Planting Materials',
  'Fertilizers & Agrochemicals',
  'Farm Equipment & Tools',
  'Irrigation Setup',
  'Livestock Purchase',
  'Post-Harvest Storage',
  'Transport & Marketing',
  'Land Preparation',
  'Other',
];

const fmtTZS = (n) =>
  n != null ? `TZS ${Number(n).toLocaleString()}` : '—';

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function LoanCard({ loan }) {
  const [open, setOpen] = useState(false);
  const pct = loan.progress_percentage ?? 0;

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{fmtTZS(loan.approvedAmount || loan.amount)}</p>
            <p className="text-xs text-slate-500">{loan.purpose}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={loan.status} />
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Monthly Payment</p>
              <p className="font-semibold text-slate-800">{fmtTZS(loan.monthly_payment)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Outstanding</p>
              <p className="font-semibold text-slate-800">{fmtTZS(loan.outstanding_balance)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Interest Rate</p>
              <p className="font-semibold text-slate-800">{loan.interest_rate ? `${loan.interest_rate}%` : '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Next Payment</p>
              <p className="font-semibold text-slate-800">
                {loan.next_payment_date ? new Date(loan.next_payment_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {pct > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Repayment Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {loan.rejected_reason && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{loan.rejected_reason}</span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Applied {new Date(loan.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

function ApplyModal({ onClose, onSuccess }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { amount: '', purpose: '', term_months: 6, description: '', farm_size: '', crop_type: '', farming_experience_years: '' }
  });
  const amount = watch('amount');

  const applyMutation = useMutation(
    (data) => api.post('/api/loans/apply', data),
    {
      onSuccess: () => {
        toast.success('Loan application submitted! We will review it within 2 business days.');
        onSuccess();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Application failed. Please try again.');
      }
    }
  );

  const onSubmit = (data) => {
    applyMutation.mutate({
      ...data,
      amount: Number(data.amount),
      term_months: Number(data.term_months),
      farm_size: data.farm_size ? Number(data.farm_size) : undefined,
      farming_experience_years: data.farming_experience_years ? Number(data.farming_experience_years) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Leaf size={20} className="text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-lg">Apply for Agricultural Loan</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
            Loans from <strong>TZS 50,000</strong> to <strong>TZS 10,000,000</strong> — decision in 2 business days.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Loan Amount (TZS) *</label>
              <input
                type="number"
                {...register('amount', { required: 'Amount is required', min: { value: 50000, message: 'Minimum TZS 50,000' }, max: { value: 10000000, message: 'Maximum TZS 10,000,000' } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 500000"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose *</label>
              <select
                {...register('purpose', { required: 'Purpose is required' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select purpose…</option>
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Repayment Period *</label>
              <select
                {...register('term_months', { required: true })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[3, 6, 9, 12, 18, 24, 36].map(m => (
                  <option key={m} value={m}>{m} months</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Farm Size (acres)</label>
              <input
                type="number"
                {...register('farm_size', { min: 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Main Crop</label>
              <input
                type="text"
                {...register('crop_type')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Maize"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Farming Experience (years)</label>
              <input
                type="number"
                {...register('farming_experience_years', { min: 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 5"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Details</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Describe how you will use and repay the loan…"
              />
            </div>
          </div>

          {amount >= 50000 && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              Estimated monthly payment: ~<strong>{fmtTZS(Math.round((Number(amount) * 1.15) / Number(watch('term_months') || 6)))}</strong>
              <span className="text-slate-400"> (at ~15% annual rate)</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isLoading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {applyMutation.isLoading ? <><Loader size={14} className="animate-spin" /> Submitting…</> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Loans() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError } = useQuery(
    'my-loans',
    () => api.get('/api/loans/my-loans').then(r => r.data),
    { enabled: !!user }
  );

  const loans = data?.loans || [];
  const stats = data?.stats || {};

  const isFarmer = user?.role === 'farmer';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agricultural Loans</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fast credit for farmers — apply in minutes</p>
        </div>
        {isFarmer && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
          >
            <FileText size={16} /> Apply for Loan
          </button>
        )}
      </div>

      {/* Stats bar */}
      {user && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Loans', value: stats.totalLoans ?? 0 },
            { label: 'Active', value: stats.activeLoans ?? 0 },
            { label: 'Total Borrowed', value: fmtTZS(stats.totalBorrowed) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-slateald-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info cards for guests */}
      {!user && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: DollarSign, title: 'Up to TZS 10M', desc: 'Flexible credit for your farming needs' },
            { icon: Clock, title: '2-Day Decision', desc: 'Fast assessment using farm data' },
            { icon: CheckCircle, title: 'Low Rates', desc: 'As low as 12% annual interest' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-emerald-700" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loans list */}
      {!user ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Leaf size={40} className="text-emerald-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Login to view & apply for loans</p>
          <a href="/login" className="inline-block mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
            Login
          </a>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500">Failed to load loans. Please try again.</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <FileText size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No loan applications yet</p>
          {isFarmer && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              Apply for your first loan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => <LoanCard key={loan.id || loan._id} loan={loan} />)}
        </div>
      )}

      {showModal && (
        <ApplyModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries('my-loans')}
        />
      )}
    </div>
  );
}
