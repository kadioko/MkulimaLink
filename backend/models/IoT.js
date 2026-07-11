/**
 * IoT Models
 * Models for IoT device management and sensor data
 */

const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  device_name: {
    type: String,
    required: true
  },
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  device_type: {
    type: String,
    enum: ['soil_sensor', 'weather_station', 'moisture_sensor', 'temperature_sensor', 'ph_sensor', 'camera', 'drone'],
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  farm_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  protocol: {
    type: String,
    enum: ['mqtt', 'http', 'websocket', 'lora', 'zigbee'],
    default: 'mqtt'
  },
  api_key: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'maintenance'],
    default: 'active',
    index: true
  },
  battery_level: Number,
  signal_strength: Number,
  last_seen: {
    type: Date,
    index: true
  },
  firmware_version: String,
  configuration: mongoose.Schema.Types.Mixed,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Geospatial index
iotDeviceSchema.index({ location: '2dsphere' });

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sensor_type: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for time-series queries
sensorDataSchema.index({ device_id: 1, timestamp: -1 });
sensorDataSchema.index({ sensor_type: 1, timestamp: -1 });
sensorDataSchema.index({ user_id: 1, timestamp: -1 });

// Device Alert Schema
const deviceAlertSchema = new mongoose.Schema({
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IoTDevice'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sensor_type: {
    type: String,
    required: true
  },
  alert_type: {
    type: String,
    enum: ['below_minimum', 'above_maximum', 'device_offline', 'battery_low', 'error'],
    required: true,
    index: true
  },
  value: Number,
  threshold: mongoose.Schema.Types.Mixed,
  message: String,
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
    index: true
  },
  acknowledged_at: Date,
  resolved_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
deviceAlertSchema.index({ user_id: 1, status: 1 });
deviceAlertSchema.index({ created_at: -1 });

// IoT Analytics Schema
const iotAnalyticsSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  total_readings: {
    type: Number,
    default: 0
  },
  average_value: Number,
  min_value: Number,
  max_value: Number,
  last_updated: {
    type: Date,
    default: Date.now
  },
  daily_stats: [{
    date: Date,
    readings: Number,
    average: Number,
    min: Number,
    max: Number
  }],
  weekly_stats: [{
    week: Number,
    readings: Number,
    average: Number,
    min: Number,
    max: Number
  }]
}, {
  timestamps: true
});

// Device Command Schema
const deviceCommandSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  command_type: {
    type: String,
    enum: ['reboot', 'update_config', 'calibrate', 'test', 'shutdown'],
    required: true
  },
  parameters: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'sent', 'executed', 'failed'],
    default: 'pending',
    index: true
  },
  result: mongoose.Schema.Types.Mixed,
  created_at: {
    type: Date,
    default: Date.now
  },
  executed_at: Date
}, {
  timestamps: true
});

// Indexes
deviceCommandSchema.index({ device_id: 1, created_at: -1 });
deviceCommandSchema.index({ status: 1 });

// Models
const IoTDevice = mongoose.model('IoTDevice', iotDeviceSchema);
const SensorData = mongoose.model('SensorData', sensorDataSchema);
const DeviceAlert = mongoose.model('DeviceAlert', deviceAlertSchema);
const IoTAnalytics = mongoose.model('IoTAnalytics', iotAnalyticsSchema);
const DeviceCommand = mongoose.model('DeviceCommand', deviceCommandSchema);

module.exports = {
  IoTDevice,
  SensorData,
  DeviceAlert,
  IoTAnalytics,
  DeviceCommand
};



