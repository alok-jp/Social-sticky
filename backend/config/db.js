const mongoose = require('mongoose');

const connectDB = async () => {
  // Allow multiple environment variable names and provide a reasonable default for local dev.
  // Support: MONGODB_URI | MONGO_URI | MONGO_URL
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/social-sticky-notes';

  // If the user provided MONGO_DB_NAME, replace the database name (last path segment) in the URI.
  // This lets you provide a connection string and override only the DB name without editing secrets.
  const dbOverride = process.env.MONGO_DB_NAME;
  if (dbOverride) {
    try {
      // Split URI into [beforeParams, params]
      const qIdx = uri.indexOf('?');
      const beforeParams = qIdx === -1 ? uri : uri.slice(0, qIdx);
      const params = qIdx === -1 ? '' : uri.slice(qIdx);

      const lastSlash = beforeParams.lastIndexOf('/');
      if (lastSlash !== -1) {
        uri = beforeParams.slice(0, lastSlash + 1) + encodeURIComponent(dbOverride) + params;
        console.log(`Using MONGO_DB_NAME override — new URI database segment set to '${dbOverride}'.`);
      }
    } catch (e) {
      // If anything goes wrong, we'll fall back to the original uri and let mongoose report the error.
      console.warn('Failed to apply MONGO_DB_NAME override, proceeding with original URI.');
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Show a clearer message and echo which URI we attempted (avoid printing credentials when possible).
    console.error(`❌ DB Error connecting to MongoDB.`);
    // Only print the start of the URI so credentials aren't accidentally exposed in logs
    if (typeof uri === 'string') {
      const safe = uri.replace(/:(?:\/\/).*@/, '://[REDACTED]@');
      console.error(`Attempted URI (safe): ${safe}`);
    }
    console.error(error.message || error);
    process.exit(1);
  }
};

module.exports = connectDB;
