const { BlockchainApiError } = require('./errors');

function blockchainErrorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof BlockchainApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  const clientError = Number.isInteger(error.statusCode)
    && error.statusCode >= 400
    && error.statusCode < 500;

  if (!clientError) {
    console.error('Unhandled API error:', error);
  }

  res.status(clientError ? error.statusCode : 500).json({
    success: false,
    error: {
      code: clientError && error.code ? error.code : 'INTERNAL_SERVER_ERROR',
      message: clientError
        ? error.message
        : 'An unexpected server error occurred.',
    },
  });
}

module.exports = { blockchainErrorHandler };
