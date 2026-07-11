import React, { useState, useEffect } from 'react';
import { Settings, Globe, Clock, Ruler, Thermometer, Save } from 'lucide-react';
import api from '../../api/axios';

const LocalizationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prefsRes, countriesRes, langsRes] = await Promise.all([
        api.get('/api/localization/preferences'),
        api.get('/api/localization/countries'),
        api.get('/api/localization/languages')
      ]);

      setPreferences(prefsRes.data);
      setCountries(countriesRes.data);
      setLanguages(langsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPreferences({
      ...preferences,
      [field]: value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/api/localization/preferences', preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="flex items-center justify-center h-screen">No preferences found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Settings className="w-8 h-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Localization Preferences</h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Country & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Country
              </label>
              <select
                value={preferences.country_code || ''}
                onChange={(e) => handleChange('country_code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Language
              </label>
              <select
                value={preferences.language || 'en'}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={preferences.currency || ''}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="e.g., TZS, KES, USD"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Timezone
              </label>
              <select
                value={preferences.timezone || ''}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Timezone</option>
                <option value="Africa/Nairobi">Africa/Nairobi (East Africa)</option>
                <option value="Africa/Kampala">Africa/Kampala (Uganda)</option>
                <option value="Africa/Kigali">Africa/Kigali (Rwanda)</option>
                <option value="Africa/Lusaka">Africa/Lusaka (Zambia)</option>
                <option value="Africa/Blantyre">Africa/Blantyre (Malawi)</option>
              </select>
            </div>
          </div>

          {/* Date & Number Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={preferences.date_format || 'DD/MM/YYYY'}
                onChange={(e) => handleChange('date_format', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number Format
              </label>
              <select
                value={preferences.number_format || 'comma_decimal'}
                onChange={(e) => handleChange('number_format', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="comma_decimal">1,234.56 (Comma decimal)</option>
                <option value="period_comma">1.234,56 (Period comma)</option>
              </select>
            </div>
          </div>

          {/* Measurement Units */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ruler className="w-4 h-4 inline mr-2" />
                Measurement Unit
              </label>
              <select
                value={preferences.measurement_unit || 'metric'}
                onChange={(e) => handleChange('measurement_unit', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="metric">Metric (kg, m, km)</option>
                <option value="imperial">Imperial (lbs, ft, mi)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Thermometer className="w-4 h-4 inline mr-2" />
                Temperature Unit
              </label>
              <select
                value={preferences.temperature_unit || 'celsius'}
                onChange={(e) => handleChange('temperature_unit', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>
          </div>

          {/* Notification Languages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notifications Language
              </label>
              <select
                value={preferences.notifications_language || preferences.language}
                onChange={(e) => handleChange('notifications_language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Language
              </label>
              <select
                value={preferences.sms_language || preferences.language}
                onChange={(e) => handleChange('sms_language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Language
              </label>
              <select
                value={preferences.email_language || preferences.language}
                onChange={(e) => handleChange('email_language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Preview */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Date Format Example</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Number Format Example</p>
              <p className="text-lg font-semibold text-gray-900">
                {(1234.56).toLocaleString('en-US')}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Temperature Example</p>
              <p className="text-lg font-semibold text-gray-900">
                25°{preferences.temperature_unit === 'celsius' ? 'C' : 'F'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Distance Example</p>
              <p className="text-lg font-semibold text-gray-900">
                100 {preferences.measurement_unit === 'metric' ? 'km' : 'mi'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizationPreferences;
