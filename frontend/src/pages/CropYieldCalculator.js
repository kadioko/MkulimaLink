import React, { useState } from 'react';
import { Calculator, Wheat, Map, Droplets, Info } from 'lucide-react';

const CROP_YIELD_DATA = {
  maize: { name: 'Maize', yieldPerAcre: 1800, unit: 'kg', waterNeed: 'Medium' },
  beans: { name: 'Beans', yieldPerAcre: 800, unit: 'kg', waterNeed: 'Low' },
  rice: { name: 'Rice', yieldPerAcre: 2200, unit: 'kg', waterNeed: 'High' },
  wheat: { name: 'Wheat', yieldPerAcre: 1500, unit: 'kg', waterNeed: 'Medium' },
  tomatoes: { name: 'Tomatoes', yieldPerAcre: 12000, unit: 'kg', waterNeed: 'High' },
  onions: { name: 'Onions', yieldPerAcre: 8000, unit: 'kg', waterNeed: 'Medium' },
  cabbage: { name: 'Cabbage', yieldPerAcre: 15000, unit: 'kg', waterNeed: 'High' },
  potatoes: { name: 'Potatoes', yieldPerAcre: 10000, unit: 'kg', waterNeed: 'Medium' },
};

function CropYieldCalculator() {
  const [crop, setCrop] = useState('maize');
  const [landSize, setLandSize] = useState('');
  const [landUnit, setLandUnit] = useState('acre');
  const [farmingMethod, setFarmingMethod] = useState('traditional');
  const [result, setResult] = useState(null);

  const calculateYield = (e) => {
    e.preventDefault();
    if (!landSize || isNaN(landSize)) return;

    let sizeInAcres = parseFloat(landSize);
    if (landUnit === 'hectare') sizeInAcres *= 2.47105;
    if (landUnit === 'sqm') sizeInAcres *= 0.000247105;

    const baseYield = CROP_YIELD_DATA[crop].yieldPerAcre * sizeInAcres;
    
    // Apply multiplier based on farming method
    let multiplier = 1;
    if (farmingMethod === 'modern') multiplier = 1.3;
    if (farmingMethod === 'greenhouse') multiplier = 2.5;

    const estimatedYield = baseYield * multiplier;

    setResult({
      estimatedYield: Math.round(estimatedYield),
      unit: CROP_YIELD_DATA[crop].unit,
      cropName: CROP_YIELD_DATA[crop].name,
      waterNeed: CROP_YIELD_DATA[crop].waterNeed,
      acres: sizeInAcres.toFixed(2)
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Crop Yield Calculator</h1>
        <p className="text-gray-600">Estimate your potential harvest based on land size and farming practices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <form onSubmit={calculateYield} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Wheat size={16} className="text-gray-400" /> Select Crop
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="input-field"
                required
              >
                {Object.entries(CROP_YIELD_DATA).map(([key, data]) => (
                  <option key={key} value={key}>{data.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Map size={16} className="text-gray-400" /> Land Size
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="input-field flex-1"
                  required
                />
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value)}
                  className="input-field w-32"
                >
                  <option value="acre">Acres</option>
                  <option value="hectare">Hectares</option>
                  <option value="sqm">Sq Meters</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Droplets size={16} className="text-gray-400" /> Farming Method
              </label>
              <select
                value={farmingMethod}
                onChange={(e) => setFarmingMethod(e.target.value)}
                className="input-field"
              >
                <option value="traditional">Traditional (Rain-fed, basic inputs)</option>
                <option value="modern">Modern (Irrigation, quality fertilizer)</option>
                <option value="greenhouse">Controlled/Greenhouse</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-lg mt-4">
              Calculate Estimated Yield
            </button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 h-full flex flex-col justify-center text-center p-8">
              <h3 className="text-xl font-semibold text-green-900 mb-2">Estimated Harvest</h3>
              <p className="text-6xl font-bold text-green-600 mb-4">
                {result.estimatedYield.toLocaleString()} <span className="text-2xl text-green-700">{result.unit}</span>
              </p>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mt-4 text-left">
                <p className="text-sm text-gray-700 mb-2 font-medium border-b border-green-100 pb-2">Projection Details:</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between"><span>Crop:</span> <span className="font-semibold text-gray-900">{result.cropName}</span></li>
                  <li className="flex justify-between"><span>Total Area:</span> <span className="font-semibold text-gray-900">{result.acres} Acres</span></li>
                  <li className="flex justify-between"><span>Water Need:</span> <span className="font-semibold text-gray-900">{result.waterNeed}</span></li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="card bg-gray-50 border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Calculator size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Enter your farm details</p>
              <p className="text-sm">Click calculate to see your estimated harvest yield.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 card bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-800">
            <strong>Disclaimer:</strong> This calculator provides general estimates based on standard East African agricultural data. Actual yields may vary significantly due to exact soil conditions, extreme weather events, seed quality, pest incidence, and exact farm management practices.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CropYieldCalculator;
