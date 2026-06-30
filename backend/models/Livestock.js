const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmWorkspace'
  },
  tagId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  species: {
    type: String,
    required: true,
    enum: ['cattle', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'turkey', 'rabbit', 'horse', 'donkey', 'camel', 'other']
  },
  breed: {
    type: String,
    trim: true
  },
  breedRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BreedsLibrary'
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'castrated']
  },
  dateOfBirth: {
    type: Date
  },
  ageEstimated: {
    type: Boolean,
    default: false
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
    recordedAt: Date
  },
  color: {
    type: String,
    trim: true
  },
  markings: {
    type: String,
    trim: true
  },
  photos: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  healthStatus: {
    type: String,
    enum: ['healthy', 'sick', 'recovering', 'pregnant', 'deceased', 'sold'],
    default: 'healthy'
  },
  parentage: {
    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livestock'
    },
    motherTagId: String,
    father: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livestock'
    },
    fatherTagId: String
  },
  group: {
    type: String,
    trim: true
  },
  location: {
    farm: String,
    pen: String,
    pasture: String
  },
  acquisitionType: {
    type: String,
    enum: ['born', 'purchased', 'gifted', 'other'],
    default: 'born'
  },
  acquisitionDate: {
    type: Date
  },
  acquisitionCost: {
    type: Number
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

livestockSchema.index({ owner: 1, species: 1, healthStatus: 1 });
livestockSchema.index({ owner: 1, workspace: 1 });
livestockSchema.index({ tagId: 1, owner: 1 });
livestockSchema.index({ 'parentage.mother': 1 });
livestockSchema.index({ 'parentage.father': 1 });

module.exports = mongoose.model('Livestock', livestockSchema);
