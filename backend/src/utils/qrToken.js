const crypto = require('crypto');

// Generates a random raw token (sent to client / encoded in QR) and its SHA-256 hash (stored in DB).
// The DB only ever stores the hash, so a leaked database cannot be used to forge QR codes.
const generateQrToken = () => {
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

const generateDeliveryPin = () => String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6);

module.exports = { generateQrToken, hashToken, generateDeliveryPin };
