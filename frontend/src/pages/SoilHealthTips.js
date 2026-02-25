import React from 'react';
import { Leaf, Droplets, ThermometerSun, Sprout, Wind, ArrowRight } from 'lucide-react';

function SoilHealthTips() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Leaf size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Soil Health & Conservation</h1>
        <p className="text-gray-600">Practical guides to maintaining fertile, productive, and resilient farmland.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic 1 */}
        <div className="card hover:shadow-md transition-shadow border-t-4 border-t-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Sprout size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Composting Basics</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Transform farm waste into "black gold." Compost improves soil structure, retains moisture, and provides slow-release nutrients.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li className="flex gap-2"><ArrowRight size={16} className="text-amber-500 flex-shrink-0" /> Mix 3 parts "Browns" (dry leaves, stalks) with 1 part "Greens" (manure, vegetable scraps).</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-amber-500 flex-shrink-0" /> Keep it moist like a wrung-out sponge.</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-amber-500 flex-shrink-0" /> Turn the pile every 1-2 weeks to aerate.</li>
          </ul>
        </div>

        {/* Topic 2 */}
        <div className="card hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Droplets size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Moisture Retention</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Protect your soil from drying out during harsh dry seasons and prevent valuable topsoil from washing away.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li className="flex gap-2"><ArrowRight size={16} className="text-blue-500 flex-shrink-0" /> <strong>Mulching:</strong> Cover soil with 2-3 inches of dry grass or crop residue.</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-blue-500 flex-shrink-0" /> <strong>Terracing:</strong> On sloped land, build ridges to slow water runoff.</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-blue-500 flex-shrink-0" /> <strong>Cover Crops:</strong> Plant low-growing crops like pumpkin or sweet potato to shield the soil.</li>
          </ul>
        </div>

        {/* Topic 3 */}
        <div className="card hover:shadow-md transition-shadow border-t-4 border-t-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Wind size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Crop Rotation</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Never plant the same crop family in the same spot year after year. Rotation breaks pest cycles and balances nutrients.
          </p>
          <div className="bg-green-50 p-3 rounded-lg text-sm text-green-900 mb-4 border border-green-100">
            <p className="font-semibold mb-2">Example 3-Season Rotation:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li><strong>Legumes</strong> (Beans/Peas) - Fixes nitrogen in soil.</li>
              <li><strong>Leafy/Fruiting</strong> (Cabbage/Tomatoes) - Uses the nitrogen.</li>
              <li><strong>Root Crops</strong> (Potatoes/Carrots) - Breaks up deep soil.</li>
            </ol>
          </div>
        </div>

        {/* Topic 4 */}
        <div className="card hover:shadow-md transition-shadow border-t-4 border-t-red-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ThermometerSun size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Soil Testing Basics</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Knowing your soil's pH and nutrient levels prevents wasting money on the wrong fertilizers.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li className="flex gap-2"><ArrowRight size={16} className="text-red-500 flex-shrink-0" /> <strong>Visual Check:</strong> Dark, crumbly soil full of earthworms is healthy.</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-red-500 flex-shrink-0" /> <strong>pH Testing:</strong> Most crops prefer slightly acidic soil (pH 6.0-7.0). Use cheap test strips from an agro-vet.</li>
            <li className="flex gap-2"><ArrowRight size={16} className="text-red-500 flex-shrink-0" /> <strong>Action:</strong> If soil is too acidic (common in high rainfall areas), apply agricultural lime.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SoilHealthTips;
