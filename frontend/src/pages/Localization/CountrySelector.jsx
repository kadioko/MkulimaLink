import React, { useState, useEffect } from 'react';
import { Globe, Check, MapPin, DollarSign, CreditCard } from 'lucide-react';
import api from '../../api/axios';

const CountrySelector = ({ onCountrySelect }) => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await api.get('/api/localization/countries');
      setCountries(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setLoading(false);
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    onCountrySelect(country);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading countries...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Globe className="w-12 h-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Select Your Country</h1>
          </div>
          <p className="text-gray-600 text-lg">Choose your location to access localized features and payment methods</p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {countries.map((country) => (
            <div
              key={country.code}
              onClick={() => handleSelectCountry(country)}
              className={`rounded-lg shadow-lg p-6 cursor-pointer transition transform hover:scale-105 ${
                selectedCountry?.code === country.code
                  ? 'bg-green-500 text-white ring-4 ring-green-300'
                  : 'bg-white hover:shadow-xl'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-2xl font-bold mb-1 ${selectedCountry?.code === country.code ? 'text-white' : 'text-gray-900'}`}>
                    {country.name}
                  </h3>
                  <p className={`text-sm ${selectedCountry?.code === country.code ? 'text-green-100' : 'text-gray-600'}`}>
                    {country.code}
                  </p>
                </div>
                {selectedCountry?.code === country.code && (
                  <Check className="w-6 h-6 text-white" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <DollarSign className={`w-4 h-4 mr-2 ${selectedCountry?.code === country.code ? 'text-white' : 'text-green-600'}`} />
                  <span className={`text-sm ${selectedCountry?.code === country.code ? 'text-green-100' : 'text-gray-700'}`}>
                    {country.currency}
                  </span>
                </div>

                <div className="flex items-start">
                  <CreditCard className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${selectedCountry?.code === country.code ? 'text-white' : 'text-green-600'}`} />
                  <div className={`text-sm ${selectedCountry?.code === country.code ? 'text-green-100' : 'text-gray-700'}`}>
                    <p className="font-medium mb-1">Payment Methods:</p>
                    <div className="flex flex-wrap gap-1">
                      {country.payment_methods.map((method) => (
                        <span
                          key={method}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedCountry?.code === country.code
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {method.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Globe className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${selectedCountry?.code === country.code ? 'text-white' : 'text-green-600'}`} />
                  <div className={`text-sm ${selectedCountry?.code === country.code ? 'text-green-100' : 'text-gray-700'}`}>
                    <p className="font-medium mb-1">Languages:</p>
                    <p>{country.languages.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Country Details */}
        {selectedCountry && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedCountry.name} - Regional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency & Payment</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="text-lg font-bold text-gray-900">{selectedCountry.currency}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Accepted Payment Methods</p>
                    <ul className="space-y-1">
                      {selectedCountry.payment_methods.map((method) => (
                        <li key={method} className="text-sm text-gray-700 flex items-center">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          {method.replace('_', ' ').toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Support</h3>
                <div className="space-y-3">
                  {selectedCountry.languages.map((lang) => (
                    <div key={lang} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">{lang.toUpperCase()}</span>
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                // Proceed with selected country
                window.location.href = `/setup/${selectedCountry.code}`;
              }}
              className="w-full mt-8 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Continue with {selectedCountry.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountrySelector;
