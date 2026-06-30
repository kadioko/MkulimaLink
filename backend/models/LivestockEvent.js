const mongoose = require('mongoose');

const livestockEventSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['birth', 'nutrition', 'medical', 'vaccination', 'weighing', 'breeding', 'pregnancy_check', 'birth_of_offspring', 'purchase', 'sale', 'death', 'milestone', 'grooming', 'hoof_trim', 'deworming', 'other']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  performedBy: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    min: 0
  },
  medicationUsed: {
    name: String,
    dosage: String,
    unit: String,
    batchNumber: String
  },
  nutritionDetails: {
    feedType: String,
    quantity: Number,
    unit: String
  },
  weightRecorded: {
    value: Number,
    unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
  },
  attachments: [{
    url: String,
    type: { type: String, enum: ['photo', 'document', 'report'] },
    name: String
  }],
  reminder: {
    isSet: { type: Boolean, default: false },
    dueDate: Date,
    notified: { type: Boolean, default: false }
  },
  tags: [String]
}, {
  timestamps: true
});

livestockEventSchema.index({ animal: 1, date: -1 });
livestockEventSchema.index({ owner: 1, type: 1, date: -1 });
livestockEventSchema.index({ owner: 1, workspace: 1, date: -1 });
livestockEventSchema.index({ 'reminder.dueDate': 1, 'reminder.notified': 1 });

module.exports = mongoose.model('LivestockEvent', livestockEventSchema);
