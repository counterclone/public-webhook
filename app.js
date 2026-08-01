const express = require('express');
const crypto = require('crypto');

const app = express();

// Capture raw body buffer for signature calculation
app.use(express.raw({ type: 'application/json' }));

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const META_APP_SECRET = '12345'; // Forcefully set secret

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  
  const rawBody = req.body;

  // Forcefully generate the x-hub-signature-256 using secret "12345"
  const signatureHeader = 'sha256=' + crypto
    .createHmac('sha256', META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    await fetch('https://unstable-morphine-fried.ngrok-free.dev/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signatureHeader
      },
      body: rawBody
    });
  } catch (err) {
    console.error('Error forwarding webhook:', err);
  }

  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
