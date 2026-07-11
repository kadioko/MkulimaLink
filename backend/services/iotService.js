/**
 * IoT Service
 * Manages IoT devices, real-time data streaming, and sensor integration
 */

const { IoTDevice, SensorData, DeviceAlert, IoTAnalytics } = require('../models/IoT');
const { User } = require('../models');

class IoTService {
  constructor() {
    this.deviceTypes = ['soil_sensor', 'weather_station', 'moisture_sensor', 'temperature_sensor', 'ph_sensor', 'camera', 'drone'];
    this.supportedProtocols = ['mqtt', 'http', 'websocket', 'lora', 'zigbee'];
  }

  /**
   * Register IoT device
   */
  async registerDevice(userId, deviceData) {
    try {
      const { device_name, device_type, location, protocol, farm_id } = deviceData;

      if (!this.deviceTypes.includes(device_type)) {
        throw new Error('Invalid device type');
      }

      const device = new IoTDevice({
        user_id: userId,
        device_name,
        device_type,
        location,
        protocol: protocol || 'mqtt',
        farm_id,
        device_id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        api_key: this.generateApiKey(),
        status: 'active',
        last_seen: new Date()
      });

      await device.save();
      return device;
    } catch (error) {
      console.error('Register device error:', error);
      throw error;
    }
  }

  /**
   * Get device details
   */
  async getDeviceDetails(deviceId) {
    try {
      const device = await IoTDevice.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Get recent sensor data
      const recentData = await SensorData.find({ device_id: deviceId })
        .sort({ timestamp: -1 })
        .limit(100);

      // Get device alerts
      const alerts = await DeviceAlert.find({ device_id: deviceId })
        .sort({ created_at: -1 })
        .limit(10);

      return {
        ...device.toObject(),
        recent_data: recentData,
        alerts
      };
    } catch (error) {
      console.error('Get device details error:', error);
      throw error;
    }
  }

  /**
   * Process sensor data
   */
  async processSensorData(deviceId, sensorData) {
    try {
      const device = await IoTDevice.findOne({ device_id: deviceId });
      if (!device) {
        throw new Error('Device not found');
      }

      // Store sensor data
      const data = new SensorData({
        device_id: deviceId,
        user_id: device.user_id,
        sensor_type: sensorData.sensor_type,
        value: sensorData.value,
        unit: sensorData.unit,
        location: sensorData.location || device.location,
        timestamp: new Date(sensorData.timestamp || Date.now()),
        metadata: sensorData.metadata || {}
      });

      await data.save();

      // Update device last seen
      device.last_seen = new Date();
      await device.save();

      // Check for alerts
      await this.checkForAlerts(device, data);

      // Update analytics
      await this.updateAnalytics(deviceId, data);

      return data;
    } catch (error) {
      console.error('Process sensor data error:', error);
      throw error;
    }
  }

  /**
   * Check for alerts
   */
  async checkForAlerts(device, sensorData) {
    try {
      const thresholds = {
        soil_moisture: { min: 20, max: 80 },
        temperature: { min: 10, max: 35 },
        ph_level: { min: 5.5, max: 7.5 },
        humidity: { min: 30, max: 90 }
      };

      const threshold = thresholds[sensorData.sensor_type];
      if (!threshold) return;

      let alertTriggered = false;
      let alertType = null;

      if (sensorData.value < threshold.min) {
        alertTriggered = true;
        alertType = 'below_minimum';
      } else if (sensorData.value > threshold.max) {
        alertTriggered = true;
        alertType = 'above_maximum';
      }

      if (alertTriggered) {
        const alert = new DeviceAlert({
          device_id: device._id,
          user_id: device.user_id,
          sensor_type: sensorData.sensor_type,
          alert_type: alertType,
          value: sensorData.value,
          threshold: threshold,
          message: `${sensorData.sensor_type} is ${alertType.replace('_', ' ')}: ${sensorData.value}${sensorData.unit}`,
          status: 'active'
        });

        await alert.save();
      }
    } catch (error) {
      console.error('Check for alerts error:', error);
    }
  }

  /**
   * Get sensor data
   */
  async getSensorData(deviceId, sensorType = null, page = 1, limit = 100) {
    try {
      const skip = (page - 1) * limit;
      let filter = { device_id: deviceId };

      if (sensorType) {
        filter.sensor_type = sensorType;
      }

      const data = await SensorData.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await SensorData.countDocuments(filter);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get sensor data error:', error);
      throw error;
    }
  }

  /**
   * Get device alerts
   */
  async getDeviceAlerts(deviceId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const alerts = await DeviceAlert.find({ device_id: deviceId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DeviceAlert.countDocuments({ device_id: deviceId });

      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get device alerts error:', error);
      throw error;
    }
  }

  /**
   * Get user devices
   */
  async getUserDevices(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const devices = await IoTDevice.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await IoTDevice.countDocuments({ user_id: userId });

      return {
        devices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user devices error:', error);
      throw error;
    }
  }

  /**
   * Get IoT analytics
   */
  async getIoTAnalytics(deviceId, period = '24h') {
    try {
      const analytics = await IoTAnalytics.findOne({ device_id: deviceId });

      if (!analytics) {
        throw new Error('Analytics not found');
      }

      return analytics;
    } catch (error) {
      console.error('Get IoT analytics error:', error);
      throw error;
    }
  }

  /**
   * Update analytics
   */
  async updateAnalytics(deviceId, sensorData) {
    try {
      let analytics = await IoTAnalytics.findOne({ device_id: deviceId });

      if (!analytics) {
        analytics = new IoTAnalytics({
          device_id: deviceId,
          total_readings: 0,
          average_value: 0,
          min_value: sensorData.value,
          max_value: sensorData.value
        });
      }

      // Update statistics
      analytics.total_readings += 1;
      analytics.min_value = Math.min(analytics.min_value, sensorData.value);
      analytics.max_value = Math.max(analytics.max_value, sensorData.value);
      analytics.average_value = (analytics.average_value * (analytics.total_readings - 1) + sensorData.value) / analytics.total_readings;
      analytics.last_updated = new Date();

      await analytics.save();
    } catch (error) {
      console.error('Update analytics error:', error);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId) {
    try {
      const alert = await DeviceAlert.findByIdAndUpdate(
        alertId,
        { status: 'acknowledged', acknowledged_at: new Date() },
        { returnDocument: 'after' }
      );

      return alert;
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId) {
    try {
      const alert = await DeviceAlert.findByIdAndUpdate(
        alertId,
        { status: 'resolved', resolved_at: new Date() },
        { returnDocument: 'after' }
      );

      return alert;
    } catch (error) {
      console.error('Resolve alert error:', error);
      throw error;
    }
  }

  /**
   * Get device types
   */
  getDeviceTypes() {
    return this.deviceTypes;
  }

  /**
   * Get supported protocols
   */
  getSupportedProtocols() {
    return this.supportedProtocols;
  }

  // Helper methods

  generateApiKey() {
    return `iot_${Date.now()}_${Math.random().toString(36).substr(2, 20)}`;
  }
}

module.exports = new IoTService();



