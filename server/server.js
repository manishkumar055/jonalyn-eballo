require('dotenv').config();

const app = require('./app');

const PORT = Number.parseInt(process.env.PORT || '3099', 10);

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`RentVerse API listening on port ${PORT}`);
});

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled rejection: ${error.message}`);
  server.close(() => process.exit(1));
});

function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
