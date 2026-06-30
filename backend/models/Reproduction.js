const mongoose = require('mongoose');

const heatCycleSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: Date,
  signs: [String],
  notes: String,
  breedingAttempted: { type: Boolean, default: false }
}, { _id: true });

const reproductionSchema = new mongoose.Schema({
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmWorkspace'
  },
  recordType: {
    type: String,
    required: true,
    enum: ['heat_cycle', 'mating', 'pregnancy', 'birth_outcome']
  },
  heatCycles: [heatCycleSchema],
  avgCycleLength: {
    type: Number
  },
  predictedNextHeat: {
    type: Date
  },
  mating: {
    date: Date,
    method: {
      type: String,
      enum: ['natural', 'artificial_insemination', 'embryo_transfer']
    },
    sire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livestock'
    },
    sireTagId: String,
    sireName: String,
    sireBreed: String,
    semenBatch: String,
    technician: String,
    notes: String,
    successful: { type: Boolean }
  },
  pregnancy: {
    confirmed: { type: Boolean, default: false },
    confirmationDate: Date,
    confirmationMethod: {
      type: String,
      enum: ['ultrasound', 'blood_test', 'physical_exam', 'observation']
    },
    expectedDueDate: Date,
    gestationDays: Number,
    status: {
      type: String,
      enum: ['suspected', 'confirmed', 'delivered', 'aborted', 'false_pregnancy'],
      default: 'suspected'
    },
    checkups: [{
      date: Date,
      notes: String,
      performedBy: String
    }]
  },
  birthOutcome: {
    date: Date,
    numberOfOffspring: { type: Number, default: 0 },
    liveBirths: { type: Number, default: 0 },
    stillbirths: { type: Number, default: 0 },
    complications: String,
    notes: String,
    offspring: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livestock'
    }]
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

reproductionSchema.index({ animal: 1, recordType: 1 });
reproductionSchema.index({ owner: 1, recordType: 1 });
reproductionSchema.index({ 'pregnancy.expectedDueDate': 1, 'pregnancy.status': 1 });
reproductionSchema.index({ predictedNextHeat: 1 });

module.exports = mongoose.model('Reproduction', reproductionSchema);
