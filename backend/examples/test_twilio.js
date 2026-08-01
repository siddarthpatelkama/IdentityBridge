/**
 * Example usage script for testing the Twilio SMS integration service.
 * Run this with: node examples/test_twilio.js
 */

// Load dotenv to support local environment variables
require('dotenv').config();

const { sendMatchAlert } = require('../services/twilio');

async function testSMS() {
  // Replace with a valid test phone number in E.164 format (e.g., '+919876543210')
  const recipientPhoneNumber = process.env.TEST_RECIPIENT_PHONE || '+1234567890';
  
  const mockMatchDetails = {
    hospitalName: 'Gandhi Hospital',
    matchId: '884-A'
  };

  console.log(`Attempting to send test SMS to ${recipientPhoneNumber}...`);

  try {
    const result = await sendMatchAlert(recipientPhoneNumber, mockMatchDetails);
    console.log('Success! Message sent successfully.');
    console.log('Twilio Message Object:', {
      sid: result.sid,
      status: result.status,
      body: result.body,
      to: result.to
    });
  } catch (error) {
    console.error('Test SMS failed with error:', error.message);
  }
}

testSMS();
