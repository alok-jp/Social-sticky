
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Ensure we have a JWT secret. In production, require it explicitly. For local/dev,
// generate a temporary secret to avoid crashes when the developer hasn't created a .env file.
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production. Set JWT_SECRET in your environment.');
  }

  // Dev fallback: generate a temporary secret and warn the developer.
  const fallback = crypto.randomBytes(32).toString('hex');
  // Print only once to avoid noisy logs during restarts.
  if (!global.__printedJwtSecretWarning) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Warning: JWT_SECRET is not set. A temporary secret has been generated for development only.');
    global.__printedJwtSecretWarning = true;
  }
  return fallback;
}

exports.generateToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.generateResetToken = () => {
  const raw = crypto.randomBytes(20).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};
