import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const speciesIcons = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷', chicken: '🐓',
  duck: '🦆', turkey: '🦃', rabbit: '🐇', horse: '🐴', donkey: '🫏',
  camel: '🐪', other: '🐾'
};

const purposeColors = {
  meat: 'bg-red-50 text-red-700', dairy: 'bg-blue-50 text-blue-700',
  eggs: 'bg-yellow-50 text-yellow-700', wool: 'bg-gray-50 text-gray-700',
  draft: 'bg-orange-50 text-orange-700', dual_purpose: 'bg-green-50 text-green-700',
  ornamental: 'bg-pink-50 text-pink-700'
};

const speciesList = ['cattle', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'turkey', 'rabbit', 'horse', 'donkey', 'camel', 'other'];

const SAMPLE_BREEDS = [
  { _id: 'b1', name: 'Friesian (Holstein)', species: 'cattle', origin: 'Netherlands', purpose: ['dairy'], description: 'Most common dairy breed worldwide. High milk production.', characteristics: { avgWeightFemale: { value: 590, unit: 'kg' }, colors: ['Black and white'] }, productionMetrics: { milkYield: { avgDailyLiters: 28, lactationDays: 305 } } },
  { _id: 'b2', name: 'Boran', species: 'cattle', origin: 'East Africa', purpose: ['meat', 'dual_purpose'], description: 'Hardy East African Zebu, well adapted to tropical conditions.', characteristics: { avgWeightFemale: { value: 320, unit: 'kg' }, colors: ['White', 'Red', 'Brown'] } },
  { _id: 'b3', name: 'Galla', species: 'goat', origin: 'East Africa', purpose: ['meat', 'dairy'], description: 'Large East African goat, high meat yield and good milk production.', characteristics: { avgWeightFemale: { value: 38, unit: 'kg' }, colors: ['White'] } },
  { _id: 'b4', name: 'Toggenburg', species: 'goat', origin: 'Switzerland', purpose: ['dairy'], description: 'Oldest known dairy goat breed, excellent milk production.', characteristics: { avgWeightFemale: { value: 55, unit: 'kg' }, colors: ['Brown', 'Gray'] }, productionMetrics: { milkYield: { avgDailyLiters: 3.8, lactationDays: 290 } } },
  { _id: 'b5', name: 'Red Maasai', species: 'sheep', origin: 'East Africa', purpose: ['meat'], description: 'Highly resistant to internal parasites. Well adapted to East Africa.', characteristics: { avgWeightFemale: { value: 35, unit: 'kg' }, colors: ['Red', 'Brown'] } },
  { _id: 'b6', name: 'Kuroiler', species: 'chicken', origin: 'India', purpose: ['meat', 'eggs'], description: 'Dual purpose breed designed for rural farming. Robust and good forager.', characteristics: { colors: ['Multi-colored'] }, productionMetrics: { eggsPerYear: 150 } },
  { _id: 'b7', name: 'Rhode Island Red', species: 'chicken', origin: 'USA', purpose: ['eggs', 'meat'], description: 'Reliable layer, good temperament, adaptable to various climates.', characteristics: { colors: ['Dark red'] }, productionMetrics: { eggsPerYear: 260 } },
  { _id: 'b8', name: 'Duroc', species: 'pig', origin: 'USA', purpose: ['meat'], description: 'Fast growing, high meat quality, good feed conversion.', characteristics: { avgWeightFemale: { value: 220, unit: 'kg' }, colors: ['Red', 'Reddish brown'] } },
];

