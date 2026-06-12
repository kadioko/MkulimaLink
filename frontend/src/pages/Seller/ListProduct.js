import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, Loader, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/env';
import axios from 'axios';
import './ProductManagement.css';

export default function ListProduct() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables',
    description: '',
    price: '',
    unit: 'kg',
    quantity: '',
    quality: 'standard',
    organic: false,
    harvestDate: '',
    location: {
      region: user?.location?.region || '',
      district: user?.location?.district || ''
    }
  });

  const categories = [
    'vegetables', 'grains', 'fruits', 'livestock', 'dairy',
    'poultry', 'seeds', 'fertilizers', 'equipment', 'other'
  ];

  const units = ['kg', 'ton', 'bag', 'piece', 'liter', 'dozen', 'bundle'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    setError('');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.description || !formData.price || !formData.quantity) {
      setError('Please fill in all required fields');
      return false;
    }
    if (Number(formData.price) <= 0 || Number(formData.quantity) <= 0) {
      setError('Price and quantity must be greater than 0');
      return false;
    }
    if (!formData.location.region) {
      setError('Please select a region');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('quality', formData.quality);
      formDataToSend.append('organic', formData.organic);
      formDataToSend.append('harvestDate', formData.harvestDate);
      formDataToSend.append('location', JSON.stringify(formData.location));

      images.forEach(img => {
        formDataToSend.append('images', img.file);
      });

      const response = await axios.post(
        `${API_URL}/api/products`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      navigate(`/product/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-management-container">
      <div className="product-form-card">
        <div className="form-header">
          <h1>List Your Product</h1>
          <p>Share your agricultural products with buyers</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Organic Tomatoes"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quality">Quality</label>
                <select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product in detail..."
                rows="4"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span>This is an organic product</span>
              </label>
            </div>
          </div>

          {/* Pricing & Quantity */}
          <div className="form-section">
            <h2>Pricing & Quantity</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (TZS) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="100"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Location & Harvest */}
          <div className="form-section">
            <h2>Location & Harvest</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="region">Region *</label>
                <select
                  id="region"
                  name="location.region"
                  value={formData.location.region}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Region</option>
                  <option value="Dar es Salaam">Dar es Salaam</option>
                  <option value="Morogoro">Morogoro</option>
                  <option value="Arusha">Arusha</option>
                  <option value="Iringa">Iringa</option>
                  <option value="Mbeya">Mbeya</option>
                  <option value="Mwanza">Mwanza</option>
                  <option value="Dodoma">Dodoma</option>
                  <option value="Kilimanjaro">Kilimanjaro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="harvestDate">Harvest Date</label>
                <input
                  type="date"
                  id="harvestDate"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Product Images</h2>
            <p className="section-hint">Upload up to 5 images (max 5MB each)</p>

            <div className="image-upload-area">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading || images.length >= 5}
                style={{ display: 'none' }}
              />
              <label htmlFor="images" className="upload-label">
                <Upload size={32} />
                <span>Click to upload or drag and drop</span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img src={img.preview} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="remove-image-btn"
                      disabled={loading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <Loader size={20} className="spinner" />
                Listing Product...
              </>
            ) : (
              <>
                <Plus size={20} />
                List Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
