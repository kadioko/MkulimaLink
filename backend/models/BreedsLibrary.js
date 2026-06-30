const mongoose = require('mongoose');

const breedsLibrarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  species: {
    type: String,
    required: true,
    enum: ['cattle', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'turkey', 'rabbit', 'horse', 'donkey', 'camel', 'other']
  },
  origin: {
    type: String,
    trim: true
  },
  purpose: [{
    type: String,
    enum: ['meat', 'dairy', 'eggs', 'wool', 'draft', 'dual_purpose', 'ornamental']
  }],
  description: {
    type: String
  },
  characteristics: {
    avgWeightMale: { value: Number, unit: { type: String, default: 'kg' } },
    avgWeightFemale: { value: Number, unit: { type: String, default: 'kg' } },
    avgHeightCm: Number,
    lifespan: { min: Number, max: Number, unit: { type: String, default: 'years' } },
    colors: [String],
    distinctiveFeatures: [String]
  },
  productionMetrics: {
    milkYield: {
      avgDailyLiters: Number,
      lactationDays: Number
    },
    meatYield: {
      dressingPercentage: Number
    },
    eggsPerYear: Number,
    woolKgPerYear: Number
  },
  reproductionMetrics: {
    avgLitterSize: Number,
    gestationDays: { min: Number, max: Number },
    cycleLength: { min: Number, max: Number },
    breedingAge: { male: Number, female: Number, unit: { type: String, default: 'months' } }
  },
  careRequirements: {
    climate: [{ type: String, enum: ['tropical', 'subtropical', 'temperate', 'arid', 'cold'] }],
    feedingNotes: String,
    housingNotes: String,
    commonDiseases: [String],
    vaccinations: [String]
  },
  images: [{
    url: String,
    caption: String
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

breedsLibrarySchema.index({ species: 1, name: 1 });
breedsLibrarySchema.index({ name: 'text', description: 'text' });
breedsLibrarySchema.index({ createdBy: 1, name: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('BreedsLibrary', breedsLibrarySchema);
