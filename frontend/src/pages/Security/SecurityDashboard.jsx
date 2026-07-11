import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Eye, Smartphone, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const SecurityDashboard = () => {
  const [report, setReport] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [devices, setDevices] = useState([]);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [reportRes, auditRes, devicesRes] = await Promise.all([
        api.get('/api/security/security-report'),
        api.get('/api/security/audit-trail'),
        api.get('/api/security/devices')
      ]);

      setReport(reportRes.data);
      setAuditTrail(auditRes.data.events || []);
      setDevices(devicesRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await api.post('/api/security/2fa/enable', { method: 'sms' });
      setTwoFAEnabled(true);
      alert('2FA enabled successfully');
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      alert('Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await api.post('/api/security/2fa/disable');
      setTwoFAEnabled(false);
      alert('2FA disabled');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      alert('Failed to disable 2FA');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading security dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Security Center
          </h1>
          <p className="text-gray-600">Monitor and manage your account security</p>
        </div>

        {/* Security Score */}
        {report && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Score</h2>
                <p className="text-gray-600">Your account security status</p>
              </div>
              <div className="text-6xl font-bold text-blue-600">{report.security_score}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{report.total_events}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Fraud Alerts</p>
                <p className="text-2xl font-bold text-red-600">{report.fraud_alerts}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Blocked</p>
                <p className="text-2xl font-bold text-orange-600">{report.blocked_transactions}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Flagged</p>
                <p className="text-2xl font-bold text-yellow-600">{report.flagged_transactions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Lock className="w-6 h-6 mr-2 text-blue-600" />
              Two-Factor Authentication
            </h2>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              twoFAEnabled
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <p className="text-gray-600 mb-6">
            Add an extra layer of security to your account with two-factor authentication.
          </p>

          <button
            onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              twoFAEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>

        {/* Trusted Devices */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-blue-600" />
            Trusted Devices ({devices.length})
          </h2>

          {devices.length > 0 ? (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{device.device_name}</p>
                    <p className="text-sm text-gray-600">
                      {device.device_type} • {device.os} • {device.browser}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last used: {new Date(device.last_used).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No trusted devices yet</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Eye className="w-6 h-6 mr-2 text-blue-600" />
            Recent Activity
          </h2>

          {auditTrail.length > 0 ? (
            <div className="space-y-3">
              {auditTrail.slice(0, 10).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {event.event_type.includes('failed') ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{event.ip_address}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );

  async function handleRemoveDevice(deviceId) {
    try {
      await axios.post(`/api/security/devices/${deviceId}/remove`);
      fetchSecurityData();
      alert('Device removed');
    } catch (error) {
      console.error('Failed to remove device:', error);
      alert('Failed to remove device');
    }
  }
};

export default SecurityDashboard;
