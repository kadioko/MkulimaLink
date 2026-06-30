import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  User, MapPin, Phone, Mail, Shield, Crown, Star, Bell,
  Building2, Tractor, Calendar, CheckCircle, AlertTriangle, Save,
  CreditCard, Lock, Settings, BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const roleStyle = {
  farmer: 'bg-emerald-100 text-emerald-700',
  buyer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-500 rounded-sm flex-shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-words">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, title, value, tone }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div className={`border p-4 ${tones[tone] || tones.blue}`}>
      <Icon size={18} className="mb-2" />
      <p className="text-xs font-semibold uppercase opacity-70">{title}</p>
      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}

function Profile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery(
    'profile',
    async () => {
      const response = await api.get('/api/users/profile');
      return response.data;
    },
    {
      initialData: user,
      onSuccess: (data) => updateUser(data),
    }
  );

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      location: { region: '', district: '', ward: '' },
      farmDetails: { farmSize: '', farmingMethod: '', crops: '' },
      businessDetails: { businessName: '', businessType: '', tinNumber: '' },
      notificationPreferences: { sms: true, email: true, push: true },
    }
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name || '',
      phone: profile.phone || '',
      location: {
        region: profile.location?.region || '',
        district: profile.location?.district || '',
        ward: profile.location?.ward || '',
      },
      farmDetails: {
        farmSize: profile.farmDetails?.farmSize || '',
        farmingMethod: profile.farmDetails?.farmingMethod || '',
        crops: Array.isArray(profile.farmDetails?.crops) ? profile.farmDetails.crops.join(', ') : '',
      },
      businessDetails: {
        businessName: profile.businessDetails?.businessName || '',
        businessType: profile.businessDetails?.businessType || '',
        tinNumber: profile.businessDetails?.tinNumber || '',
      },
      notificationPreferences: {
        sms: profile.notificationPreferences?.sms ?? true,
        email: profile.notificationPreferences?.email ?? true,
        push: profile.notificationPreferences?.push ?? true,
      },
    });
  }, [profile, reset]);

  const updateProfileMutation = useMutation(
    async (data) => {
      const payload = {
        ...data,
        farmDetails: data.farmDetails ? {
          ...data.farmDetails,
          farmSize: data.farmDetails.farmSize ? Number(data.farmDetails.farmSize) : undefined,
          crops: data.farmDetails.crops ? data.farmDetails.crops.split(',').map(c => c.trim()).filter(Boolean) : [],
        } : undefined,
      };
      const response = await api.put('/api/users/profile', payload);
      return response.data;
    },
    {
      onSuccess: (data) => {
        updateUser(data);
        queryClient.setQueryData('profile', data);
        queryClient.invalidateQueries('profile');
        toast.success('Account updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update account');
      }
    }
  );

  if (isLoading && !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayUser = profile || user || {};
  const initials = displayUser.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const joinedDate = displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Unknown';
  const premiumActive = displayUser.isPremium && (!displayUser.premiumExpiresAt || new Date(displayUser.premiumExpiresAt) > new Date());

  return (
    <div className="min-h-screen bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 -my-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-500 text-white flex items-center justify-center text-2xl font-black rounded-sm shadow-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">My Account</h1>
                <p className="text-emerald-100 mt-1">Manage your profile, farm/business details, notifications, and membership.</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${roleStyle[displayUser.role] || 'bg-white/10 text-white'}`}>{displayUser.role || 'user'}</span>
                  {displayUser.verified ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><BadgeCheck size={12} /> Verified</span> : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1"><AlertTriangle size={12} /> Not verified</span>}
                  {premiumActive && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-300 text-amber-950 flex items-center gap-1"><Crown size={12} /> Premium</span>}
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-300 md:text-right">
              <p>Member since</p>
              <p className="text-white font-bold">{joinedDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard icon={Shield} title="Account" value={displayUser.isBanned ? 'Suspended' : 'Active'} tone={displayUser.isBanned ? 'red' : 'green'} />
          <StatusCard icon={Crown} title="Plan" value={premiumActive ? 'Premium' : 'Free'} tone={premiumActive ? 'amber' : 'blue'} />
          <StatusCard icon={Star} title="Rating" value={displayUser.rating ? `${displayUser.rating.toFixed(1)} / 5` : 'No ratings'} tone="purple" />
          <StatusCard icon={Calendar} title="Last Login" value={displayUser.lastLogin ? new Date(displayUser.lastLogin).toLocaleDateString() : 'Not tracked'} tone="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="space-y-6">
            <div className="bg-white border border-slate-200 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><User size={18} /> Account Info</h2>
              <InfoRow icon={Mail} label="Email" value={displayUser.email} />
              <InfoRow icon={Phone} label="Phone" value={displayUser.phone} />
              <InfoRow icon={MapPin} label="Location" value={[displayUser.location?.ward, displayUser.location?.district, displayUser.location?.region].filter(Boolean).join(', ')} />
              <InfoRow icon={Shield} label="Role" value={displayUser.role} />
            </div>

            <div className="bg-white border border-slate-200 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={18} /> Membership</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-bold text-slate-900">{premiumActive ? 'Premium' : 'Free'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Expires</span>
                  <span className="font-bold text-slate-900">{displayUser.premiumExpiresAt ? new Date(displayUser.premiumExpiresAt).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified</span>
                  <span className="font-bold text-slate-900">{displayUser.verified ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-2 bg-white border border-slate-200 p-5 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Settings size={19} /> Edit Account</h2>
                <p className="text-sm text-slate-500 mt-1">Keep your account details accurate for buyers, sellers, and farm tools.</p>
              </div>
              {isDirty && <span className="hidden sm:inline-flex text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">Unsaved changes</span>}
            </div>

            <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-7">
              <section>
                <h3 className="font-bold text-slate-800 mb-3">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input {...register('name', { required: 'Name is required' })} className="w-full border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" {...register('phone', { required: 'Phone is required' })} className="w-full border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-bold text-slate-800 mb-3">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input placeholder="Region" {...register('location.region')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                  <input placeholder="District" {...register('location.district')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                  <input placeholder="Ward" {...register('location.ward')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                </div>
              </section>

              {displayUser.role === 'farmer' && (
                <section className="border-t border-slate-100 pt-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Tractor size={17} /> Farm Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" step="0.1" placeholder="Farm size" {...register('farmDetails.farmSize')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    <select {...register('farmDetails.farmingMethod')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500">
                      <option value="">Farming method</option>
                      <option value="organic">Organic</option>
                      <option value="conventional">Conventional</option>
                      <option value="mixed">Mixed</option>
                      <option value="regenerative">Regenerative</option>
                    </select>
                    <input placeholder="Crops (comma separated)" {...register('farmDetails.crops')} className="md:col-span-2 border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                  </div>
                </section>
              )}

              {displayUser.role === 'buyer' && (
                <section className="border-t border-slate-100 pt-5">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Building2 size={17} /> Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Business name" {...register('businessDetails.businessName')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                    <select {...register('businessDetails.businessType')} className="border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500">
                      <option value="">Business type</option>
                      <option value="retailer">Retailer</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="processor">Processor</option>
                      <option value="exporter">Exporter</option>
                    </select>
                    <input placeholder="TIN number" {...register('businessDetails.tinNumber')} className="md:col-span-2 border border-slate-200 px-3 py-2 focus:outline-none focus:border-emerald-500" />
                  </div>
                </section>
              )}

              <section className="border-t border-slate-100 pt-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Bell size={17} /> Notification Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[['sms', 'SMS'], ['email', 'Email'], ['push', 'Push']].map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <input type="checkbox" {...register(`notificationPreferences.${key}`)} className="w-4 h-4 accent-emerald-600" />
                    </label>
                  ))}
                </div>
              </section>

              <section className="border-t border-slate-100 pt-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Lock size={17} /> Security</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                  Password change and two-factor authentication are planned security controls. For now, keep your email and phone up to date.
                </div>
              </section>

              <button type="submit" disabled={updateProfileMutation.isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black py-3 flex items-center justify-center gap-2 transition-colors">
                <Save size={17} /> {updateProfileMutation.isLoading ? 'Saving Account...' : 'Save Account Changes'}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Profile;
