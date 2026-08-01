const express = require('express');

const app = express();

// Use express.raw to preserve exact raw body bytes for signature verification
app.use(express.raw({ type: 'application/json' }));

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests (Webhook Verification)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests (Forwarding Webhooks)
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  
  // Log body for debugging
  try {
    console.log(JSON.parse(req.body.toString('utf8')));
  } catch (e) {
    console.log(req.body.toString('utf8'));
  }

  // Forward raw body and signature header to ngrok
  const signatureHeader = req.headers['x-hub-signature-256'];

  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (signatureHeader) {
      headers['x-hub-signature-256'] = signatureHeader;
    }

    await fetch('https://unstable-morphine-fried.ngrok-free.dev/api/whatsapp/webhook', {
      method: 'POST',
      headers,
      body: req.body // Send exact raw buffer
    });
  } catch (err) {
    console.error('Error forwarding webhook:', err);
  }

  res.status(200).end();
});

app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
