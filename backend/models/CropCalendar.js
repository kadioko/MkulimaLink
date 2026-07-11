const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['planting', 'fertilizing', 'watering', 'weeding', 'pest_control', 'harvesting', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped', 'overdue'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  reminderSent: Boolean,
  notes: String,
  weather: {
    recommended: [String],
    avoid: [String]
  },
  resources: [{
    type: String,
    quantity: Number,
    unit: String,
    cost: Number
  }],
  assignedTo: String
});

const cropCalendarSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  crop: {
    type: String,
    required: true
  },
  variety: String,
  season: {
    type: String,
    enum: ['masika', 'vuli', 'year_round'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  farm: {
    name: String,
    size: Number,
    unit: {
      type: String,
      default: 'acres'
    },
    location: {
      region: String,
      district: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    soilType: String
  },
  timeline: {
    plantingDate: Date,
    expectedHarvestDate: Date,
    actualHarvestDate: Date,
    growthDuration: Number
  },
  tasks: [taskSchema],
  inputs: [{
    type: {
      type: String,
      enum: ['seeds', 'fertilizer', 'pesticide', 'herbicide', 'labor', 'equipment', 'other']
    },
    name: String,
    quantity: Number,
    unit: String,
    cost: Number,
    supplier: String,
    appliedDate: Date,
    notes: String
  }],
  expenses: [{
    category: String,
    description: String,
    amount: Number,
    date: Date,
    receipt: String
  }],
  yields: {
    expected: {
      quantity: Number,
      unit: String
    },
    actual: {
      quantity: Number,
      unit: String,
      quality: String
    }
  },
  revenue: {
    expected: Number,
    actual: Number,
    sales: [{
      quantity: Number,
      pricePerUnit: Number,
      totalAmount: Number,
      buyer: String,
      date: Date
    }]
  },
  weather: {
    conditions: [{
      date: Date,
      temperature: Number,
      rainfall: Number,
      humidity: Number,
      notes: String
    }],
    alerts: [{
      type: String,
      message: String,
      date: Date,
      acknowledged: Boolean
    }]
  },
  notes: [{
    content: String,
    date: Date,
    images: [String]
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'harvesting', 'completed', 'abandoned'],
    default: 'planning'
  },
  profitability: {
    totalExpenses: Number,
    totalRevenue: Number,
    profit: Number,
    roi: Number
  },
  linkedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }]
}, {
  timestamps: true
});

cropCalendarSchema.index({ user: 1, status: 1 });
cropCalendarSchema.index({ crop: 1, season: 1, year: 1 });
cropCalendarSchema.index({ 'farm.location.region': 1 });

cropCalendarSchema.methods.addTask = async function(taskData) {
  this.tasks.push(taskData);
  await this.save();
  return this.tasks[this.tasks.length - 1];
};

cropCalendarSchema.methods.calculateProfitability = function() {
  const totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0) +
    this.inputs.reduce((sum, i) => sum + (i.cost || 0), 0);
  
  const totalRevenue = this.revenue.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
  
  this.profitability = {
    totalExpenses,
    totalRevenue,
    profit: totalRevenue - totalExpenses,
    roi: totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0
  };
  
  return this.profitability;
};

cropCalendarSchema.methods.getUpcomingTasks = function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.tasks.filter(task => 
    task.status === 'pending' &&
    task.scheduledDate >= now &&
    task.scheduledDate <= futureDate
  ).sort((a, b) => a.scheduledDate - b.scheduledDate);
};

cropCalendarSchema.methods.getOverdueTasks = function() {
  const now = new Date();
  
  return this.tasks.filter(task =>
    task.status === 'pending' &&
    task.scheduledDate < now
  );
};

module.exports = mongoose.model('CropCalendar', cropCalendarSchema);



