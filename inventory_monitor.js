const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Twilio config
const twilio = require('twilio');
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
const TWILIO_FROM = process.env.TWILIO_FROM;
const TWILIO_TO = process.env.TWILIO_TO;

// Mailgun config
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY ,
  domain: process.env.MAILGUN_DOMAIN 
});
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

const TESLA_URL = process.env.TESLA_URL;
let lastHash = null;

async function checkInventory() {
  try {
  const res = await axios.get(TESLA_URL, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});
    const $ = cheerio.load(res.data);
    const pageText = $('body').text();
    const currentHash = crypto.createHash('sha256').update(pageText).digest('hex');

    if (lastHash && lastHash !== currentHash) {
      const message = `🚘 New Tesla inventory detected:\n${TESLA_URL}`;
      await sendSMS(message);
      await sendEmail('Tesla Inventory Update', message);
    } else {
      console.log(`[${new Date().toISOString()}] No change.`);
    }

    lastHash = currentHash;
  } catch (err) {
    console.error('Error checking inventory:', err.message);
  }
}

async function sendSMS(text) {
  try {
    const msg = await twilioClient.messages.create({
      body: text,
      from: TWILIO_FROM,
      to: TWILIO_TO
    });
    console.log('SMS sent:', msg.sid);
  } catch (err) {
    console.error('Failed to send SMS:', err.message);
  }
}

async function sendEmail(subject, text) {
  const data = {
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject,
    text
  };
  mailgun.messages().send(data, function (error, body) {
    if (error) console.error('Failed to send email:', error.message);
    else console.log('Email sent:', body.message);
  });
}

checkInventory();
cron.schedule('*/15 * * * *', checkInventory);
