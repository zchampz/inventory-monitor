const puppeteer = require('puppeteer');
const crypto = require('crypto');
const cheerio = require('cheerio');
const cron = require('node-cron');
const twilio = require('twilio');
const mailgunLib = require('mailgun-js');

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
const TWILIO_FROM = process.env.TWILIO_FROM;
const TWILIO_TO = process.env.TWILIO_TO;

// Mailgun setup
const mailgun = mailgunLib({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = 'Tesla Monitor <tesla@mg.tinehealth.com>';

// Tesla Inventory URL
const TESLA_URL = 'https://www.tesla.com/inventory/new/my?TRIM=LRRWD&PAINT=BLUE&arrangeby=savings&zip=95051&range=0';
let lastHash = null;

// Fetch HTML content via Puppeteer
async function fetchInventoryPageContent() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(TESLA_URL, { waitUntil: 'domcontentloaded' });

  const pageContent = await page.content();
  await browser.close();
  return pageContent;
}

// Send email alert
async function sendEmail(subject, text) {
  const data = {
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject,
    text
  };
  mailgun.messages().send(data, function (error, body) {
    if (error) console.error('Email error:', error.message);
    else console.log('Email sent:', body.message);
  });
}

// Send SMS alert
async function sendSMS(text) {
  try {
    const msg = await twilioClient.messages.create({
      body: text,
      from: TWILIO_FROM,
      to: TWILIO_TO
    });
    console.log('SMS sent:', msg.sid);
  } catch (err) {
    console.error('SMS error:', err.message);
  }
}

// Monitor Tesla inventory
async function checkInventory() {
  try {
    const html = await fetchInventoryPageContent();
    const $ = cheerio.load(html);
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

// Run now and schedule every 15 minutes
checkInventory();
cron.schedule('*/15 * * * *', checkInventory);
