const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'worker', 'vet', 'viewer'],
    default: 'worker'
  },
  permissions: {
    canAddAnimals: { type: Boolean, default: true },
    canEditAnimals: { type: Boolean, default: true },
    canDeleteAnimals: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canManageTeam: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  inviteStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'accepted'
  }
}, { _id: true });

const farmWorkspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    name: String,
    region: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  farmType: [{
    type: String,
    enum: ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'mixed', 'dairy', 'feedlot', 'breeding']
  }],
  farmSize: {
    value: Number,
    unit: { type: String, enum: ['acres', 'hectares', 'sq_meters'], default: 'acres' }
  },
  logo: {
    type: String
  },
  members: [memberSchema],
  settings: {
    currency: { type: String, default: 'TZS' },
    weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timezone: { type: String, default: 'Africa/Dar_es_Salaam' },
    lowStockNotifications: { type: Boolean, default: true },
    upcomingEventNotifications: { type: Boolean, default: true },
    notificationDaysBefore: { type: Number, default: 3 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

farmWorkspaceSchema.index({ owner: 1 });
farmWorkspaceSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('FarmWorkspace', farmWorkspaceSchema);
