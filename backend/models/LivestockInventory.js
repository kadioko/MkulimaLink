const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const livestockInventorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmWorkspace'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['feed', 'medication', 'vaccine', 'supplement', 'equipment', 'bedding', 'chemical', 'other']
  },
  description: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'liter', 'ml', 'piece', 'bag', 'bottle', 'box', 'dose']
  },
  currentQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderPoint: {
    type: Number,
    min: 0,
    default: 0
  },
  reorderQuantity: {
    type: Number,
    min: 0
  },
  maxQuantity: {
    type: Number,
    min: 0
  },
  unitCost: {
    type: Number,
    min: 0
  },
  supplier: {
    name: String,
    contact: String
  },
  storageLocation: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  movements: [stockMovementSchema],
  alertSent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

livestockInventorySchema.virtual('isLowStock').get(function () {
  return this.reorderPoint > 0 && this.currentQuantity <= this.reorderPoint;
});

livestockInventorySchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiryDate) return false;
  const daysToExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysToExpiry <= 30 && daysToExpiry > 0;
});

livestockInventorySchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
});

livestockInventorySchema.set('toJSON', { virtuals: true });

livestockInventorySchema.index({ owner: 1, category: 1 });
livestockInventorySchema.index({ owner: 1, workspace: 1 });
livestockInventorySchema.index({ currentQuantity: 1, reorderPoint: 1 });
livestockInventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model('LivestockInventory', livestockInventorySchema);
