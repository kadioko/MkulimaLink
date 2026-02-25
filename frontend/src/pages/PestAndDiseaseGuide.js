import React, { useState } from 'react';
import { Search, Bug, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const PEST_DATA = [
  {
    id: 1,
    name: 'Fall Armyworm',
    crops: ['Maize', 'Sorghum', 'Wheat'],
    symptoms: 'Ragged holes in leaves, sawdust-like droppings in the funnel of the plant.',
    organicTreatment: 'Neem extract spray, intercropping with Desmodium, handpicking in early stages.',
    chemicalTreatment: 'Emamectin benzoate or Spinetoram (consult local agro-vet).',
    severity: 'High'
  },
  {
    id: 2,
    name: 'Tomato Blight (Late/Early)',
    crops: ['Tomatoes', 'Potatoes'],
    symptoms: 'Dark brown spots on leaves with pale green edges. White fuzzy growth on undersides in wet conditions.',
    organicTreatment: 'Copper-based fungicides, removing infected leaves, ensuring good plant spacing for airflow.',
    chemicalTreatment: 'Mancozeb or Chlorothalonil-based fungicides.',
    severity: 'High'
  },
  {
    id: 3,
    name: 'Aphids',
    crops: ['Tomatoes', 'Beans', 'Cabbage', 'Watermelon'],
    symptoms: 'Curled, yellowing leaves. Sticky "honeydew" substance on leaves, often with black sooty mold.',
    organicTreatment: 'Garlic/chili spray, introducing ladybugs, strong water spray to dislodge them.',
    chemicalTreatment: 'Imidacloprid or basic insecticidal soaps.',
    severity: 'Medium'
  },
  {
    id: 4,
    name: 'Fruit Flies',
    crops: ['Mangoes', 'Avocados', 'Oranges'],
    symptoms: 'Small puncture marks on fruit skin. Rotting fruit falling prematurely. Maggots inside fruit.',
    organicTreatment: 'Pheromone traps, orchard sanitation (burying fallen fruits deep), bagging fruits.',
    chemicalTreatment: 'Spinosad baits or Deltamethrin.',
    severity: 'High'
  },
  {
    id: 5,
    name: 'Whiteflies',
    crops: ['Cabbage', 'Tomatoes', 'Beans'],
    symptoms: 'Tiny white flies flying up when plant is disturbed. Yellowing leaves with sticky honeydew.',
    organicTreatment: 'Yellow sticky traps, neem oil, soapy water sprays.',
    chemicalTreatment: 'Acetamiprid (use carefully to protect bees).',
    severity: 'Medium'
  },
  {
    id: 6,
    name: 'Tuta Absoluta (Tomato Leafminer)',
    crops: ['Tomatoes', 'Potatoes'],
    symptoms: 'Blister-like mines on leaves. Black frass (droppings) visible. Damaged fruits.',
    organicTreatment: 'Pheromone traps for mass trapping, releasing Trichogramma wasps.',
    chemicalTreatment: 'Chlorantraniliprole or Indoxacarb.',
    severity: 'High'
  }
];

function PestAndDiseaseGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const allCrops = [...new Set(PEST_DATA.flatMap(p => p.crops))].sort();

  const filteredPests = PEST_DATA.filter(pest => {
    const matchesSearch = pest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pest.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = selectedCrop ? pest.crops.includes(selectedCrop) : true;
    return matchesSearch && matchesCrop;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bug size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pest & Disease Guide</h1>
        <p className="text-gray-600">Identify common agricultural threats and find organic and standard treatments.</p>
      </div>

      <div className="card mb-8 bg-white border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search pests or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Vulnerable Crops</option>
              {allCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPests.length > 0 ? (
          filteredPests.map(pest => (
            <div key={pest.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{pest.name}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                  pest.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {pest.severity} Threat
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Affects</p>
                <div className="flex flex-wrap gap-1.5">
                  {pest.crops.map(c => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={16} className="text-yellow-600" /> Symptoms
                  </p>
                  <p className="text-sm text-gray-700">{pest.symptoms}</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={16} className="text-green-600" /> Organic/Safe Treatment
                  </p>
                  <p className="text-sm text-green-800">{pest.organicTreatment}</p>
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-sm font-semibold text-red-900 flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={16} className="text-red-600" /> Standard Treatment
                  </p>
                  <p className="text-sm text-red-800">{pest.chemicalTreatment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-2 text-center py-12 card bg-gray-50 border-dashed">
            <Bug size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No pests found</h3>
            <p className="text-gray-500">Try adjusting your search terms or selecting a different crop.</p>
          </div>
        )}
      </div>

      <div className="mt-8 card bg-amber-50 border-l-4 border-amber-500">
        <div className="flex items-start gap-3">
          <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-amber-900">Important Safety Notice</h4>
            <p className="text-sm text-amber-800 mt-1">
              Always read and follow manufacturer instructions when applying any chemical treatments. Wear proper protective equipment (PPE) including masks, gloves, and boots. When possible, prioritize organic treatments to protect soil health and local ecosystems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PestAndDiseaseGuide;
