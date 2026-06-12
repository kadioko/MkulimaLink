const axios = require('axios');

const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
};

const smsApiUrl = 'https://api.africastalking.com/version1/messaging';

const sendSMS = async (phoneNumber, message) => {
  try {
    if (!phoneNumber || !message) {
      console.log('SMS not sent: Missing phone number or message');
      return { success: false, message: 'Missing parameters' };
    }

    let formattedPhone = phoneNumber.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+255' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+255' + formattedPhone;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS] To: ${formattedPhone}, Message: ${message}`);
      return { success: true, message: 'SMS logged (dev mode)' };
    }

    if (!credentials.apiKey || !credentials.username) {
      return { success: false, message: 'SMS provider is not configured' };
    }

    const params = new URLSearchParams({
      username: credentials.username,
      to: formattedPhone,
      message,
      from: process.env.AFRICASTALKING_SENDER_ID || 'MkulimaLink'
    });

    const response = await axios.post(smsApiUrl, params, {
      headers: {
        apiKey: credentials.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      timeout: 10000
    });

    console.log('SMS sent successfully:', response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendBulkSMS = async (recipients) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await sendSMS(recipient.phone, recipient.message);
      results.push({
        phone: recipient.phone,
        success: result.success
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  } catch (error) {
    console.error('Bulk SMS error:', error);
    throw error;
  }
};

module.exports = { sendSMS, sendBulkSMS };
