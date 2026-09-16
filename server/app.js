const express = require('express');
const path = require('path');
const cors = require('cors');
const contractRouter = require('./routes/contractRoute');
const { blockchainErrorHandler } = require('./blockchain/errorHandler');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include curl/server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error('Origin is not allowed by CORS policy.');
      error.statusCode = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      callback(error);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'rentverse-api',
    timestamp: new Date().toISOString(),
  });
});

// Versioned blockchain API. It is intentionally isolated from the unrelated
// legacy server files that shipped in the source repository.
app.use('/api/v1/contracts', contractRouter);

// Unknown API paths should stay JSON instead of falling through to the SPA.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'API_ROUTE_NOT_FOUND',
      message: 'The requested API route does not exist.',
    },
  });
});

// Serve the React build when frontend and API are deployed together.
const rootDir = path.resolve();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(rootDir, 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('RentVerse API is running! 🚀');
  });
}

app.use(blockchainErrorHandler);

module.exports = app;
