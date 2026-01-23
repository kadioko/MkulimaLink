import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { User, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

function Profile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      'location.region': user?.location?.region || '',
      'location.district': user?.location?.district || '',
      'location.ward': user?.location?.ward || ''
    }
  });

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/users/profile', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        updateUser(data);
        queryClient.invalidateQueries('profile');
        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-primary-600" size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
          <p className="text-gray-600 mb-2">{user?.email}</p>
          <span className={`badge ${
            user?.role === 'farmer' ? 'badge-success' : 'badge-info'
          }`}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>

          {user?.isPremium && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">Premium Member</p>
              <p className="text-xs text-yellow-700 mt-1">
                Expires: {new Date(user.premiumExpiresAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={18} />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={18} />
              <span className="text-sm">{user?.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={18} />
              <span className="text-sm">{user?.location?.region || 'Not set'}</span>
            </div>
          </div>

          {user?.rating > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Rating</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-yellow-500">★ {user.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">({user.totalRatings} ratings)</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="input-field"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                {...register('phone', { required: 'Phone is required' })}
                className="input-field"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select {...register('location.region')} className="input-field">
                  <option value="">Select Region</option>
                  <option value="Dar es Salaam">Dar es Salaam</option>
                  <option value="Arusha">Arusha</option>
                  <option value="Dodoma">Dodoma</option>
                  <option value="Mwanza">Mwanza</option>
                  <option value="Mbeya">Mbeya</option>
                  <option value="Morogoro">Morogoro</option>
                  <option value="Tanga">Tanga</option>
                  <option value="Moshi">Moshi</option>
                  <option value="Iringa">Iringa</option>
                  <option value="Kilimanjaro">Kilimanjaro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  {...register('location.district')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                <input
                  type="text"
                  {...register('location.ward')}
                  className="input-field"
                />
              </div>
            </div>

            {user?.role === 'farmer' && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Farm Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Farm Size (acres)</label>
                    <input
                      type="number"
                      {...register('farmDetails.farmSize')}
                      className="input-field"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Farming Method</label>
                    <select {...register('farmDetails.farmingMethod')} className="input-field">
                      <option value="">Select method</option>
                      <option value="organic">Organic</option>
                      <option value="conventional">Conventional</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'buyer' && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      {...register('businessDetails.businessName')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <select {...register('businessDetails.businessType')} className="input-field">
                      <option value="">Select type</option>
                      <option value="retailer">Retailer</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="processor">Processor</option>
                      <option value="exporter">Exporter</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('notificationPreferences.sms')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">SMS Notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('notificationPreferences.email')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Email Notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('notificationPreferences.push')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Push Notifications</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="btn-primary w-full py-3"
            >
              {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
