const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken && accountSid !== 'your-twilio-account-sid') {
  client = twilio(accountSid, authToken);
}

/**
 * Send an SMS message using Twilio.
 * @param {string} to - Destination phone number
 * @param {string} body - SMS message content
 * @returns {Promise<object>} Twilio message object or simulated response
 */
async function sendSMS(to, body) {
  if (!client) {
    console.log(`[SMS SIMULATION] SMS to: ${to}`);
    console.log(`[SMS SIMULATION] Content: ${body}`);
    return { sid: 'simulated_sid_' + Math.floor(Math.random() * 100000), status: 'queued' };
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: fromPhone,
      to: to
    });
    console.log(`Twilio SMS sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    throw error;
  }
}

module.exports = {
  sendSMS
};
