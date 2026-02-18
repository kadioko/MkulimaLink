import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useCountryStore, COUNTRIES } from '../store/countryStore';

function AddProduct() {
  const navigate = useNavigate();
  const { country, getCurrency } = useCountryStore();
  const currency = getCurrency();
  const currentCountry = COUNTRIES[country];
  const regions = currentCountry.regions;
  const [images, setImages] = useState([]);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createProductMutation = useMutation(
    async (formData) => {
      const response = await api.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Product listed successfully!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create product');
      }
    }
  );

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'location') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    images.forEach(image => {
      formData.append('images', image);
    });

    createProductMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">List a New Product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className="input-field"
                placeholder="e.g., Fresh Tomatoes"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region ({currentCountry.name})</label>
                <select {...register('location.region', { required: 'Region is required' })} className="input-field">
                  <option value="">Select region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                {errors.location && errors.location.region && <p className="text-red-500 text-sm mt-1">{errors.location.region.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select {...register('category', { required: 'Category is required' })} className="input-field">
                  <option value="">Select category</option>
                  <option value="grains">Grains</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="livestock">Livestock</option>
                  <option value="dairy">Dairy</option>
                  <option value="poultry">Poultry</option>
                  <option value="seeds">Seeds</option>
                  <option value="fertilizers">Fertilizers</option>
                  <option value="inputs">Inputs</option>
                  {country === 'KE' && <option value="cash_crops">Cash Crops</option>}
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className="input-field"
                rows="4"
                placeholder="Describe your product..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currency}) *</label>
                <input
                  type="number"
                  {...register('price', { required: 'Price is required', min: 0 })}
                  className="input-field"
                  placeholder="1000"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  {...register('quantity', { required: 'Quantity is required', min: 1 })}
                  className="input-field"
                  placeholder="100"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <select {...register('unit', { required: 'Unit is required' })} className="input-field">
                  <option value="">Select unit</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="ton">Ton</option>
                  <option value="bag">Bag</option>
                  <option value="piece">Piece</option>
                  <option value="liter">Liter</option>
                  <option value="dozen">Dozen</option>
                  <option value="bundle">Bundle</option>
                </select>
                {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
                <input
                  type="date"
                  {...register('harvestDate')}
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('organic')} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Organic Product</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
          <p className="text-sm text-gray-600 mb-4">Upload up to 5 images. AI will analyze for pest detection.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="text-gray-400 mb-2" size={24} />
                <span className="text-sm text-gray-600">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProductMutation.isLoading}
            className="btn-primary flex-1"
          >
            {createProductMutation.isLoading ? 'Creating...' : 'List Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