export default function BreedsLibrary() {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecies, setFilterSpecies] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchBreeds();
  }, []);

  async function fetchBreeds() {
    setLoading(true);
    try {
      const res = await api.get('/livestock/breeds');
      const fetched = res.data.data || [];
      setBreeds(fetched.length > 0 ? fetched : SAMPLE_BREEDS);
    } catch {
      setBreeds(SAMPLE_BREEDS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = breeds.filter(b => {
    if (filterSpecies && b.species !== filterSpecies) return false;
    if (search) {
      const s = search.toLowerCase();
      return b.name.toLowerCase().includes(s) || (b.origin || '').toLowerCase().includes(s) || (b.description || '').toLowerCase().includes(s);
    }
    return true;
  });

  const speciesWithBreeds = [...new Set(breeds.map(b => b.species))];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">📚</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/livestock" className="text-amber-200 text-sm mb-4 inline-flex items-center gap-1">← Herd</Link>
          <div className="mt-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">📚 Breeds Library</h1>
            <p className="text-amber-100 mt-1">Comprehensive database of livestock breeds, care requirements and metrics</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search breeds, origin, purpose..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 flex-1"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterSpecies('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterSpecies === '' ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            All Species
          </button>
          {speciesWithBreeds.map(s => (
            <button
              key={s}
              onClick={() => setFilterSpecies(filterSpecies === s ? '' : s)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors flex items-center gap-1 ${filterSpecies === s ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {speciesIcons[s]} {s}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500">{filtered.length} breed{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Breeds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(breed => (
            <div
              key={breed._id}
              onClick={() => setSelected(breed)}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-amber-200 border border-transparent transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {breed.images?.[0]?.url
                    ? <img src={breed.images[0].url} alt="" className="w-full h-full object-cover rounded-xl" />
                    : speciesIcons[breed.species] || '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{breed.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{breed.species} {breed.origin ? `· ${breed.origin}` : ''}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {breed.purpose?.map(p => (
                  <span key={p} className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${purposeColors[p] || 'bg-gray-50 text-gray-600'}`}>
                    {p.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {breed.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{breed.description}</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs text-gray-500">
                {breed.characteristics?.avgWeightFemale?.value && (
                  <div>⚖️ Female: {breed.characteristics.avgWeightFemale.value}{breed.characteristics.avgWeightFemale.unit}</div>
                )}
                {breed.productionMetrics?.milkYield?.avgDailyLiters && (
                  <div>🥛 {breed.productionMetrics.milkYield.avgDailyLiters}L/day</div>
                )}
                {breed.productionMetrics?.eggsPerYear && (
                  <div>🥚 {breed.productionMetrics.eggsPerYear} eggs/yr</div>
                )}
                {breed.characteristics?.colors?.length > 0 && (
                  <div>🎨 {breed.characteristics.colors.slice(0, 2).join(', ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breed Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl overflow-hidden">
                  {selected.images?.[0]?.url ? <img src={selected.images[0].url} alt="" className="w-full h-full object-cover rounded-2xl" /> : speciesIcons[selected.species]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selected.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{selected.species} {selected.origin ? `· Origin: ${selected.origin}` : ''}</p>
                  <div className="flex gap-1 mt-1">
                    {selected.purpose?.map(p => (
                      <span key={p} className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${purposeColors[p] || 'bg-gray-50 text-gray-600'}`}>
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {selected.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">About</h4>
                  <p className="text-sm text-gray-600">{selected.description}</p>
                </div>
              )}

              {selected.characteristics && Object.values(selected.characteristics).some(v => v) && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Characteristics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.characteristics.avgWeightMale?.value && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Male Weight</p>
                        <p className="font-bold text-gray-800">{selected.characteristics.avgWeightMale.value} {selected.characteristics.avgWeightMale.unit}</p>
                      </div>
                    )}
                    {selected.characteristics.avgWeightFemale?.value && (
                      <div className="bg-pink-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Female Weight</p>
                        <p className="font-bold text-gray-800">{selected.characteristics.avgWeightFemale.value} {selected.characteristics.avgWeightFemale.unit}</p>
                      </div>
                    )}
                    {selected.characteristics.lifespan?.min && (
                      <div className="bg-green-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Lifespan</p>
                        <p className="font-bold text-gray-800">{selected.characteristics.lifespan.min}–{selected.characteristics.lifespan.max} yrs</p>
                      </div>
                    )}
                    {selected.characteristics.colors?.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Colors</p>
                        <p className="font-bold text-gray-800">{selected.characteristics.colors.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  {selected.characteristics.distinctiveFeatures?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Distinctive Features</p>
                      <div className="flex flex-wrap gap-1">
                        {selected.characteristics.distinctiveFeatures.map((f, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected.productionMetrics && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Production Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.productionMetrics.milkYield?.avgDailyLiters && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Milk Yield</p>
                        <p className="font-bold text-gray-800">{selected.productionMetrics.milkYield.avgDailyLiters}L/day</p>
                        {selected.productionMetrics.milkYield.lactationDays && (
                          <p className="text-xs text-gray-500">{selected.productionMetrics.milkYield.lactationDays} lactation days</p>
                        )}
                      </div>
                    )}
                    {selected.productionMetrics.eggsPerYear && (
                      <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Eggs / Year</p>
                        <p className="font-bold text-gray-800">{selected.productionMetrics.eggsPerYear}</p>
                      </div>
                    )}
                    {selected.productionMetrics.woolKgPerYear && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs">Wool / Year</p>
                        <p className="font-bold text-gray-800">{selected.productionMetrics.woolKgPerYear} kg</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selected.reproductionMetrics && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Reproduction</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selected.reproductionMetrics.gestationDays?.min && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Gestation</p>
                        <p className="font-bold text-gray-800">{selected.reproductionMetrics.gestationDays.min}–{selected.reproductionMetrics.gestationDays.max} days</p>
                      </div>
                    )}
                    {selected.reproductionMetrics.avgLitterSize && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Avg Litter</p>
                        <p className="font-bold text-gray-800">{selected.reproductionMetrics.avgLitterSize}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selected.careRequirements && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Care Requirements</h4>
                  {selected.careRequirements.feedingNotes && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">🌾 Feeding</p>
                      <p className="text-sm text-gray-600">{selected.careRequirements.feedingNotes}</p>
                    </div>
                  )}
                  {selected.careRequirements.housingNotes && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">🏠 Housing</p>
                      <p className="text-sm text-gray-600">{selected.careRequirements.housingNotes}</p>
                    </div>
                  )}
                  {selected.careRequirements.vaccinations?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">💉 Common Vaccinations</p>
                      <div className="flex flex-wrap gap-1">
                        {selected.careRequirements.vaccinations.map((v, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
